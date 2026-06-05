# 블록 템플릿 렌더링 설계

## 목표
- Markdown 형태에 맞춰 만든 기존 AST 파이프라인을 없애고, parser block이 만든 템플릿 렌더 입력으로 본문을 렌더링한다.
- 모든 parser block을 독립적인 출력 단위로 다룬다.
- 사용자는 실제 export 범위에서 검출된 parser block마다 최종 템플릿 문자열을 직접 편집할 수 있다.
- export 파일 확장자는 계속 `.md`로 유지한다.
- `${...}` 안에서는 JavaScript와 비슷한 표현식을 쓰되, 사용자 JavaScript 코드는 실행하지 않는다.

## 확정한 결정
- 중간 본문 항목 이름은 `BlockRenderInput`으로 쓴다.
- parser에서 renderer로 넘어가는 본문 파이프라인에서는 `AstBlock` 개념을 제거한다.
- `BlockRenderInput` 안에는 editor type, parser block id, label, option metadata를 넣지 않는다.
- fallback AST block은 두지 않는다.
- export option에는 최종 template string 하나만 저장한다.
- preset 버튼은 template textarea 값을 바꾸는 용도로만 쓴다.
- `${...}` 표현식은 Oxc로 파싱하고, 직접 만든 evaluator가 허용된 AST node만 계산한다.
- `eval`, `new Function`, `node:vm`, `vm2`, 서드파티 expression evaluator는 실행 용도로 쓰지 않는다.

## 제외 범위
- `.mdx` output은 추가하지 않는다.
- 기존 `blockOutputs.defaults` option shape의 하위 호환 처리는 두지 않는다.
- 서로 다른 parser block을 도메인 개념으로 묶지 않는다.
- renderer에 parser metadata를 넘기지 않는다.
- template 실패 시 조용히 fallback하지 않는다.

## 현재 상태
- 현재 parser block은 Markdown 렌더링에 맞춘 `AstBlock[]`를 반환한다.
- 현재 output option은 `blockOutputs.defaults` 아래에 `{ variant, params }` 형태로 저장된다.
- 현재 선택 가능한 output key는 `editorType:blockId` 형식이다.
- 여러 parser block이 같은 block id를 공유한다. 특히 `linkCard` 계열에서 이 문제가 크다.
- 책 위젯과 소재 카드 parser block은 원본에서 얻은 named field를 보존하지 못하고, `image`와 `paragraph`로 쪼개면서 의미 있는 prop 이름을 잃는다.
- 최근 추가된 detected-block 흐름은 Markdown 옵션 단계 전에 실제 export 대상 글을 스캔한다.
- 현재 글별 export는 병렬로 돌지만, 업로드는 export 이후 별도 phase에서 Markdown을 다시 rewrite한다.
- 현재 render 단계 안에서 asset path를 resolve한다.

## 새 Export 기준
- export의 병렬 실행 단위는 글 하나의 pipeline이다.
- 각 글 pipeline은 source fetch부터 Markdown write까지 자기 글에 필요한 단계를 순서대로 끝낸다.
- asset resolve는 rendering 전에 끝낸다.
- renderer는 이미 최종 URL이 들어간 props만 받는다.
- asset resolve와 upload registry는 export job 전체에서 공유한다.
- 같은 asset은 같은 export job 안에서 한 번만 다운로드하고 한 번만 업로드한다.
- `download-and-upload` 모드는 Markdown을 먼저 쓰고 나중에 rewrite하지 않는다.
- `download-and-upload` 모드는 글 pipeline 안에서 업로드까지 끝낸 뒤 최종 업로드 URL로 render한다.
- 따라서 업로드 provider key와 provider fields는 export 시작 전에 확정되어야 한다.
- 업로드 provider fields는 runtime에서만 쓰고 manifest, job state, log에는 저장하지 않는다.
- 글 하나가 실패해도 다른 글 pipeline은 계속 실행할 수 있다.
- 실패한 글은 어느 stage에서 어떤 이유로 실패했는지 manifest와 UI item에 남긴다.

## Post Pipeline Stage
각 글 pipeline의 stage는 다음 순서를 기준으로 한다.

