import { describe, expect, it } from "vitest"

import { escapeMarkdownText } from "./escapeMarkdownText.js"

describe("escapeMarkdownText", () => {
  it("does not double escape a leading greater-than sign", () => {
    expect(escapeMarkdownText("> literal")).toBe("\\> literal")
  })

  it("keeps backslash-delimited preview text literal instead of dropping its delimiters", () => {
    expect(escapeMarkdownText(String.raw`\(n\) and \[a_n\]`)).toBe(
      String.raw`\\(n\\) and \\\[a\_n\\\]`,
    )
  })
})
