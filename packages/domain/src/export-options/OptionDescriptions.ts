export const optionDescriptions: Record<string, string> = {
  "scope-categoryMode": "선택한 카테고리만 내보낼지, 하위 카테고리까지 포함할지 고릅니다.",
  "scope-dateFrom": "이 날짜 이후에 발행한 글만 포함합니다.",
  "scope-dateTo": "이 날짜 이전에 발행한 글까지만 포함합니다.",
  "structure-groupByCategory": "출력 폴더 구조에 카테고리 경로를 남길지 고릅니다.",
  "structure-slugStyle":
    "글 제목 slug와 카테고리 경로를 kebab-case, snake_case, 원본 제목 중 어떤 방식으로 쓸지 고릅니다.",
  "structure-slugWhitespace": "slug와 카테고리 이름의 공백을 -, _, 공백 유지 중 하나로 처리합니다.",
  "structure-postFolderNameTemplate":
    "지원 변수 {{ slug }}, {{ category }}, {{ title }}, {{ logNo }}, {{ blogId }}, {{ date }}, {{ year }}, {{ YYYY }}, {{ YY }}, {{ month }}, {{ MM }}, {{ M }}, {{ day }}, {{ DD }}, {{ D }}를 조합해 글 폴더 이름을 만듭니다.",
  "frontmatter-enabled": "Markdown 파일 상단에 YAML frontmatter 블록을 넣을지 고릅니다.",
  "assets-imageHandlingMode":
    "이미지를 로컬에 둘지, 원본 URL로 둘지, 내보낸 뒤 업로드까지 이어갈지 고릅니다.",
  "assets-compressionEnabled": "다운로드한 로컬 이미지 파일에 안전한 압축을 적용할지 고릅니다.",
  "assets-downloadFailureMode":
    "이미지 다운로드 실패 시 글 실패 처리, 원본 URL 유지, 이미지 생략 중 하나를 고릅니다.",
  "assets-stickerAssetMode":
    "플랫폼 스티커를 무시할지, 원본 자산 URL로 내려받아 본문에 넣을지 고릅니다.",
  "assets-downloadImages": "본문 이미지 파일을 다운로드할지 고릅니다.",
  "assets-downloadThumbnails": "썸네일과 비디오 썸네일 파일을 다운로드할지 고릅니다.",
  "assets-includeImageCaptions": "이미지 아래에 캡션 텍스트를 Markdown으로 함께 남깁니다.",
  "assets-thumbnailSource":
    "frontmatter thumbnail 값으로 글 목록 대표 썸네일, 본문 첫 이미지, 저장 안 함 중 하나를 씁니다.",
  "links-sameBlogPostMode":
    "같은 블로그의 다른 글 링크를 그대로 둘지, 커스텀 URL이나 상대경로로 바꿀지 고릅니다.",
  "links-sameBlogPostCustomUrlTemplate":
    "지원 변수 {{ slug }}, {{ category }}, {{ title }}, {{ logNo }}, {{ blogId }}, {{ date }}, {{ year }}, {{ YYYY }}, {{ YY }}, {{ month }}, {{ MM }}, {{ M }}, {{ day }}, {{ DD }}, {{ D }}를 넣어 커스텀 URL을 만듭니다.",
}