- `fetch`: post HTML을 가져온다.
- `preprocess`: HTML을 parser block으로 읽고 `BlockRenderInput` 초안, `AssetCandidate`, post-level metadata를 만든다.
- `asset-download`: `AssetCandidate`를 기준으로 image/thumbnail binary를 내려받거나 remote reference로 확정한다.
- `asset-upload`: `download-and-upload` 모드에서 job 단위 `UploadRegistry`를 보고 최종 URL을 확정한다. 업로드가 없는 모드에서는 skipped stage다.
- `render`: template expression을 계산해 Markdown body와 frontmatter를 만든다.
- `write`: Markdown 파일과 글 단위 결과를 쓴다.

stage 실패 기록은 다음 정보를 담는다.

```ts
type PostPipelineFailure = {
  stage: "fetch" | "preprocess" | "asset-download" | "asset-upload" | "render" | "write"
  message: string
}
```

## 핵심 타입
```ts
type TemplateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TemplateValue[]
  | { [key: string]: TemplateValue }

type BlockRenderInput = {
  template: string
  props: Record<string, TemplateValue>
}

type AssetCandidate = {
  assetRole: "image" | "thumbnail"
  sourceUrl: string
  targetPropPath: string[]
  dedupKey: string
  required: boolean
}

type UploadRegistryEntry = {
  uploadKey: string
  status: "pending" | "uploading" | "uploaded" | "failed"
  localPath: string
  uploadedUrl?: string
  message?: string
}

type UploadRegistry = Record<string, UploadRegistryEntry>

type TemplatePropDefinition = {
  label: string
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "string?"
    | "number?"
    | "boolean?"
    | "object?"
    | "array?"
}

type BlockTemplateDefinition = {
  key: string
  label: string
  presets: {
    id: string
    label: string
    template: string
  }[]
  props: Record<string, TemplatePropDefinition>
}
```

## ParsedPost 형태
- `ParsedPost`는 AST block 대신 `renderInputs: BlockRenderInput[]`를 노출한다.
- `ParsedPost`는 `assetCandidates: AssetCandidate[]`도 함께 노출한다.
- 비디오 metadata처럼 export나 manifest에서 필요한 post-level 파생 데이터는 `BlockRenderInput` 밖에 둘 수 있다.
- 이런 파생 데이터는 본문 항목의 renderer metadata로 쓰지 않는다.

## Parser Block 계약
- 각 parser block은 자신의 template definition을 직접 소유한다.
- 각 parser block은 원본 HTML에서 named `props`를 추출한다.
- 각 parser block은 `BlockRenderInput[]`를 반환한다.
- asset이 있는 parser block은 `AssetCandidate[]`도 반환한다.
- `AssetCandidate.assetRole`은 `downloadImages`, `downloadThumbnails`, thumbnail 기록처럼 역할별 option을 고르는 데만 쓴다.
- `AssetCandidate.targetPropPath`는 최종 URL을 주입할 `props` 위치를 가리킨다.
- `AssetCandidate.sourceUrl`은 asset resolver 입력으로만 쓰고 template props로 노출하지 않는다.
- `AssetCandidate.assetRole`은 같은 asset인지 판단하는 dedupe 기준에 넣지 않는다.
- 빈 output은 source chrome, 빈 placeholder, 의도적으로 버릴 node에만 허용한다.
- 내용이 있는 matched node는 render input을 만들거나 명시적으로 throw해야 한다.

## Template Definition 계약
- `presets`는 최소 1개 이상이어야 한다.
- 기본 template은 항상 `presets[0].template`이다.
- parser block은 가장 흔히 쓰일 template을 `presets[0]`에 둔다.
- preset id는 UI용 값이며 renderer option으로 저장하지 않는다.
- `props`는 UI에 보여줄 변수 명세다. 실제 렌더링 값은 `BlockRenderInput.props`에만 들어간다.
- nullable 또는 없을 수 있는 값은 `string?`, `number?`, `boolean?`, `object?`, `array?`처럼 `?` suffix로 표시한다.
- template definition key는 검출, UI 필터링, option 저장에만 쓴다.

props 명세 예:
```ts
props: {
  name: { label: "책 제목", type: "string" },
  author: { label: "저자", type: "string?" },
  thumbnailUrl: { label: "썸네일 URL", type: "string?" }
}
```

