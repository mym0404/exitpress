# 블로그 Provider 리팩토링 설계

## 목표
- 현재 Naver 전용 export 구조를 여러 블로그 provider를 붙일 수 있는 구조로 바꾼다.
- 첫 범위에서는 기존 Naver 사용자 기능을 바꾸지 않고 `blog-naver` 패키지와 provider 하네스를 만든다.
- `blog-tistory` 패키지는 최소 공개 글 export만 provider 하네스에서 검증한다.
- `domain`과 `engine`은 블로그 플랫폼 이름과 전용 fetcher 구현을 모르는 코어 계약을 가진다.
- 블로그, fetcher, parser, editor, block parser 같은 공통 개념의 타입과 추상 설계는 `domain`이나 `engine`에만 둔다.
- 원문 수집 결과는 HTML에 고정하지 않고 Markdown, HTML, provider-native content를 담을 수 있는 중간 문서로 다룬다.
- 리팩토링은 e2e 테스트를 먼저 만들고 그 테스트를 통과시키는 순서로 진행한다.

## 확정한 결정
- 첫 마일스톤은 `Naver 추출`이다.
- `server` route, job, state 변경은 이번 범위에서 제외한다.
- `web` 변경은 provider 추상화 검증에 꼭 필요한 최소 변경만 허용한다.
- `blog-naver`는 새 provider 경로의 Naver URL 해석, fetcher, parser, editor, parser block, default block template, 같은 블로그 링크 식별을 소유한다.
- `blog-tistory`는 최소 provider adapter로 만든다.
- `blog-*` 패키지는 공통 abstraction을 정의하지 않고 provider별 구현체와 package-local helper만 둔다.
- Tistory 검증은 UI/server e2e가 아니라 engine/provider live e2e로 한다.
- live network e2e와 업로드 credential e2e는 최상위 검증 기준이다.
- unit, parser fixture, contract test는 e2e를 보조하는 검증이다.
- Fetcher 설계는 우회가 아니라 정중한 수집과 중단/백오프를 기준으로 한다.

## 제외 범위
- 이번 범위에서는 `server`의 route, job runner, state repository를 provider registry 기반으로 바꾸지 않는다.
- 이번 범위에서는 `server`가 Naver 전용 entrypoint를 전혀 모르는 상태까지 만들지 않는다.
- 이번 범위에서는 `server`가 직접 import하는 기존 Naver entrypoint를 제거하지 않는다.
- 이번 범위에서는 Tistory를 UI wizard에서 선택할 수 있게 만들지 않는다.
- 이번 범위에서는 Tistory upload, resume, image rewrite UI를 구현하지 않는다.
- Medium provider는 이번 범위에서 만들지 않는다.
- CAPTCHA, IP rotation, VPN, proxy rotation, fingerprint spoofing, stealth browser 같은 bot 탐지 우회 전략은 설계하지 않는다.
- 하위 호환 wrapper, deprecated alias, re-export shim은 만들지 않는다.

## 현재 결합 지점
- `domain`은 `NaverUrl.ts`와 `blogId` 중심 계약 때문에 Naver URL과 식별자를 안다.
- `engine`은 `NaverBlogFetcher`, `NaverBlogExporter`, `parsePostHtml`, `NaverBlog`, `naver-se*` editor와 block을 직접 안다.
- `server`는 scan route, block scan job, export job에서 Naver fetcher와 exporter를 직접 안다.
- `web`은 `blogIdOrUrl`, `naver-se2`, `naver-se3`, `naver-se4` label을 일부 하드코딩한다.
- 기존 export 단위는 `fetchPostHtml` 뒤 `parsePostHtml`을 호출하는 HTML 전용 흐름에 묶여 있다.

## 목표 구조
```text
packages/domain
  - provider-neutral schema
  - shared provider, source, post, content, parser contracts
  - export options, manifest, parsed block contracts

packages/engine
  - provider-neutral export pipeline
  - runtime interfaces and base classes for fetcher, parser, editor, block parser
  - asset store, markdown rendering, upload rewrite
  - provider contract test harness

packages/blog-naver
  - provider-harness Naver source parsing
  - provider-harness Naver fetcher
  - provider-harness SE2/SE3/SE4 editors
  - provider-harness Naver parser blocks
  - provider-harness Naver default block templates
  - provider-harness Naver same-blog link identity

packages/blog-tistory
  - Tistory source parsing
  - minimal public post loader
  - minimal HTML content parser
  - provider harness fixtures

packages/server
  - unchanged in this scope

packages/web
  - unchanged unless provider metadata is needed by engine-facing tests
```

