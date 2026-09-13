import { describe, expect, it } from "vitest"

import { convertHtmlToMarkdown } from "./convertHtmlToMarkdown.js"

describe("convertHtmlToMarkdown", () => {
  it("preserves code nested inside a bold block wrapper", () => {
    expect(
      convertHtmlToMarkdown({ html: "<strong><pre><code>a\n\n\nb</code></pre></strong>" }),
    ).toBe("```\na\n\n\nb\n```")
  })

  it("merges adjacent bold spans without ambiguous Markdown delimiters", () => {
    expect(
      convertHtmlToMarkdown({ html: "<span><b>인재</b></span><span><b>에 의해</b></span>" }),
    ).toBe("**인재에 의해**")
  })

  it("keeps bold paragraph wrappers inside each paragraph boundary", () => {
    expect(
      convertHtmlToMarkdown({ html: "<strong><span><p>first</p><p>second</p></span></strong>" }),
    ).toBe("**first**\n\n**second**")
  })

  it("removes editor-only spacers before empty emphasis becomes Markdown", () => {
    expect(
      convertHtmlToMarkdown({
        html: "<p>\u200b</p><p><strong>\u200b&nbsp;</strong></p><p>visible&nbsp;text</p>",
      }),
    ).toBe("visible text")
  })

  it("renders nested bold as one emphasis boundary", () => {
    expect(convertHtmlToMarkdown({ html: "<strong>outer <b>inner</b> end</strong>" })).toBe(
      "**outer inner end**",
    )
  })

  it("preserves editor spacer characters inside actual code", () => {
    expect(convertHtmlToMarkdown({ html: "<pre><code>a\u200b\u00a0b</code></pre>" })).toBe(
      "```\na\u200b\u00a0b\n```",
    )
  })

  it("escapes literal Korean angle headings before Markdown can treat them as HTML", () => {
    expect(convertHtmlToMarkdown({ html: "<p>&lt;자료구조에 대한 전반적 이해&gt;</p>" })).toBe(
      "\\<자료구조에 대한 전반적 이해>",
    )
  })

  it("preserves generic type names in prose", () => {
    expect(convertHtmlToMarkdown({ html: "<p>Range&lt;String.Index&gt;</p>" })).toBe(
      "Range\\<String.Index>",
    )
  })

  it("escapes shell prompts and currency as literal text", () => {
    expect(
      convertHtmlToMarkdown({ html: "<p>$ git rm -r --cached .<br>$ git commit</p><p>$10</p>" }),
    ).toBe("\\$ git rm -r --cached .  \n\\$ git commit\n\n\\$10")
  })

  it("escapes literal bitwise operators without manufacturing a table", () => {
    expect(convertHtmlToMarkdown({ html: "<p>| Bitwise OR</p><p>| ---</p>" })).toBe(
      "\\| Bitwise OR\n\n\\| ---",
    )
  })

  it("keeps inline and fenced code bytes unescaped", () => {
    const code = "Range<String.Index> | $value"
    expect(
      convertHtmlToMarkdown({
        html: `<p><code>Range&lt;String.Index&gt; | $value</code></p><pre><code>Range&lt;String.Index&gt; | $value</code></pre>`,
      }),
    ).toBe(`\`${code}\`\n\n\`\`\`\n${code}\n\`\`\``)
  })

  it("preserves repeated blank lines inside fenced code", () => {
    expect(convertHtmlToMarkdown({ html: "<pre><code>first\n\n\nlast</code></pre>" })).toBe(
      "```\nfirst\n\n\nlast\n```",
    )
  })

  it("restores ColorScripter code without interpreting replacement tokens", () => {
    expect(
      convertHtmlToMarkdown({
        html: '<table class="colorscripter-code-table"><tr><td><div style="white-space: pre">$&amp; &lt;node&gt; | value</div></td></tr></table>',
      }),
    ).toBe("```\n$& <node> | value\n```")
  })

  it("uses a longer fence when ColorScripter source contains backticks", () => {
    expect(
      convertHtmlToMarkdown({
        html: '<table class="colorscripter-code-table"><tr><td><pre>```\ncode\n```</pre></td></tr></table>',
      }),
    ).toBe("````\n```\ncode\n```\n````")
  })

  it("restores all eleven ColorScripter placeholders without prefix collisions", () => {
    const html = Array.from(
      { length: 11 },
      (_, index) =>
        `<table class="colorscripter-code-table"><tr><td><pre>block ${index}</pre></td></tr></table>`,
    ).join("")
    const markdown = convertHtmlToMarkdown({ html })
    expect(Array.from(markdown.matchAll(/```\n(block \d+)\n```/g), ([, code]) => code)).toEqual(
      Array.from({ length: 11 }, (_, index) => `block ${index}`),
    )
    expect(markdown).not.toContain("EXITPRESSCOLORSCRIPTERCODEBLOCK")
  })

  it("preserves real GFM table structure while escaping cell pipes", () => {
    expect(
      convertHtmlToMarkdown({
        html: "<table><thead><tr><th>Operator</th></tr></thead><tbody><tr><td>A | B</td></tr></tbody></table>",
      }),
    ).toBe("| Operator |\n| --- |\n| A \\| B |")
  })

  it("preserves raw HTML tables and word break tags without escaping their markup", () => {
    const html = "<table><tbody><tr><td>setOn<wbr>Click</td></tr></tbody></table>"
    expect(convertHtmlToMarkdown({ html })).toBe(html)
  })

  it("normalizes multiline anchor labels and protects label pipes", () => {
    expect(
      convertHtmlToMarkdown({
        html: '<a href="https://example.com/guide">Coroutines<br><br>guide | Kotlin</a>',
      }),
    ).toBe("[Coroutines guide \\| Kotlin](https://example.com/guide)")
  })

  it("resolves and escapes link destinations independently from prose", () => {
    expect(
      convertHtmlToMarkdown({
        html: '<a href="/a(b)?price=$1" title="A &quot;title&quot;">Guide</a>',
        resolveLinkUrl: (url) => `https://example.com${url}`,
      }),
    ).toBe('[Guide](https://example.com/a\\(b\\)?price=$1 "A \\"title\\"")')
  })
})