## Key 정책
- 기존 `editorType:blockId`는 안정적인 parser block instance key로 대체한다.
- 새 key는 block 순서가 바뀌어도 유지되어야 한다.
- 새 key는 parser block class 이름에서 자동으로 만들지 않고, parser block definition이 직접 소유한다.
- 새 key는 같은 id를 공유하던 parser block instance를 서로 구분해야 한다.
- 예시는 다음과 같다.
  - `naver-se4:ogLinkCard`
  - `naver-se4:fileAttachment`
  - `naver-se4:mapCard`
  - `naver-se3:subjectMatterBook`
  - `naver-se2:bookWidget`
- 이 key는 `BlockRenderInput` 안에 넣지 않는다.

## Export Options
기존 형태:
```ts
blockOutputs: {
  defaults: {
    [key: string]: {
      variant: string
      params?: Record<string, string | number | boolean>
    }
  }
}
```

새 형태:
```ts
blockOutputs: {
  templates: {
    [key: string]: string
  }
}
```

- `templates[key]`가 없으면 parser block definition의 `presets[0].template`을 쓴다.
- 저장된 기존 `blockOutputs.defaults` 값은 읽지 않는다.
- legacy alias나 migration shim은 추가하지 않는다.

## 렌더링 흐름
- editor가 parser block을 match한다.
- parser block이 props를 추출한다.
- editor가 해당 parser block key로 선택된 template을 찾는다.
- parser block은 `{ template, props }`를 반환한다.
- asset resolver가 `AssetCandidate`를 처리하고 최종 URL을 `targetPropPath` 위치의 `props`에 주입한다.
- renderer는 `props`를 기준으로 `${...}` 표현식을 계산한다.
- renderer는 각 본문 항목의 결과를 빈 줄로 이어 붙여 `.md` 본문을 만든다.

## Template 문법
- 일반 텍스트는 그대로 복사한다.
- `${expression}`은 expression 하나를 계산한다.
- expression은 JavaScript와 비슷하게 쓰지만 JavaScript로 실행하지 않는다.
- Oxc는 expression을 AST로 파싱한다.
- 직접 만든 evaluator가 허용된 node와 method만 계산한다.

초기 허용 범위:
- identifier와 member access, optional chaining 포함
- array indexing
- string, number, boolean, null, undefined literal
- 산술 연산자: `+`, `-`, `*`, `/`, `%`
- 비교와 동등성: `===`, `!==`, `<`, `>`, `<=`, `>=`
- 논리와 nullish 연산자: `&&`, `||`, `??`
- conditional expression
- template literal
- 허용된 array method 안에서 쓰는 arrow function
- array method: `map`, `filter`, `join`, `slice`
- string method: `trim`, `replace`, `toLowerCase`, `toUpperCase`

차단 범위:
- `process`, `require`, `globalThis`, `window`, `document`
- `constructor`, `prototype`, `__proto__`
- 임의 함수 호출
- assignment와 update expression
- statement, loop, class, import, dynamic import, await
- object mutation
- 초기 단계의 regular expression literal

## Evaluator 안전 규칙
- props로 들어온 JavaScript function은 절대 호출하지 않는다.
- 사용자 값에서 native prototype method를 직접 호출하지 않는다.
- 허용된 method도 evaluator operation으로 직접 구현한다.
- 허용하는 값은 string, number, boolean, null, array, plain object, undefined로 제한한다.
- function, class instance, Date, RegExp, Map, Set, WeakMap, WeakSet, Promise, symbol은 거부한다.
- member access의 모든 단계에서 차단된 property name 접근을 거부한다.
- expression 길이, AST 깊이, property access 깊이, output 길이, array 길이, iteration 수에 상한을 둔다.
- 최종 expression 값은 string, number, boolean만 허용한다.
- 최종 값이 `null` 또는 `undefined`이면 실패한다. 사용자는 `??`, `||`, conditional expression으로 직접 fallback을 써야 한다.
- 최종 값이 array나 object여도 실패한다.

## 오류 처리
- template parse error는 export 실패로 처리한다.
- 차단된 expression syntax는 export 실패로 처리한다.
- 없는 변수나 property 접근은 export 실패로 처리한다.
- 최종 값이 허용 타입이 아니면 export 실패로 처리한다.
- asset URL 해석 실패는 기존 asset failure mode를 따른다.
- template renderer는 expression text와 짧은 reason만 반환한다.
- caller는 template definition key와 post pipeline stage를 붙여 export 오류 메시지를 만든다.

