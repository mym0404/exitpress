# Parser Blocks

## Role
- Parser block은 에디터별 HTML node를 공용 `AstBlock`으로 바꾸는 가장 작은 책임 단위다.
- 모든 parser block은 공통 base contract를 따르고 `match()`와 `convert()`를 가진다.
- `match()`는 현재 node가 자기 책임인지 판단한다.
- `convert()`는 변환된 `AstBlock[]`를 반환하고, 의도적으로 버릴 node는 빈 배열을 반환한다.

## Managed By Editors
- Editor는 `supportedBlocks` 배열에 `BaseBlock` instance를 직접 들고 있다.
- `supportedBlocks`는 ordered first-match list다.
- 첫 번째로 match된 block만 convert를 실행한다.
- match되는 block이 없으면 parser는 실패한다.
- 빈 배열 반환은 document title, spacer, top-level line break, HTML 주석, 빈 editor component처럼 의도적으로 버리는 node에만 사용한다.
- 알려진 component가 파싱 후 의미 있는 출력이 없으면 빈 배열을 반환할 수 있다.
- 내용이 있는 node를 match했는데 변환할 수 없으면 block이 throw한다.

## Context
- `ParserBlockContext`는 Cheerio API, 현재 node, source URL, tags, export options, SE4 module metadata, `matchLeafNode`를 담는다.
- `ParserBlockConvertContext`는 `ParserBlockContext`에 `matchNode`와 `outputSelection`을 더한다.
- `matchLeafNode`는 container가 direct child를 unwrap해도 되는지 확인할 때 쓴다.
- `matchNode`는 container가 child node를 현재 editor의 `supportedBlocks`로 재귀 변환할 때 쓴다.

## Container And Leaf
- `ContainerBlock`은 wrapper node를 잡고 direct child contents를 `matchNode`로 다시 흘려보낸다.
- `LeafBlock`은 concrete DOM node를 직접 AST로 바꾼다.
- Container는 AST를 직접 만들기보다 editor의 현재 parser block list를 재사용한다.
- Leaf는 paragraph, image, table, code처럼 실제 output block을 만든다.
- 현재 Container 계열은 legacy wrapper를 풀어 실제 content leaf로 넘기는 용도에 가깝다.

## Output Options
- Parser block의 `outputOptions`는 같은 AST를 다른 Markdown 형식으로 렌더링할 수 있게 하는 metadata다.
- UI에 노출되는 selection key는 `editorType:blockId` 형식이다.
- Output option이 2개 이상인 block만 `BaseEditor.getBlockOutputDefinitions()`에 노출된다.
- 같은 editor 안에서 같은 `blockId`가 반복되면 첫 definition만 노출되고, 같은 key를 공유한다.
- 여러 concrete block이 같은 output family를 공유하면 같은 `blockId`와 output selection을 공유할 수 있다.
- Parser는 render-time metadata가 필요한 AST block에 `outputSelectionKey`와 `outputSelection`을 붙인다.
- Paragraph link style은 renderer 단계의 전역 옵션이 아니라 paragraph parser block이 HTML-to-Markdown 변환 전에 선택한다.
- 정확한 selectable key 목록과 노출 순서는 `BaseBlog`에서 파생되는 output definition과 관련 tests가 source of truth다.

## Failure And Inspection
- Unsupported content node는 `파싱 가능한 {editorType} block이 없습니다` 오류로 실패한다.
- Error message에는 tag, class, SE4 `moduleType` 같은 inspection 단서가 들어간다.
- `BaseEditor.inspectBlocks()`는 unsupported node와 matched block 정보를 tree 형태로 만든다.
- Single post inspect 흐름은 unsupported block 조사에 이 정보를 사용한다.

## Verification
- Parser block 구현 변경은 `pnpm test:parser-blocks`와 `pnpm test:offline`으로 확인한다.
- Editor dispatch 변경은 `pnpm test:offline`로 routing, tag 추출, editor별 output selection을 확인한다.
- Markdown output이 바뀌면 `tests/fixtures/samples/*/expected.md` 또는 `expected-error.md`를 의도적으로 갱신한다.
- Knowledge는 새 block 하나가 생길 때마다 갱신하지 않는다. block category, failure policy, output option contract가 달라질 때만 갱신한다.
