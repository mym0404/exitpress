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

const isDegenerateMarkdownLine = (line: string) => /^[*_~`]+$/.test(line.trim())

const normalizeMarkdownText = (text: string) =>
  compactMarkdownText(text.replace(/([^\s*])\*{4,}([^\s*])/g, "$1**$2"))
    .split("\n")
    .filter((line) => line.trim() && !isDegenerateMarkdownLine(line))
    .join("\n")
    .trim()

// Normalizes paragraph text before it is inserted into markdown output.
export const renderParagraph = (text: string) => normalizeMarkdownText(text)
