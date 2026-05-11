# SE2 Editor

## Identity
- Editor type은 `naver-se2`, label은 `SmartEditor 2`다.
- SE2는 legacy HTML fallback이다.
- Parser block 구현은 `src/parsing/naver-blog/se2/blocks/*`에 둔다.

## Block Families
- Text 계열은 direct text와 일반 HTML element를 Markdown paragraph로 정리한다.
- Structure 계열은 legacy wrapper를 풀거나 빈 spacer, 빈 legacy list, top-level line break, HTML 주석을 버린다.
- Media 계열은 image, image group, inline GIF-like media, div-wrapped poll iframe link, standalone 또는 legacy grouped embedded video를 공용 media AST나 링크 문단으로 수렴한다.
- Rich legacy widget 계열은 책 위젯처럼 블로그 고유 HTML을 image와 paragraph 조합으로 분해한다.
- Table/code 계열은 일반 table, 단일 열 layout table, Color Scripter 같은 legacy code-table 변형을 처리한다.
- Quote, heading, divider 계열은 legacy HTML tag 의미를 공용 AST로 보존한다.

## Characteristics
- SE2는 구조가 느슨하므로 fallback block의 순서가 중요하다.
- Fallback text 처리 전에는 media, table, code, widget처럼 더 구체적인 block이 먼저 판단되어야 한다.
- Wrapper를 풀 때 의미 있는 direct text가 있으면 일반 문단 처리와 충돌하지 않게 한다.
- Inline GIF-like media는 image로 변환되므로 별도 video 목록으로 보지 않는다.
- Standalone 또는 legacy grouped embedded video는 video block으로 변환하고 `videos` 목록에도 포함한다.

## Maintenance Boundary
- 정확한 block class 목록, 순서, selector는 editor implementation과 focused specs를 본다.
- Knowledge는 새 SE2 block이 추가될 때마다 갱신하지 않는다.
- SE2의 fallback 전략, wrapper 처리, media/table/code 분류 방식이 바뀔 때만 이 문서를 갱신한다.
