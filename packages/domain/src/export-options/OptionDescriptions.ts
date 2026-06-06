export const optionDescriptions: Record<string, string> = {
  "scope-categoryMode": "선택한 카테고리만 내보낼지, 하위 카테고리까지 함께 포함할지 정합니다.",
  "scope-dateFrom": "이 날짜 이후에 발행한 글만 범위에 포함합니다.",
  "scope-dateTo": "이 날짜 이전에 발행한 글까지만 범위에 포함합니다.",
  "structure-groupByCategory": "카테고리 경로를 출력 폴더 구조에 유지할지 정합니다.",
  "structure-includeDateInPostFolderName": "글 폴더 이름 앞부분에 발행 날짜를 붙입니다.",
  "structure-includeLogNoInPostFolderName": "글 폴더 이름에 원본 글 번호를 함께 넣습니다.",
  "structure-slugStyle":
    "글 제목 slug와 카테고리 경로를 kebab-case, snake_case, 원본 제목 유지 중 어떤 방식으로 쓸지 정합니다.",
  "structure-slugWhitespace":
    "slug와 카테고리 이름 안 공백과 치환된 구분 문자를 -, _, 공백 유지 중에서 정합니다.",
  "structure-postFolderNameMode":
    "기본 규칙을 쓸지, 지원 변수를 조합한 커스텀 템플릿으로 글 폴더 이름을 만들지 정합니다.",
  "structure-postFolderNameCustomTemplate":
    "지원 변수 {slug}, {category}, {title}, {logNo}, {blogId}, {date}, {year}, {YYYY}, {YY}, {month}, {MM}, {M}, {day}, {DD}, {D}를 조합해 글 폴더 이름을 만듭니다.",
  "frontmatter-enabled": "YAML frontmatter 블록 자체를 Markdown 파일 상단에 넣을지 정합니다.",
  "assets-imageHandlingMode":
    "이미지를 로컬로 유지할지, 원본 URL을 유지할지, 내보낸 뒤 업로드까지 이어갈지 정합니다.",
  "assets-compressionEnabled": "다운로드한 로컬 이미지 파일에 안전한 압축을 적용할지 정합니다.",
  "assets-downloadFailureMode":
    "이미지 다운로드가 실패했을 때 글을 실패 처리할지, 원본 URL을 유지할지, 이미지를 생략할지 정합니다.",
  "assets-stickerAssetMode":
    "플랫폼 스티커를 기본적으로 무시할지, 원본 자산 URL로 내려받아 본문에 포함할지 정합니다.",
  "assets-downloadImages": "본문 이미지 파일을 실제로 다운로드할지 정합니다.",
  "assets-downloadThumbnails": "썸네일과 비디오 썸네일 파일을 실제로 다운로드할지 정합니다.",
  "assets-includeImageCaptions": "이미지 아래에 캡션 텍스트를 Markdown으로 함께 남깁니다.",
  "assets-thumbnailSource":
    "frontmatter thumbnail 값에 무엇을 넣을지 고릅니다. 글 목록 대표 썸네일, 본문 첫 이미지, 또는 저장 안 함 중에서 선택합니다.",
  "links-sameBlogPostMode":
    "현재 export 중인 같은 블로그의 다른 글 링크를 그대로 둘지, 커스텀 URL이나 상대경로로 바꿀지 정합니다.",
  "links-sameBlogPostCustomUrlTemplate":
    "지원 변수 {slug}, {category}, {title}, {logNo}, {blogId}, {date}, {year}, {YYYY}, {YY}, {month}, {MM}, {M}, {day}, {DD}, {D}를 넣어 커스텀 URL을 만듭니다.",
}
