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
- 비디오 metadata처럼 export나 manifest에서 필요한 post-level 파생 데이터는 `BlockRenderInput` 밖에 둘 수 있다.
- 이런 파생 데이터는 본문 항목의 renderer metadata로 쓰지 않는다.

## Parser Block 계약
- 각 parser block은 자신의 template definition을 직접 소유한다.
- 각 parser block은 원본 HTML에서 named `props`를 추출한다.
- 각 parser block은 `BlockRenderInput[]`를 반환한다.
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
  thumbnail: { label: "썸네일", type: "string?" }
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
- 오류 메시지에는 template definition key, expression text, 짧은 reason을 포함한다.

예:
```txt
Cannot evaluate block template expression: naver-se3:subjectMatterBook
expression: author.name
reason: missing property
```

## Asset 처리
- asset discovery는 렌더링된 Markdown 문자열이 아니라 parser block props를 기준으로 한다.
- template이 asset 변수를 쓰지 않아도 parser block props에 asset 후보가 있으면 기존 asset option대로 다운로드/업로드한다.
- image parser block은 원본 URL과 최종 render URL 필드를 모두 노출한다.
- `${url}`은 Markdown에 넣을 최종 URL이다.
- `${sourceUrl}`은 네이버 원본 URL이다.
- asset phase는 source URL을 최종 URL로 해석한 뒤 renderer에 넘긴다.
- body thumbnail 기록은 렌더링된 Markdown을 다시 파싱하지 않고 image props를 기준으로 한다.
- asset manifest도 props에서 찾은 asset candidate를 기준으로 만든다.
- 사용자가 template에서 `${url}` 대신 `${sourceUrl}`을 쓰더라도 asset discovery는 export asset option을 따른다.

image props 예:
```ts
{
  url: "assets/image.png",
  sourceUrl: "https://...",
  originalSourceUrl: "https://...",
  alt: "",
  caption: "..."
}
```

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
  thumbnail: "assets/book.jpg",
  sourceUrl: "http://book.naver.com/...",
  linkLabel: "Detail"
}
```

## UI 흐름
- Markdown options step은 block template editing step으로 바뀐다.
- detected-block scan은 parser block key 기준으로 template definition을 필터링한다.
- 실제 export scope에서 검출된 parser block만 UI에 표시한다.
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

## 테스트
- parser block spec은 props 추출과 기본 template 렌더링을 검증한다.
- template renderer spec은 허용된 expression이 계산되는지 검증한다.
- security spec은 blocked globals, blocked property names, arbitrary calls, mutation attempts, malformed expressions를 검증한다.
- asset/export spec은 props에서 asset candidate를 수집하고 렌더링 전에 최종 URL을 주입하는지 검증한다.
- UI spec은 detected template 표시, preset-to-textarea 동작, preview 갱신, validation error 표시를 검증한다.
- fixture regression은 기본 preset이 기존 Markdown output을 최대한 유지하는지 확인한다.

## 검증 명령
- parser block 계약 변경은 `pnpm test:parser-blocks`로 확인한다.
- evaluator 작업 중에는 focused template renderer spec을 실행한다.
- 저장소 코드 변경 뒤에는 `pnpm check:local`을 실행한다.
- template editor UI 변경 뒤에는 `pnpm smoke:ui`를 실행한다.

## 구현 범위
- `AstBlock` body output을 `BlockRenderInput`으로 교체한다.
- `ParsedPost.renderInputs`와 parser block 반환 계약을 바꾼다.
- Markdown renderer 내부를 template renderer로 교체한다.
- 필요하면 Oxc parser dependency를 추가한다.
- custom expression evaluator를 추가한다.
- `blockOutputs.defaults`를 `blockOutputs.templates`로 교체한다.
- output definition을 parser block instance template definition으로 바꾼다.
- detected block scanning이 template definition key를 쓰도록 바꾼다.
- image, table, video, link card, book widget, subject matter block을 props 기반 렌더링으로 전환한다.
- asset과 thumbnail phase가 props를 기준으로 동작하게 바꾼다.
- Markdown options UI를 block template editor로 바꾼다.
- 코드 변경이 실제로 들어갈 때 관련 knowledge 문서도 함께 갱신한다.

## 외부 근거
- Node.js 문서는 `node:vm`이 security mechanism이 아니라고 설명한다.
- Oxc 문서는 `oxc-parser`와 `parseSync(filename, sourceText, options?)` API를 설명한다.
- NVD CVE-2025-12735는 context 검증이 부족한 expression evaluator가 RCE로 이어질 수 있음을 보여준다.
- `vm2` npm package에는 critical security warning과 discontinued 이력이 있다.
- `isolated-vm`, QuickJS, SES는 더 강한 실행 격리 선택지지만, 이 설계는 사용자 JavaScript 실행 자체를 피한다.
