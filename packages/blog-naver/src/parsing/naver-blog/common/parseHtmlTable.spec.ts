import { load } from "cheerio"
import { expect, it } from "vitest"

import { parseHtmlTable } from "./parseHtmlTable.js"

it("rewrites links in both Markdown cells and complex HTML", () => {
  const $ = load(
    '<table><tr><td rowspan="2"><a href="/post/1">Post</a></td></tr><tr><td>Body</td></tr></table>',
  )
  const parsed = parseHtmlTable({
    $,
    table: $("table"),
    resolveLinkUrl: (url) => `https://example.com${url}`,
  })

  expect(parsed.rows[0]?.[0]?.text).toBe("[Post](https://example.com/post/1)")
  expect(parsed.html).toContain('href="https://example.com/post/1"')
  expect(parsed.complex).toBe(true)
})

it("keeps line boundaries inside a cell", () => {
  const $ = load("<table><tr><td><p>id | name</p><p>1 | Paul</p></td><td>cs</td></tr></table>")
  const parsed = parseHtmlTable({ $, table: $("table") })

  expect(parsed.rows[0]?.[0]?.text).toBe("id \\| name\n\n1 \\| Paul")
  expect(parsed.complex).toBe(false)
})

it("keeps nested table rows inside their owning cell", () => {
  const $ = load(
    "<table><tr><td><table><tr><td>inner</td></tr></table></td><td>outer</td></tr></table>",
  )
  const parsed = parseHtmlTable({ $, table: $("table").first() })

  expect(parsed.rows).toHaveLength(1)
  expect(parsed.rows[0]).toHaveLength(2)
  expect(parsed.rows[0]?.[1]?.text).toBe("outer")
  expect(parsed.html).toContain("<table><tbody><tr><td>inner</td></tr></tbody></table>")
  expect(parsed.complex).toBe(true)
})

it("uses HTML for code blocks whose indentation cannot fit a GFM cell", () => {
  const $ = load(
    "<table><tr><td><pre>if (a | b) {\n  return x;\n}</pre></td><td>code</td></tr></table>",
  )
  const parsed = parseHtmlTable({ $, table: $("table") })

  expect(parsed.html).toContain("<pre>if (a | b) {\n  return x;\n}</pre>")
  expect(parsed.complex).toBe(true)
})

it("uses HTML for list structure inside table cells", () => {
  const $ = load("<table><tr><td><ol><li>first</li><li>second</li></ol></td></tr></table>")
  const parsed = parseHtmlTable({ $, table: $("table") })

  expect(parsed.html).toContain("<ol><li>first</li><li>second</li></ol>")
  expect(parsed.complex).toBe(true)
})

it("registers cell images for both GFM cell and HTML output paths", () => {
  const $ = load(
    '<table><tr><td><img src="https://example.com/diagram.png" alt="diagram"></td><td>label</td></tr></table>',
  )
  const parsed = parseHtmlTable({ $, table: $("table") })

  expect(parsed.assets).toMatchObject({
    "rows.0.0.text:image:0": {
      sourceUrl: "https://example.com/diagram.png",
      textReplacement: {
        propPath: "rows.0.0.text",
        template: "![diagram](EXITPRESSINLINEIMAGE0END)",
      },
    },
    "html:image:0": {
      sourceUrl: "https://example.com/diagram.png",
      textReplacement: { propPath: "html" },
    },
  })
  expect(parsed.rows[0]?.[0]?.text).toBe("EXITPRESSINLINEIMAGE0END")
  expect(parsed.html).toContain("<td>EXITPRESSINLINEIMAGE0END</td>")
})
