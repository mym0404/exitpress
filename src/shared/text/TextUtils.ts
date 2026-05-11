const markdownLineWhitespacePattern = /[^\S\n]+/g

export const compactText = (value: string) =>
  value
    .replace(/\u200b/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()

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
