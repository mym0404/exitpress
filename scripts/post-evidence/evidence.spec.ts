import { describe, expect, it } from "vitest"

import { renderEvidenceMarkdownSections } from "./evidence.js"

describe("renderEvidenceMarkdownSections", () => {
  it("renders README-style sections with fenced Markdown snippets", () => {
    const sections = [
      {
        metadata: {
          title: "a | b",
          note: "line 1\n<p>",
        },
        sourceUrl: "https://blog.naver.com/a/1",
        blogCapturePath: "assets/capture.png",
        markdown: "left | right\n<script>",
      },
    ]
    const evidence = renderEvidenceMarkdownSections(sections)

    expect(evidence).toContain("### title: a | b / note: line 1 / <p>")
    expect(evidence).toContain("[원문 보기](https://blog.naver.com/a/1)")
    expect(evidence).toContain(
      '<img src="assets/capture.png" alt="title: a | b / note: line 1 / &lt;p&gt; source capture" width="300">',
    )
    expect(evidence).toContain("```markdown\nleft | right\n<script>\n```")
    expect(evidence).not.toContain("| Metadata |")
    expect(evidence).not.toContain("<table>")

    const evidenceWithoutSource = renderEvidenceMarkdownSections(sections, {
      includeSourceLink: false,
    })

    expect(evidenceWithoutSource).not.toContain("원문 보기")
    expect(evidenceWithoutSource).not.toContain("https://blog.naver.com/a/1")
    expect(evidenceWithoutSource).toContain('<img src="assets/capture.png"')
  })
})