예:
```txt
Cannot evaluate block template expression: naver-se3:subjectMatterBook
expression: author.name
reason: missing property
```

## Asset 처리
- asset discovery는 렌더링된 Markdown 문자열이 아니라 parser block이 만든 `AssetCandidate`를 기준으로 한다.
- template이 asset 변수를 쓰지 않아도 parser block이 `AssetCandidate`를 만들면 기존 asset option대로 다운로드/업로드한다.
- image parser block은 `${url}`만 노출한다.
- image parser block에서 `${url}`은 Markdown에 넣을 최종 이미지 URL이다.
- template props에는 원본 이미지 URL을 노출하지 않는다.
- `originalSourceUrl`, `sourceUrl`, `thumbnailSourceUrl` 필드는 template props에 두지 않는다.
- 링크성 block은 이동 링크를 `linkUrl`로 노출한다.
- 썸네일이 있는 block은 최종 썸네일 URL을 `thumbnailUrl`로 노출한다.
- asset resolver는 source URL을 최종 URL로 해석한 뒤 renderer에 넘긴다.
- `remote` 모드의 최종 URL은 원본 URL이다.
- `download` 모드의 최종 URL은 로컬 Markdown 파일에서 바라보는 상대경로다.
- `download-and-upload` 모드의 최종 URL은 업로드 provider가 반환한 URL이다.
- `download-and-upload` 모드에서는 Markdown을 쓴 뒤 URL을 rewrite하지 않는다.
- body thumbnail 기록은 렌더링된 Markdown을 다시 파싱하지 않고 image props를 기준으로 한다.
- asset manifest도 `AssetCandidate`와 asset resolve 결과를 기준으로 만든다.
- 사용자가 template에서 `${url}`을 쓰지 않아도 asset discovery는 export asset option을 따른다.

image props 예:
```ts
{
  url: "assets/image.png",
  alt: "",
  caption: "..."
}
```

image asset candidate 예:
```ts
{
  assetRole: "image",
  sourceUrl: "https://...",
  targetPropPath: ["url"],
  dedupKey: "https://...",
  required: true
}
```

## Upload Cache 전략
같은 이미지가 다시 업로드되지 않도록 export job 하나가 다운로드 cache와 upload registry를 공유한다.

- source URL은 asset resolver 진입 시 normalize한다.
- `remote` 모드에서는 binary를 받지 않고 `targetPropPath`에 원본 URL을 주입한다.
- `download`, `download-and-upload` 모드에서는 normalize한 source URL을 먼저 in-flight download cache에서 찾는다.
- 같은 source URL을 여러 글 pipeline이 동시에 요청하면 첫 요청만 다운로드하고, 나머지는 같은 promise를 기다린다.
- 다운로드한 binary는 content hash로 저장한다.
- source URL이 달라도 binary hash가 같으면 같은 local asset path를 쓴다.
- `download` 모드에서는 local asset path에서 현재 Markdown 파일 기준 상대경로를 계산해 `targetPropPath`에 주입한다.
- `download-and-upload` 모드에서는 local asset path로 `uploadKey`를 만든다.
- `UploadRegistry`는 export job 전체에서 공유한다.
- `UploadRegistry[uploadKey]`가 `uploaded`이면 기존 `uploadedUrl`을 바로 `targetPropPath`에 주입한다.
- `UploadRegistry[uploadKey]`가 `uploading`이면 새 업로드를 시작하지 않고 기존 업로드 promise를 기다린다.
- `UploadRegistry[uploadKey]`가 없거나 `pending`이면 한 pipeline만 업로드를 시작하고 status를 `uploading`으로 바꾼다.
- 업로드 성공 시 status를 `uploaded`로 바꾸고 `uploadedUrl`을 저장한다.
- 업로드 실패 시 status를 `failed`로 바꾸고 실패 message를 저장한다.
- 같은 `uploadKey`를 기다리던 글은 같은 `uploadedUrl`을 받거나 같은 `asset-upload` 실패 reason을 받는다.
- 업로드 성공과 실패는 provider fields 없이 job state와 manifest에 저장한다.
- export가 중단됐다가 resume되면 manifest의 uploaded entry를 `UploadRegistry`에 먼저 seed한다.
- resume 뒤 이미 uploaded entry가 있는 asset은 다시 업로드하지 않는다.
- resume 뒤 새 업로드가 필요한 asset이 있으면 사용자가 provider fields를 다시 입력해야 한다.

