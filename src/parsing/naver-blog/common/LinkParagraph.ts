import { compactMarkdownText } from "../../../shared/text/TextUtils.js"
import { createParagraphBlock } from "../core/ParsedBlockOutput.js"

const isDegenerateMarkdownLine = (line: string) => /^[*_~`]+$/.test(line.trim())

const normalizeMarkdownText = (text: string) =>
  compactMarkdownText(text.replace(/([^\s*])\*{4,}([^\s*])/g, "$1**$2"))
    .split("\n")
    .filter((line) => line.trim() && !isDegenerateMarkdownLine(line))
    .join("\n")
    .trim()

const formatMarkdownLink = ({
  label,
  url,
  resolveLinkUrl,
}: {
  label: string
  url: string
  resolveLinkUrl?: (url: string) => string
}) => `[${label}](${resolveLinkUrl ? resolveLinkUrl(url) : url})`

export const createLinkParagraphBlocks = ({
  blockId,
  title,
  description,
  url,
  hasThumbnail,
  resolveLinkUrl,
}: {
  blockId: string
  title: string
  description: string
  url: string
  hasThumbnail: boolean
  resolveLinkUrl?: (url: string) => string
}) => {
  const linkText = formatMarkdownLink({
    label: title || url,
    url,
    resolveLinkUrl,
  })

  if (hasThumbnail) {
    return [createParagraphBlock({ blockId, text: linkText })]
  }

  const descriptionText = normalizeMarkdownText(description)
    .split("\n")
    .map((line) => line.trim())
    .filter((trimmed) => {
      if (!trimmed) {
        return false
      }

      if (/^[()]+$/.test(trimmed)) {
        return false
      }

      if (trimmed === url) {
        return false
      }

      return true
    })
    .join("\n")

  return [
    createParagraphBlock({ blockId, text: linkText }),
    ...(descriptionText ? [createParagraphBlock({ blockId, text: descriptionText })] : []),
  ]
}
