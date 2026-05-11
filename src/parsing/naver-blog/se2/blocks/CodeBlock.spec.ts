import { describe, expect, it } from "vitest"
import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2CodeBlock", () => {
  it("parses pre tags into code blocks", () => {
    const parsed = parseSe2Blocks(`<pre>const oldSchool = true
console.log(oldSchool)
</pre>`)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: "const oldSchool = true\nconsole.log(oldSchool)",
      },
    ])
  })

  it("skips pre tags with no code", () => {
    const parsed = parseSe2Blocks("<pre></pre>")

    expect(parsed.blocks).toEqual([])
  })
})
