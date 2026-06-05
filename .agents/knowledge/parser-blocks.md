# Parser Blocks

## Role
- Parser block은 에디터별 HTML node를 렌더 대상 `ParsedBlock`으로 바꾸는 가장 작은 책임 단위다.
- 모든 parser block은 공통 base contract를 따르고 `match()`와 `convert()`를 가진다.
- `match()`는 현재 node가 자기 책임인지 판단한다.
- `convert()`는 변환된 `ParsedBlock[]`를 반환하고, 의도적으로 버릴 node는 빈 배열을 반환한다.

## Managed By Editors
- Editor는 `supportedBlocks` 배열에 `ParserBlock` instance를 직접 들고 있다.
- `supportedBlocks`는 ordered first-match list다.
- 첫 번째로 match된 block만 convert를 실행한다.
- match되는 block이 없으면 parser는 실패한다.
- 빈 배열 반환은 document title, spacer, top-level line break, HTML 주석, 빈 editor component처럼 의도적으로 버리는 node에만 사용한다.
- 알려진 component가 파싱 후 의미 있는 출력이 없으면 빈 배열을 반환할 수 있지만, 내용 있는 node를 조용히 버리면 안 된다.
- 내용이 있는 node를 match했는데 변환할 수 없으면 block이 throw한다.

## Context
- `ParserBlockContext`는 Cheerio API, 현재 node, source URL, tags, export options, SE4 module metadata, `matchLeafNode`를 담는다.
- `ParserBlockConvertContext`는 `ParserBlockContext`에 `blockId`, `path`, `matchNode`를 더한다.
- `matchLeafNode`는 container가 direct child를 unwrap해도 되는지 확인할 때 쓴다.
- `matchNode`는 container가 child node를 현재 editor의 `supportedBlocks`로 재귀 변환할 때 쓴다.

## Container And Leaf
- `ContainerParserBlock`은 wrapper node를 잡고 direct child contents를 `matchNode`로 다시 흘려보낸다.
- `LeafParserBlock`은 concrete DOM node를 직접 parsed block으로 바꾼다.
- Container는 parsed block을 직접 만들지 않고 editor의 현재 parser block list를 재사용한다.
- Leaf는 paragraph, image, table, code처럼 실제 output block을 만든다.
- 현재 Container 계열은 legacy wrapper를 풀어 실제 content leaf로 넘기는 용도에 가깝다.

## Block Utilities
- Block class와 adjacent spec은 editor별 `blocks/*` 바로 아래에 둔다.
- Block class가 아닌 editor-local helper module은 두 개 이상의 block이 공유할 때만 editor별 `blocks/util/*`에 둔다.
- 두 개 이상의 editor family가 공유하는 helper는 `core` 또는 `common` 아래의 명확한 parser boundary로 올린다.
- 한 block만 쓰는 helper는 크기와 무관하게 해당 block 파일 안에 둔다.
- 기존 경로에서 새 helper 위치를 re-export하지 않고, 사용하는 block이 `blocks/util/*`를 직접 import한다.

## Quality Criteria
- Parser block은 하나의 명확한 DOM/content family를 책임진다.
- `match()`는 root component, module type, semantic wrapper처럼 자기 책임의 경계를 먼저 확인한다.
- Descendant selector는 nested component나 sibling module data를 훔치지 않도록 editor boundary 안에서만 쓴다.
- Fallback block은 더 구체적인 media, table, code, widget block을 가리지 않아야 한다.
- First-match 순서가 의미를 결정하면 adjacent spec으로 대표 충돌 사례를 고정한다.
- 내용 있는 matched node는 parsed block으로 보존하거나 명시적인 error로 드러낸다.
- 빈 배열 반환은 document chrome, spacer, empty placeholder, empty known component처럼 의도된 discard만 허용한다.
- 여러 block이 같은 output family를 만들면 template 적용 여부를 spec으로 고정한다.
- Public sample fixture는 live failure regression을 맡고, block boundary와 near-miss 사례는 adjacent parser block spec이 맡는다.

## Block Templates
- Parser block의 template definition은 사용자가 바꿀 수 있는 Markdown template과 prop 계약을 설명한다.
- 각 concrete `*Block.ts`가 자기 `templateDefinition.presets`와 `props`를 직접 정의한다.
- `BlogEditorParser`는 block template key, editor별 순서, 중복 key 제거만 맡는다.
- UI에 노출되는 key는 `editorType:blockId` 형식이다.
- 같은 editor 안에서 같은 key가 반복되면 첫 definition만 노출된다.
- 여러 concrete block이 같은 output family를 공유하면 같은 key를 공유할 수 있다.
- Parser는 `ParsedBlock.blockId`와 `props`만 만들고, 최종 template 문자열 선택은 renderer가 맡는다.
- 정확한 selectable key 목록과 노출 순서는 `BlogParser`에서 파생되는 template definition과 관련 tests가 source of truth다.

## Story Catalog
- Storybook catalog는 `src/ui/features/storybook/data/*`의 정적 definition에서 만들어진다.
- Story key는 `editorType`, `supportedBlocks` index, `blockId` 조합이다.
- Storybook tree는 `Editor -> Block` 순서로 모든 supported block을 렌더링해야 한다.
- Story metadata는 story key, editor identity, block id/label, 실제 source URL, inspect path, input HTML을 담는다.
- Storybook capture asset은 같은 story key의 `src/ui/features/storybook/assets/*.png` 파일로 관리한다.
- Input HTML, capture, Markdown preview는 같은 source block을 가리켜야 한다.
- Storybook definition은 parser inspection path와 Markdown 렌더 결과로 실제 parser block과 계속 맞아야 한다.
- Markdown 출력이 없는 block은 auxiliary story로 남겨 전체 지원 범위를 빠뜨리지 않는다.

## Failure And Inspection
- Unsupported content node는 `파싱 가능한 {editorType} block이 없습니다` 오류로 실패한다.
- Error message에는 tag, class, SE4 `moduleType` 같은 inspection 단서가 들어간다.
- `BlogEditorParser.inspectSupportedParserBlocks()`는 unsupported node와 matched block 정보를 tree 형태로 만든다.
- Single post inspect 흐름은 unsupported block 조사에 이 정보를 사용한다.

## Verification
- Parser block 구현 변경은 `mise exec -- pnpm test:parser-blocks`와 `mise exec -- pnpm test:offline`으로 확인한다.
- Editor dispatch 변경은 `mise exec -- pnpm test:offline`로 routing, tag 추출, editor별 output selection을 확인한다.
- Markdown output이 바뀌면 `tests/fixtures/samples/*/expected.md` 또는 `expected-error.md`를 의도적으로 갱신한다.
- Story catalog나 header route가 바뀌면 Storybook unit test와 catalog test를 확인한다.
- Knowledge는 새 block 하나가 생길 때마다 갱신하지 않는다. block category, failure policy, output option contract가 달라질 때만 갱신한다.
