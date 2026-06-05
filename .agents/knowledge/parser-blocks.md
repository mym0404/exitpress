# Parser Blocks

## Role
- Parser block은 에디터별 HTML node를 공용 `ParserBlockNode`로 바꾸는 가장 작은 책임 단위다.
- 모든 parser block은 공통 base contract를 따르고 `match()`와 `convert()`를 가진다.
- `match()`는 현재 node가 자기 책임인지 판단한다.
- `convert()`는 변환된 `ParserBlockNode[]`를 반환하고, 의도적으로 버릴 node는 빈 배열을 반환한다.

## Managed By Editors
- Editor는 `supportedBlocks` 배열에 `BaseBlock` instance를 직접 들고 있다.
- `supportedBlocks`는 ordered first-match list다.
- 첫 번째로 match된 block만 convert를 실행한다.
- match되는 block이 없으면 parser는 실패한다.
- 빈 배열 반환은 document title, spacer, top-level line break, HTML 주석, 빈 editor component처럼 의도적으로 버리는 node에만 사용한다.
- 알려진 component가 파싱 후 의미 있는 출력이 없으면 빈 배열을 반환할 수 있지만, 내용 있는 node를 조용히 버리면 안 된다.
- 내용이 있는 node를 match했는데 변환할 수 없으면 block이 throw한다.

## Context
- `ParserBlockContext`는 Cheerio API, 현재 node, source URL, tags, export options, SE4 module metadata, `matchLeafNode`를 담는다.
- `ParserBlockConvertContext`는 `ParserBlockContext`에 `matchNode`와 `outputSelection`을 더한다.
- `matchLeafNode`는 container가 direct child를 unwrap해도 되는지 확인할 때 쓴다.
- `matchNode`는 container가 child node를 현재 editor의 `supportedBlocks`로 재귀 변환할 때 쓴다.

## Container And Leaf
- `ContainerBlock`은 wrapper node를 잡고 direct child contents를 `matchNode`로 다시 흘려보낸다.
- `LeafBlock`은 concrete DOM node를 직접 parser node로 바꾼다.
- Container는 parser node를 직접 만들기보다 editor의 현재 parser block list를 재사용한다.
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
- 내용 있는 matched node는 parser node로 보존하거나 명시적인 error로 드러낸다.
- 빈 배열 반환은 document chrome, spacer, empty placeholder, empty known component처럼 의도된 discard만 허용한다.
- 여러 block이 같은 parser node/output option family를 만들면 output option 적용 여부를 spec으로 고정한다.
- Public sample fixture는 live failure regression을 맡고, block boundary와 near-miss 사례는 adjacent parser block spec이 맡는다.

## Output Options
- Parser block의 `outputOptions`는 사용자가 선택할 수 있는 Markdown 형식 차이가 남아 있는 block의 metadata다.
- UI에 노출되는 selection key는 `editorType:blockId` 형식이다.
- Output option이 2개 이상인 block만 `BaseEditor.getBlockOutputDefinitions()`에 노출된다.
- 같은 editor 안에서 같은 `blockId`가 반복되면 첫 definition만 노출되고, 같은 key를 공유한다.
- 여러 concrete block이 같은 output family를 공유하면 같은 `blockId`와 output selection을 공유할 수 있다.
- `outputOptions`와 그 params는 concrete parser block 파일이 직접 소유한다.
- Block별 output metadata를 `core`, `shared`, 공용 helper로 분리하지 않는다.
- Parser는 `ParsedPost.renderInputs`를 만들 때 block template과 prop을 함께 확정한다.
- 정확한 selectable key 목록과 노출 순서는 `BaseBlog`에서 파생되는 output definition과 관련 tests가 source of truth다.

## Story Catalog
- Parser Storybook catalog는 editor의 `supportedBlocks` 순서에서 파생된다.
- Story key는 `editorType`, `supportedBlocks` index, `blockId` 조합이다.
- Storybook tree는 `Editor -> Block` 순서로 모든 supported block을 렌더링해야 한다.
- Story metadata는 block instance의 `id`, `label`, `outputOptions`, 선택적 `story` metadata, 실제 source fixture에서 만든다.
- Story fixture는 실제 source URL, inspect path, input HTML을 담고, Storybook capture asset은 같은 story key의 `src/ui/features/parser-stories/assets/*.png` 파일로 관리한다.
- Input HTML, capture, Markdown preview는 같은 source block을 가리켜야 한다.
- 별도 중앙 block 목록으로 story catalog를 관리하지 않는다.
- Markdown 출력이 없는 block은 auxiliary story로 남겨 전체 지원 범위를 빠뜨리지 않는다.

## Failure And Inspection
- Unsupported content node는 `파싱 가능한 {editorType} block이 없습니다` 오류로 실패한다.
- Error message에는 tag, class, SE4 `moduleType` 같은 inspection 단서가 들어간다.
- `BaseEditor.inspectBlocks()`는 unsupported node와 matched block 정보를 tree 형태로 만든다.
- Single post inspect 흐름은 unsupported block 조사에 이 정보를 사용한다.

## Verification
- Parser block 구현 변경은 `mise exec -- pnpm test:parser-blocks`와 `mise exec -- pnpm test:offline`으로 확인한다.
- Editor dispatch 변경은 `mise exec -- pnpm test:offline`로 routing, tag 추출, editor별 output selection을 확인한다.
- Markdown output이 바뀌면 `tests/fixtures/samples/*/expected.md` 또는 `expected-error.md`를 의도적으로 갱신한다.
- Story catalog나 header route가 바뀌면 Storybook unit test와 catalog test를 확인한다.
- Knowledge는 새 block 하나가 생길 때마다 갱신하지 않는다. block category, failure policy, output option contract가 달라질 때만 갱신한다.