업로드 cache 가드레일:
- 같은 export job 안에서 같은 `uploadKey`는 upload client에 최대 한 번만 전달되어야 한다.
- 같은 `uploadKey`를 쓰는 모든 post pipeline은 같은 `uploadedUrl`을 써야 한다.
- 이미 uploaded entry가 manifest에 있으면 같은 `uploadKey`를 다시 업로드하면 안 된다.
- provider secret은 manifest, job state, log, failure message에 남기면 안 된다.
- 업로드 실패가 난 asset을 쓰는 글은 `asset-upload` stage 실패로 기록해야 한다.
- 실패한 asset을 쓰지 않는 글은 계속 export되어야 한다.

## Table 처리
- table parser block은 row와 cell 구조를 props로 노출한다.
- 미리 렌더링한 `markdown`, `html`, `complex` 값도 함께 노출한다.
- 기본 preset은 현재 동작을 최대한 유지한다.

기본 table template 예:
```md
${complex ? html : markdown}
```

custom table template 예:
```md
${rows.map(row => `| ${row.cells.map(cell => cell.text).join(" | ")} |`).join("\n")}
```

## Book과 Link Card 계열
- book, subject matter, link, map, schedule, file, video 같은 parser block은 각자 block-specific props를 노출한다.
- 서로 다른 parser block의 props를 도메인 단위로 통합하지 않는다.
- 같은 parser block이 실제로 같은 원본 구조를 다룰 때만 같은 prop 구조를 쓴다.

book widget props 예:
```ts
{
  name: "Casterbridge Mayor",
  author: "Thomas Hardy",
  publisher: "Moonji",
  publishedAt: "2016.07.15.",
  thumbnailUrl: "assets/book.jpg",
  linkUrl: "http://book.naver.com/...",
  linkLabel: "Detail"
}
```

## UI 흐름
- Markdown options step은 block template editing step으로 바뀐다.
- detected-block scan은 parser block key 기준으로 template definition을 필터링한다.
- 실제 export scope에서 검출된 parser block만 UI에 표시한다.
- `download-and-upload` 모드에서는 export 시작 전에 upload provider key와 provider fields를 입력받는다.
- 결과 화면에서 업로드를 나중에 시작하는 흐름은 새 pipeline 기준에서는 쓰지 않는다.
- 각 card에는 다음 내용을 보여준다.
  - parser block label
  - preset buttons
  - template textarea
  - 지원 변수 목록
  - preview
  - template validation error
- preview는 export와 같은 template renderer를 쓴다.
- 지원 변수 목록은 parser block definition의 `props` 명세를 보여준다.
- preview는 detection에서 수집한 대표 `BlockRenderInput.props` 값을 쓴다.
- preset button은 textarea 값만 바꾼다.

## Detection 흐름
- scope 선택 뒤 block을 검출하는 현재 흐름은 유지한다.
- detection 결과는 검출된 template definition key를 반환한다.
- detection은 preview에 쓸 대표 `BlockRenderInput.props` 값도 함께 반환한다.
- renderer로 parser metadata를 넘기지 않는다.
- detection은 all-or-nothing으로 둔다. 일부 post parse 실패 때문에 필요한 template이 숨겨지는 일을 막기 위해서다.
- detection 실패는 export pipeline 실패 정책이 아니다.
- detection이 실패하면 partial template list를 저장하지 않고 실패한 post와 reason을 UI에 보여준다.
- export 실행 중 parse 실패는 글 단위 `preprocess` stage 실패로 기록하고 다른 글은 계속 export한다.

