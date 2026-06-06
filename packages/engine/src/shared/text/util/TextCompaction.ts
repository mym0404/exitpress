const markdownLineWhitespacePattern = /[^\S\n]+/g

// Collapses HTML text whitespace into a single readable line.
export const compactText = (value: string) =>
  value
    .replace(/\u200b/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()

// Collapses markdown-adjacent text without keeping whitespace-only lines.
export const compactMarkdownText = (value: string) =>
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
