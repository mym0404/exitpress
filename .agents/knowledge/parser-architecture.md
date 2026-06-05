# Parser Architecture

## Scope
- 이 문서는 Naver Blog HTML이 editor별 parser block을 거쳐 렌더 대상 parsed block이 되는 구조를 설명한다.
- Parser block 자체의 계약과 Container/Leaf 개념은 `.agents/knowledge/parser-blocks.md`를 따른다.

## Routing Flow
- `src/parsing/naver-blog/core/PostParser.ts`가 Cheerio로 HTML을 읽고, 태그를 추출한 뒤 `NaverBlog.parsePost()`에 넘긴다.
- `src/parsing/naver-blog/NaverBlog.ts`가 modern editor부터 legacy fallback까지 editor 후보를 들고 있다.
- `src/parsing/naver-blog/core/BaseBlog.ts`는 각 editor의 `canParse()` 결과로 parser를 고른다.
- 정확한 editor 판별 조건과 순서는 코드와 parser routing tests가 source of truth다.

## Ownership
- Blog 계층은 editor 목록과 UI에 노출할 parser block output definition을 모은다.
- Blog 계층은 Storybook용 parser block story definition도 editor 순서대로 모은다.
- Editor 계층은 에디터 감지, parse root 선택, block 실행 순서, source-level context 주입, output selection 적용을 담당한다.
- Editor 계층은 `supportedBlocks` 순서와 story key를 유지하고, story fixture가 있으면 실제 source URL, inspect path, input HTML을 story definition에 붙인다.
- Editor 계층은 inspect path와 변환된 parsed block을 연결해야 하는 도구를 위해 선택적 source evidence hook도 제공한다. 기본 parser output에는 이 evidence를 넣지 않는다.
- Parser block 계층은 DOM node의 `match()`와 parsed block 변환인 `convert()`를 담당한다.
- Renderer/exporter는 parser block DOM 규칙을 알지 않고 `ParsedPost.blocks`의 `blockId`, `props`, `assets`를 소비한다.

## Editor Shape
- SE2는 loose legacy DOM을 대상으로 하고, wrapper를 풀어 child block을 다시 처리하는 경로가 있다.
- SE3는 component 단위 구조를 대상으로 하는 leaf block 중심 parser다.
- SE4는 component metadata와 class fallback을 함께 써서 module context를 parser block에 전달한다.
- 구체 selector, module field, block ordering, 에디터별 예외는 editor implementation과 focused specs에서 확인한다.

## Parser Output Boundary
- 공용 parser output은 `src/domain/parser/Types.ts`의 `ParsedBlock`이 기준이다.
- `ParsedPost`는 `tags`와 `blocks`를 반환한다.
- `blocks`는 `blockId`, `props`, 선택적 `assets`를 가진 렌더 대상 block이다.
- `assets`의 key는 렌더 전에 치환할 top-level prop 이름이다.
- Markdown 본문 렌더링은 `blockId`로 template 문자열을 찾고 `props`를 `src/markdown/BlockTemplateRenderer.ts`에 넘긴다.
- Inspect/evidence 도구가 source path를 필요로 할 때는 별도 parser helper가 block evidence를 함께 반환한다. 이 값은 디버깅과 리포트용이며 export manifest나 Markdown 도메인 모델에 저장하지 않는다.

## File Structure Rules
- Blog ownership은 `src/parsing/naver-blog/NaverBlog.ts`와 `src/parsing/naver-blog/core/BaseBlog.ts`에 둔다.
- Editor ownership은 `src/parsing/naver-blog/se2`, `src/parsing/naver-blog/se3`, `src/parsing/naver-blog/se4`의 editor 파일에 둔다.
- 공통 parser entrypoint와 cross-editor parser helper는 `src/parsing/naver-blog/core/*`에 둔다.
- Parser Storybook source fixture는 `src/parsing/naver-blog/core/ParserStoryFixtures.ts`에 둔다.
- Parser block base/context는 `src/parsing/naver-blog/core/*`의 공통 파일에 둔다.
- 에디터 전용 block은 `src/parsing/naver-blog/se2/blocks`, `src/parsing/naver-blog/se3/blocks`, `src/parsing/naver-blog/se4/blocks`에 둔다.
- 두 개 이상의 parser family가 공유하는 helper는 `src/parsing/naver-blog/core/*`에 둔다.
- 한 editor family 안에서 두 개 이상의 block이 공유하는 helper는 `src/parsing/naver-blog/se2|se3|se4/blocks/util/*`에 둔다.
- 한 block만 쓰는 helper는 크기와 무관하게 해당 block 파일 안에 둔다.
- Parser block spec은 구현 파일 옆에 둔다.
- Public sample regression은 `tests/fixtures/samples/*`와 `tests/support/sample-fixtures.spec.ts`가 맡는다.
- Parser Storybook UI, Markdown preview, bundled capture asset resolution은 `src/ui/features/parser-stories/*`가 맡는다.

## Change Rules
- 새 parser block은 해당 editor의 block list에 직접 instance로 추가한다.
- Registry나 문자열 id map을 따로 만들지 않는다.
- 같은 DOM node를 여러 block이 잡을 수 있으면 editor의 block order가 동작을 결정한다.
- Parsed block prop 계약을 바꾸면 `src/domain/parser/Types.ts`, renderer, exporter, focused parser tests, sample fixtures, 관련 knowledge를 함께 갱신한다.
- Parser output option을 추가하거나 바꾸면 block metadata, UI persistence, renderer 해석, parser block spec을 함께 확인한다.
- Story fixture나 capture asset을 바꾸면 story input HTML, parser inspection path, bundled capture asset, rendered Markdown preview가 같은 source block을 가리키는지 확인한다.
- Knowledge에는 새 block의 이름이나 전체 key 목록을 추가하지 않는다. 새로운 block category, 책임 경계, 검증 기준이 생길 때만 갱신한다.