## 테스트
- parser block spec은 props 추출과 기본 template 렌더링을 검증한다.
- template renderer spec은 허용된 expression이 계산되는지 검증한다.
- security spec은 blocked globals, blocked property names, arbitrary calls, mutation attempts, malformed expressions를 검증한다.
- asset/export spec은 parser block의 `AssetCandidate`를 수집하고 렌더링 전에 최종 URL을 `targetPropPath`에 주입하는지 검증한다.
- post pipeline spec은 `fetch`, `preprocess`, `asset-download`, `asset-upload`, `render`, `write` stage 실패가 글 단위 결과에 남는지 검증한다.
- upload export spec은 `download-and-upload` 모드에서 render 전에 업로드 URL이 props에 들어가고 Markdown rewrite가 발생하지 않는지 검증한다.
- upload export spec은 같은 `uploadKey`가 동시에 여러 글에서 필요해도 upload client가 한 번만 호출되는지 검증한다.
- upload export spec은 resume 시 manifest의 uploaded entry를 seed해 같은 asset을 다시 업로드하지 않는지 검증한다.
- upload security spec은 provider fields와 secret이 manifest, job state, log, failure message에 남지 않는지 검증한다.
- UI spec은 detected template 표시, preset-to-textarea 동작, preview 갱신, validation error 표시를 검증한다.
- UI spec은 `download-and-upload` 모드에서 export 시작 전에 upload provider 입력을 요구하는지 검증한다.
- UI spec은 post별 stage와 reason을 manifest와 같은 의미로 보여주는지 검증한다.
- detection spec은 parse 실패 시 partial template list를 저장하지 않고 실패 post와 reason을 보여주는지 검증한다.
- fixture regression은 기본 preset이 기존 Markdown output을 최대한 유지하는지 확인한다.

## 깨질 테스트와 재작성 계획
이 설계가 구현되면 기존 AST, block output option, post-export upload rewrite 전제에 묶인 테스트는 깨진다. 깨지는 테스트는 기존 기대값을 억지로 유지하지 않고 새 pipeline 기준으로 다시 쓴다.

| 테스트 영역 | 깨지는 이유 | 새 기대값 |
|---|---|---|
| `src/domain/ast/Types.ts` 의존 테스트 | `AstBlock`, `BlockType`, `ParsedPost.blocks`가 사라진다. | `BlockRenderInput`, `BlockTemplateDefinition`, `ParsedPost.renderInputs` 기준으로 타입과 fixture를 바꾼다. |
| parser block specs | `convert()` 결과가 `paragraph`, `image`, `table` AST가 아니라 template input과 props가 된다. | 각 block spec은 `template`, `props`, `AssetCandidate`를 검증한다. 기본 template render 결과도 함께 확인한다. |
| `MarkdownRenderer.spec.ts` | renderer가 AST별 Markdown 분기와 render 중 asset resolve를 하지 않는다. | template renderer spec으로 재구성하고, asset resolve가 끝난 props만 받아 Markdown을 만드는지 확인한다. |
| `ExportOptions.spec.ts`, persisted option specs | `blockOutputs.defaults`와 `{ variant, params }`가 없어지고 `blockOutputs.templates`만 남는다. | old `defaults`는 읽지 않고, 저장값은 template string만 유지하는지 확인한다. |
| `DetectedBlockOutputScanner.spec.ts`, route specs | 검출 대상이 `outputSelectionKey`가 아니라 template definition key다. | 실제 export scope에서 검출된 stable template key와 대표 props를 반환하는지 확인한다. |
| `NaverBlogExporter.spec.ts`, `PostExportUnit` 관련 테스트 | render 중 asset resolve, export 후 upload-ready 상태, rewrite 전제가 바뀐다. | 글 단위 pipeline stage 순서, render 전 final URL 주입, stage 실패 기록, post별 병렬 실행, upload registry 공유를 확인한다. |
| `ImageUploadRewriter` 관련 tests | post-export Markdown rewrite 흐름을 제거한다. | 해당 rewrite 테스트는 삭제하거나, upload URL 검증 helper만 asset resolver/upload stage 테스트로 옮긴다. |
| server upload route specs | `/api/export/:jobId/upload`로 upload-ready job을 나중에 시작하는 흐름이 사라진다. | export request가 upload provider payload를 먼저 받는지, upload stage가 pipeline 안에서 실행되는지, provider secret이 저장되지 않는지 확인한다. |
| upload progress/resume specs | job 뒤에서 한 번에 업로드하던 흐름이 글 pipeline 안의 공유 registry로 바뀐다. | 같은 `uploadKey` 중복 업로드 방지, uploaded URL 재사용, resume seed, partial failure의 stage/reason을 확인한다. |
| UI upload specs와 e2e smoke | result panel의 upload-ready/uploading 수동 시작 UI가 사라진다. | assets/options 단계나 export 시작 직전에 provider 입력 UI가 나오고, job row가 post pipeline stage와 failure reason을 보여주는지 확인한다. |
| sample fixture regression | 기본 preset이 기존 Markdown을 최대한 재현하지만 block props/template 전환으로 일부 문자열이 달라질 수 있다. | 기본 preset 결과를 기준으로 expected markdown을 갱신한다. 의도된 차이는 fixture 설명에 남긴다. |
| parser story catalog tests | story output이 AST preview가 아니라 template definition과 props preview로 바뀐다. | catalog는 parser block의 stable key, preset list, prop definition을 검증한다. |

