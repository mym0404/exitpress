import type { AstBlock, ImageData } from "../domain/ast/Types.js"

import { splitFormulaWrapper } from "./FormulaWrapper.js"

const markdownLineWhitespacePattern = /[^\S\n]+/g

const compactMarkdownText = (value: string) =>
  value
    .replace(/\u200b/g, "")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => {
      const hasHardBreak = / {2}$/.test(line)
      const normalizedLine = line.replace(markdownLineWhitespacePattern, " ").trimEnd()

      return hasHardBreak && normalizedLine ? `${normalizedLine}  ` : normalizedLine
    })
    .join("\n")
    .trim()

const escapeTableCell = (value: string) =>
  value.replace(/\|/g, "\\|").replace(/\n+/g, "<br>").trim() || " "

export const createLinkFormatter = ({
  resolveLinkUrl,
}: {
  resolveLinkUrl?: (url: string) => string
}) => {
  const formatLink = ({ label, url }: { label: string; url: string }) => {
    const resolvedUrl = resolveLinkUrl ? resolveLinkUrl(url) : url

    return `[${label}](${resolvedUrl})`
  }

  return {
    formatLink,
  }
}

const isDegenerateMarkdownLine = (line: string) => /^[*_~`]+$/.test(line.trim())

const normalizeMarkdownText = (text: string) =>
  compactMarkdownText(text.replace(/([^\s*])\*{4,}([^\s*])/g, "$1**$2"))
    .split("\n")
    .filter((line) => line.trim() && !isDegenerateMarkdownLine(line))
    .join("\n")
    .trim()

export const renderParagraph = (text: string) => normalizeMarkdownText(text)

export const renderQuote = (text: string) =>
  text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")

export const renderCodeBlock = ({ language, code }: { language: string | null; code: string }) =>
  `\`\`\`${language ?? ""}\n${code}\n\`\`\``

const renderWrappedFormula = ({
  formula,
  open,
  close,
  display,
}: {
  formula: string
  open: string
  close: string
  display: boolean
}) => {
  if (display) {
    return `${open}\n${formula}\n${close}`
  }

  return `${open}${formula}${close}`
}

export const renderFormula = ({ formula, display }: { formula: string; display: boolean }) => {
  const inline = splitFormulaWrapper({
    wrapper: "$",
    fallbackOpen: "$",
    fallbackClose: "$",
  })

  if (!display) {
    return renderWrappedFormula({
      formula,
      open: inline.open,
      close: inline.close,
      display: false,
    })
  }

  const block = splitFormulaWrapper({
    wrapper: "$$",
    fallbackOpen: "$$",
    fallbackClose: "$$",
  })

  return renderWrappedFormula({
    formula,
    open: block.open,
    close: block.close,
    display: true,
  })
}

export const renderGfmTable = (block: Extract<AstBlock, { type: "table" }>) => {
  const [headerRow, ...bodyRows] = block.rows

  if (!headerRow) {
    return block.html
  }

  const columnCount = headerRow.length
  const normalizeRow = (cells: typeof headerRow) =>
    [
      ...cells.map((cell) => escapeTableCell(cell.text)),
      ...Array.from({ length: Math.max(0, columnCount - cells.length) }, () => " "),
    ].slice(0, columnCount)

  return [
    `| ${normalizeRow(headerRow).join(" | ")} |`,
    `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`,
    ...bodyRows.map((row) => `| ${normalizeRow(row).join(" | ")} |`),
  ].join("\n")
}

export const renderImageBlockMarkdown = ({
  image,
  assetPath,
}: {
  image: ImageData
  assetPath: string
}) => {
  return `![${image.alt}](${assetPath})`
}