## 핵심 계약
- 공통 타입과 계약은 `domain` 또는 `engine`에만 존재한다.
- `domain`은 직렬화 가능한 schema, literal union, shared DTO, 순수 helper를 소유한다.
- `engine`은 런타임 인터페이스, abstract/base class, export pipeline, provider harness를 소유한다.
- `blog-*`는 core 계약을 구현하는 concrete provider, concrete fetcher, concrete parser, concrete editor, concrete block parser만 소유한다.
- `blog-*`에 `Base*`, `Abstract*`, provider-neutral `*Contract`, provider-neutral `*Schema`를 새로 만들지 않는다.

```ts
type BlogProvider = {
  key: string
  label: string
  parseSource(input: string): BlogSource
  scan(input: BlogScanInput): Promise<BlogScanResult>
  loadPostContent(input: BlogPostContentInput): Promise<BlogContentDocument>
  parseContent(input: BlogContentParseInput): ParsedPost
  getBlockTemplateDefinitions(): BlockTemplateDefinition[]
  resolvePostLinkIdentity?: (url: string) => BlogPostIdentity | undefined
}
```

- `BlogProvider`는 provider가 외부에 노출하는 단일 adapter다.
- `BlogSource`는 사용자가 입력한 URL이나 ID를 provider가 해석한 블로그 단위 식별자다.
- `BlogPostRef`는 export 대상 글 하나를 가리키는 공통 참조다.
- `BlogContentDocument`는 HTML, Markdown, provider-native blocks를 구분해 담는다.
- `BlogEditor`는 provider 내부 editor family다.
- `ParserBlock`은 editor 원문 일부를 공통 `ParsedBlock`으로 변환한다.
- `ProviderRegistry`는 provider를 등록하고 key로 찾는 조립용 객체다.
- `BlogFetcher`, `BlogParser`, `BlogEditor`, `ParserBlock` 계열의 provider-neutral 타입은 core package에서만 정의한다.
- provider별 이름은 `NaverBlogProvider`, `TistoryBlogProvider`, `NaverSe4Editor`, `TistoryHtmlFetcher`처럼 concrete 구현임이 드러나야 한다.

## Content Document
```ts
type BlogContentDocument =
  | { kind: "html"; html: string; sourceUrl: string; tags: string[] }
  | { kind: "markdown"; markdown: string; sourceUrl: string; tags: string[] }
  | { kind: "blocks"; blocks: ParsedBlock[]; sourceUrl: string; tags: string[] }
```

- Naver는 첫 단계에서 `kind: "html"`을 반환한다.
- Tistory 최소 adapter도 첫 단계에서는 `kind: "html"`을 반환한다.
- Markdown-only provider e2e는 `kind: "markdown"`을 반환해 HTML 전용 전제가 사라졌는지 검증한다.
- `kind: "blocks"`는 provider가 이미 구조화된 block을 제공할 수 있는 경우를 위한 확장 지점이다.

## Engine 흐름
- Engine은 provider가 준 `BlogPostRef` 목록을 받아 export 대상을 정한다.
- Engine은 provider의 `loadPostContent`로 글 원문 중간 문서를 얻는다.
- Engine은 provider의 `parseContent`로 `ParsedPost`를 얻는다.
- Markdown renderer, asset resolver, asset store, manifest writer, upload rewrite는 provider-neutral 계약만 사용한다.
- `fetchPostHtml` 직접 호출은 engine 공통 workflow에서 제거한다.
- 같은 블로그 링크 rewrite는 provider의 `resolvePostLinkIdentity`가 있을 때만 provider별 식별 결과로 처리한다.

## `blog-naver` 설계
- 새 provider 경로에서 쓰는 Naver URL 해석과 asset URL 정규화는 `blog-naver`에 둔다.
- 새 provider 경로에서 쓰는 Naver fetcher는 `blog-naver`에 둔다.
- 새 provider 경로에서 쓰는 Naver parser, editor, parser block은 `blog-naver`에 둔다.
- 기존 `server`가 직접 쓰는 Naver entrypoint 제거는 다음 범위로 넘긴다.
- 기존 `server` 경로와 새 provider 하네스 경로가 같은 output을 내는지 e2e로 검증한다.
- 기존 Naver block template key는 첫 범위에서 유지한다.
- 기존 fixture expected Markdown은 바꾸지 않는다.
- 기존 Naver fetcher cache semantics는 유지한다.
- 기존 same-blog link rewrite 결과는 유지한다.