우선 재작성할 테스트 순서는 다음과 같다.

1. Type/domain tests: `BlockRenderInput`, `BlockTemplateDefinition`, `blockOutputs.templates` 계약을 고정한다.
2. Template evaluator tests: 허용 expression과 차단 expression을 먼저 고정한다.
3. Parser block focused specs: image, table, book widget, subject matter, link card를 props와 `AssetCandidate` 기준으로 바꾼다.
4. Asset resolver/export unit tests: `AssetCandidate`에서 final URL을 render 전에 주입하는지 확인한다.
5. Upload registry tests: 같은 `uploadKey` 중복 업로드 방지, uploaded URL 재사용, resume seed, secret 비노출을 확인한다.
6. Post pipeline tests: stage success/failure와 병렬 실행 결과를 확인한다.
7. UI option tests: block template editor와 pre-export upload provider 입력을 확인한다.
8. E2E smoke와 sample fixtures: 새 end-to-end 흐름 기준으로 마지막에 갱신한다.

## 검증 명령
- parser block 계약 변경은 `pnpm test:parser-blocks`로 확인한다.
- evaluator 작업 중에는 focused template renderer spec을 실행한다.
- 저장소 코드 변경 뒤에는 `pnpm check:local`을 실행한다.
- template editor UI 변경 뒤에는 `pnpm smoke:ui`를 실행한다.

## 구현 범위
- `AstBlock` body output을 `BlockRenderInput`으로 교체한다.
- `ParsedPost.renderInputs`와 parser block 반환 계약을 바꾼다.
- `ParsedPost.assetCandidates`와 `AssetCandidate` 계약을 추가한다.
- 글 하나를 `fetch -> preprocess -> asset-download -> asset-upload -> render -> write` pipeline으로 실행한다.
- export concurrency는 글 pipeline 단위로 적용한다.
- 글 단위 실패 결과에 실패 stage와 reason을 저장한다.
- Markdown renderer 내부를 template renderer로 교체한다.
- 필요하면 Oxc parser dependency를 추가한다.
- custom expression evaluator를 추가한다.
- `blockOutputs.defaults`를 `blockOutputs.templates`로 교체한다.
- output definition을 parser block instance template definition으로 바꾼다.
- detected block scanning이 template definition key를 쓰도록 바꾼다.
- image, table, video, link card, book widget, subject matter block을 props 기반 렌더링으로 전환한다.
- asset과 thumbnail phase가 `AssetCandidate`를 기준으로 동작하게 바꾼다.
- job 단위 `UploadRegistry`로 같은 asset의 중복 업로드를 막는다.
- `download-and-upload`의 post-export Markdown rewrite 흐름을 제거한다.
- upload provider 입력을 export 시작 전 옵션 또는 요청 payload로 옮긴다.
- upload provider fields가 manifest, job state, log에 남지 않게 한다.
- Markdown options UI를 block template editor로 바꾼다.
- 코드 변경이 실제로 들어갈 때 관련 knowledge 문서도 함께 갱신한다.

## 외부 근거
- Node.js 문서는 `node:vm`이 security mechanism이 아니라고 설명한다.
- Oxc 문서는 `oxc-parser`와 `parseSync(filename, sourceText, options?)` API를 설명한다.
- NVD CVE-2025-12735는 context 검증이 부족한 expression evaluator가 RCE로 이어질 수 있음을 보여준다.
- `vm2` npm package에는 critical security warning과 discontinued 이력이 있다.
- `isolated-vm`, QuickJS, SES는 더 강한 실행 격리 선택지지만, 이 설계는 사용자 JavaScript 실행 자체를 피한다.
