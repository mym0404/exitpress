import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2CodeBlock", () => {
  it("parses pre tags into code blocks", () => {
    const parsed = parseSe2Blocks(`<pre>const oldSchool = true
console.log(oldSchool)
</pre>`)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:code",
        props: {
          language: null,
          code: "const oldSchool = true\nconsole.log(oldSchool)",
        },
      },
    ])
  })

  it("skips pre tags with no code", () => {
    const parsed = parseSe2Blocks("<pre></pre>")

    expect(parsed.blocks).toEqual([])
  })

  it("parses Color Scripter rows with spaced white-space attributes", () => {
    const parsed = parseSe2Blocks(`
      <table class="colorscripter-code-table">
        <tbody>
          <tr>
            <td>
              <div _foo="padding:0 6px; white-space: pre; line-height:130%"><span>public</span>&nbsp;class&nbsp;MainActivity&nbsp;{</div>
              <div _foo="padding:0 6px; white-space: pre; line-height:130%">&nbsp;&nbsp;void&nbsp;init()</div>
            </td>
          </tr>
        </tbody>
      </table>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:code",
        props: {
          language: null,
          code: "public class MainActivity {\n  void init()",
        },
      },
    ])
  })
})