## `blog-tistory` 최소 설계
- 공개 Tistory 글 URL을 `BlogSource`와 `BlogPostRef`로 해석한다.
- 공개 HTML을 가져와 `BlogContentDocument`로 반환한다.
- title, source URL, publishedAt은 가능한 범위에서 추출한다.
- paragraph, heading, image, link export를 최소 검증한다.
- 이미지 asset download는 live sample에서 최소 1개만 검증한다.
- category scan, 전체 블로그 scan, upload, resume, UI 선택은 제외한다.
- Tistory live e2e는 engine/provider 하네스로 실행한다.

## Fetcher 정책
- provider별 `FetchPolicy`를 둔다.
- `FetchPolicy`는 concurrency, minimum interval, timeout, retry budget, cache TTL, request budget을 가진다.
- 공식 API, RSS, export endpoint, 공개 HTML 순서로 수집 경로를 선택한다.
- `429`, `403`, `Retry-After`, rate-limit header를 만나면 우회하지 않고 중단하거나 백오프한다.
- 같은 글과 같은 asset 요청은 persistent cache로 중복 요청하지 않는다.
- live e2e는 전용 테스트 블로그와 최소 데이터셋을 사용한다.
- live e2e는 매번 전체 블로그를 긁지 않고 필요한 글과 asset만 요청한다.
- fetch 로그는 provider, endpoint kind, status, retry, cache hit 여부를 남긴다.

## E2E 우선 검증
- 구현 전에 현재 Naver 기능 e2e 인벤토리를 만든다.
- 현재 기능 중 e2e가 없는 중요한 사용자 흐름은 먼저 실패 테스트로 추가한다.
- 이후 구조 변경은 e2e를 green으로 유지하면서만 진행한다.
- live network e2e와 업로드 credential e2e를 완료 기준에 포함한다.
- 외부 credential이나 live service 문제로 e2e를 실행하지 못하면 완료 판정을 하지 않는다.

## E2E 범위
- UI wizard scan, category scope, options, block scan, Markdown export를 검증한다.
- asset handling, image download, upload, rewrite, manifest를 검증한다.
- resume과 result screen 상태 복구를 검증한다.
- Storybook/catalog 생성 결과를 검증한다.
- single-post 또는 evidence CLI가 사용자 기능으로 유지되는 경우 별도 e2e 또는 harness e2e로 검증한다.
- `blog-tistory`는 provider 하네스에서 공개 글 export를 live로 검증한다.
- Markdown-only mock provider는 HTML parser 없는 provider도 export 가능한지 검증한다.

## 마일스톤
1. 현재 Naver 기능 e2e 인벤토리를 작성한다.
2. 현재 Naver live e2e를 보강한다.
3. provider-neutral engine e2e 하네스를 추가한다.
4. HTML provider와 Markdown provider mock e2e를 추가한다.
5. `domain`과 `engine`에 provider/content 계약을 도입한다.
6. `blog-naver` 패키지를 만들고 새 provider 경로의 Naver 전용 구현을 둔다.
7. `engine` export workflow를 `fetchPostHtml` 전제에서 `loadPostContent` 전제로 바꾼다.
8. `blog-tistory` 최소 adapter를 추가한다.
9. `blog-tistory` provider live e2e를 통과시킨다.
10. 기존 Naver live e2e와 upload credential e2e를 계속 통과시킨다.

## 완료 기준
- 기존 Naver 사용자 기능 e2e가 통과한다.
- live network e2e와 업로드 credential e2e가 통과한다.
- `blog-naver`가 새 provider 경로의 Naver 전용 fetcher, parser, editor, block 책임을 가진다.
- `blog-tistory`가 provider 하네스에서 최소 공개 글 export를 증명한다.
- `engine` 공통 export workflow는 HTML fetcher를 직접 요구하지 않는다.
- `domain`과 `engine` 공통 계약은 Tistory와 Markdown-only provider를 표현할 수 있다.
- `server` 변경은 없다.

## 다음 범위
- `server` route, job, state를 provider registry 기반으로 바꾼다.
- `web` wizard를 provider catalog metadata 기반으로 바꾼다.
- `server/web` 일반 기능 코드에서 Naver 직접 참조를 제거한다.
- 기존 `server`가 직접 쓰던 Naver entrypoint를 제거하고 `blog-naver` 등록 경로만 남긴다.
- `blog-tistory`를 UI/server e2e까지 연결한다.
- `blog-medium` adapter 설계를 시작한다.
