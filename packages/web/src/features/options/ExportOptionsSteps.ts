const exportOptionsSteps = [
  "structure",
  "frontmatter",
  "markdown",
  "assets",
  "links",
  "diagnostics",
] as const

export type ExportOptionsStep = (typeof exportOptionsSteps)[number]

export const exportOptionsStepMeta: Record<
  ExportOptionsStep,
  {
    title: string
  }
> = {
  structure: {
    title: "구조 설정",
  },
  frontmatter: {
    title: "Frontmatter 설정",
  },
  markdown: {
    title: "Markdown 설정",
  },
  assets: {
    title: "Assets 설정",
  },
  links: {
    title: "Link 처리",
  },
  diagnostics: {
    title: "진단 설정",
  },
}
