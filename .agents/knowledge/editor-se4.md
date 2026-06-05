# SE4 Editor

## Identity
- Editor type은 `naver-se4`, label은 `SmartEditor 4`다.
- Product surface에서는 ONE(SE4)로 부를 수 있다.
- SE4는 component와 module metadata를 함께 쓰는 SmartEditor parser다.
- Parser block class와 spec은 `src/parsing/naver-blog/se4/blocks/*`에 두고, 두 개 이상의 SE4 block이 공유하는 helper만 `src/parsing/naver-blog/se4/blocks/util/*`에 둔다.

## Module Context
- Editor는 component 안의 module JSON을 읽어 parser block에 metadata context를 전달한다.
- Metadata가 부족한 경우에도 class fallback으로 일부 block을 판별한다.
- Module type 전용 block은 같은 component에 fallback class가 함께 있어도 의미 우선권을 가진다.
- 구체 attribute 이름과 selector는 editor implementation과 focused specs가 source of truth다.

## Block Families
- Text 계열은 paragraph와 list를 Markdown paragraph로 만든다.
- Media 계열은 image, image group, image strip, sticker를 image 계열 parser node로 만든다.
- Media/Text mixed 계열은 right wrapping paragraph의 float image slot과 text slot을 기존 image/paragraph parser node로 푼다.
- Rich content 계열은 formula, code, video, table을 공용 semantic parser node로 만든다.
- Link-like 계열은 link card, file, map, oEmbed, material, custom purchase proof 같은 외부 참조형 module을 Markdown link paragraph로 만든다.
- Quote/chrome 계열은 quotation, Blog씨 질문, divider, heading, document chrome을 처리한다.

## Characteristics
- SE4는 module metadata와 class fallback을 함께 본다.
- Link-like block은 Markdown link paragraph로 출력된다.
- Formula는 inline/block 여부를 metadata와 class로 판단한다.
- Text block은 SE4 list를 Markdown list 문단으로 만들고, 추천 상품형 text 묶음은 하나의 list paragraph로 정리한다.
- Text block은 text module 안의 loose text-like child를 문단으로 보존한다.
- Image group과 image strip은 같은 imageGroup parser node/output option family를 공유한다.
- Heading block은 text가 있는 section title만 heading으로 만들고, 빈 section title placeholder는 출력하지 않는다.
- Sticker는 image parser node지만 `mediaKind: "sticker"`로 표시되어 asset 정책의 영향을 받는다.
- `videos`는 parsed `video` block에서 추출한다.

## Maintenance Boundary
- 정확한 block class 목록, 순서, selector, module type 문자열은 editor implementation과 focused specs를 본다.
- Knowledge는 새 SE4 block이 추가될 때마다 갱신하지 않는다.
- SE4의 module-context 방식, link-like 수렴 정책, media/formula/text category가 바뀔 때만 이 문서를 갱신한다.
