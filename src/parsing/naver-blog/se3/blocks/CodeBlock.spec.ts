import { describe, expect, it } from "vitest"

import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3CodeBlock", () => {
  it("parses code components into code blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_code">
        <pre>const classic = true
console.log(classic)
</pre>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: "const classic = true\nconsole.log(classic)",
      },
    ])
  })

  it("skips code components with no code", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_code">
        <pre></pre>
      </div>
    `)

    expect(parsed.blocks).toEqual([])
  })
})
