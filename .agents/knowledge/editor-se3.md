# SE3 Editor

## Identity
- Editor type은 `naver-se3`, label은 `SmartEditor 3`다.
- SE3는 component wrapper 기반의 legacy SmartEditor parser다.
- Parser block class와 spec은 `src/parsing/naver-blog/se3/blocks/*`에 두고, 두 개 이상의 SE3 block이 공유하는 helper만 `src/parsing/naver-blog/se3/blocks/util/*`에 둔다.

## Block Families
- Document chrome 계열은 본문 output이 아닌 제목 wrapper를 버린다.
- Text 계열은 SE3 textarea HTML을 Markdown paragraph로 만들고, 비어 있는 textarea component는 버린다.
- Media 계열은 component 안의 standalone images, GIF video images, legacy sticker, image strip을 image 또는 imageGroup parser node로 만든다.
- Link card 계열은 SE3 oglink preview component를 Markdown link paragraph로 만든다.
- Table, quote, code, divider, video 계열은 component 안의 대표 semantic child를 공용 parser node로 만든다.
- Map 계열은 component 안의 장소 정보를 Markdown link paragraph로 만든다.

## Characteristics
- SE3 parser는 component 단위 leaf block 중심이다.
- Descendant selector는 현재 component root 경계 안에서만 의미를 가진다.
- 지원하지 않는 SE3 content node는 실패로 드러난다.
- 의미 있는 본문이 없는 SE3 text component는 실패가 아니라 output 없는 spacer처럼 취급한다.
- `videos`는 parsed `video` block에서 추출한다.
- Image, text, table 세부 selector와 source 우선순위는 block implementation과 focused specs가 source of truth다.

## Maintenance Boundary
- 정확한 block class 목록, 순서, selector는 editor implementation과 focused specs를 본다.
- Knowledge는 새 SE3 block이 추가될 때마다 갱신하지 않는다.
- SE3의 component-level parsing 전략이나 지원 범위의 큰 category가 바뀔 때만 이 문서를 갱신한다.
