import type { FrontmatterFieldMeta, FrontmatterFieldName } from "./schema/ExportOptions.js"

export const frontmatterFieldOrder: FrontmatterFieldName[] = [
  "title",
  "source",
  "blogKey",
  "sourceId",
  "postId",
  "publishedAt",
  "category",
  "categoryPath",
  "tags",
  "thumbnail",
  "exportedAt",
  "assetPaths",
]

export const frontmatterFieldMeta: Record<FrontmatterFieldName, FrontmatterFieldMeta> = {
  title: {
    label: "title",
    description: "글 제목을 기록합니다.",
    defaultAlias: "title",
  },
  source: {
    label: "source",
    description: "원본 글 URL을 기록합니다.",
    defaultAlias: "source",
  },
  blogKey: {
    label: "blogKey",
    description: "블로그 종류 식별자를 기록합니다.",
    defaultAlias: "blogKey",
  },
  sourceId: {
    label: "sourceId",
    description: "블로그 식별자를 기록합니다.",
    defaultAlias: "sourceId",
  },
  postId: {
    label: "postId",
    description: "원본 글 식별자를 기록합니다.",
    defaultAlias: "postId",
  },
  publishedAt: {
    label: "publishedAt",
    description: "발행 시각을 ISO 문자열로 기록합니다.",
    defaultAlias: "publishedAt",
  },
  category: {
    label: "category",
    description: "현재 카테고리 이름을 기록합니다.",
    defaultAlias: "category",
  },
  categoryPath: {
    label: "categoryPath",
    description: "상위 카테고리 경로를 배열로 기록합니다.",
    defaultAlias: "categoryPath",
  },
  tags: {
    label: "tags",
    description: "본문에서 읽은 태그 목록을 기록합니다.",
    defaultAlias: "tags",
  },
  thumbnail: {
    label: "thumbnail",
    description: "대표 썸네일 경로 또는 URL을 기록합니다.",
    defaultAlias: "thumbnail",
  },
  exportedAt: {
    label: "exportedAt",
    description: "내보낸 시각을 ISO 문자열로 기록합니다.",
    defaultAlias: "exportedAt",
  },
  assetPaths: {
    label: "assetPaths",
    description: "생성된 자산 경로 목록을 기록합니다.",
    defaultAlias: "assetPaths",
  },
}
