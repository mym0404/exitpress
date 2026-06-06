import type { postTemplateKeys } from "@exitpress/domain/export-paths/PostPathTemplate.js"
import type { TemplatePropDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"

export const postTemplatePropDefinitions = {
  slug: { label: "Slug", type: "string" },
  category: { label: "카테고리", type: "string" },
  title: { label: "제목", type: "string" },
  logNo: { label: "글 번호", type: "string" },
  blogId: { label: "블로그 ID", type: "string" },
  date: { label: "발행일", type: "string" },
  year: { label: "발행 연도", type: "string" },
  YYYY: { label: "발행 연도", type: "string" },
  YY: { label: "발행 연도 뒤 2자리", type: "string" },
  month: { label: "발행 월", type: "string" },
  MM: { label: "발행 월", type: "string" },
  M: { label: "발행 월 숫자", type: "string" },
  day: { label: "발행 일", type: "string" },
  DD: { label: "발행 일", type: "string" },
  D: { label: "발행 일 숫자", type: "string" },
} satisfies Record<(typeof postTemplateKeys)[number], TemplatePropDefinition>
