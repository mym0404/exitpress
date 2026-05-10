export type EvidenceMarkdownSection = {
  metadata: string | Record<string, string | number | boolean | null | undefined>
  sourceUrl: string
  naverCapturePath: string | null
  markdown: string | null
}

type EvidenceMarkdownRenderOptions = {
  includeSourceLink?: boolean
}

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const normalizeLineEndings = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()

const renderMetadata = (
  metadata: EvidenceMarkdownSection["metadata"],
) => {
  if (typeof metadata === "string") {
    return normalizeLineEndings(metadata) || "Evidence"
  }

  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null)

  const rendered = entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" / ")

  return normalizeLineEndings(rendered) || "Evidence"
}

const renderSourceLink = ({ sourceUrl }: { sourceUrl: string }) =>
  `[원문 보기](${sourceUrl})`

const renderImage = (path: string | null, alt: string) =>
  path ? `<img src="${escapeHtmlAttribute(path)}" alt="${escapeHtmlAttribute(alt)}" width="300">` : null

const renderMarkdownFence = (markdown: string | null) => {
  if (markdown === null) {
    return null
  }

  const value = normalizeLineEndings(markdown)
  const backtickRuns = value.match(/`+/g) ?? []
  const fenceLength = Math.max(3, ...backtickRuns.map((run) => run.length + 1))
  const fence = "`".repeat(fenceLength)

  return `${fence}markdown\n${value}\n${fence}`
}

const renderSection = (section: EvidenceMarkdownSection, options: Required<EvidenceMarkdownRenderOptions>) => {
  const heading = renderMetadata(section.metadata).replace(/\n/g, " / ")
  const image = renderImage(section.naverCapturePath, `${heading} Naver capture`)
  const markdown = renderMarkdownFence(section.markdown)

  return [
    `### ${heading}`,
    "",
    options.includeSourceLink ? renderSourceLink(section) : null,
    "",
    image,
    "",
    markdown,
  ]
    .filter((line): line is string => line !== null)
    .join("\n")
}

export const renderEvidenceMarkdownSections = (
  sections: EvidenceMarkdownSection[],
  options: EvidenceMarkdownRenderOptions = {},
) => {
  if (sections.length === 0) {
    return "No evidence.\n"
  }

  const resolvedOptions = {
    includeSourceLink: options.includeSourceLink ?? true,
  }

  return `${sections.map((section) => renderSection(section, resolvedOptions)).join("\n\n")}\n`
}
