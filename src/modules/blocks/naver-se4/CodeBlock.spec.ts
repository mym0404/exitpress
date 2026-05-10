import { describe, expect, it } from "vitest"

import {
  createSe4ModuleScript,
  parseSe4Blocks,
} from "../../../../tests/helpers/parser-test-utils.js"

describe("NaverSe4CodeBlock", () => {
  it("parses code components with language metadata", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-code">
        ${createSe4ModuleScript({ type: "v2_code" })}
        <pre class="__se_code_view language-typescript">const value = 1
console.log(value)
</pre>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: "typescript",
        code: "const value = 1\nconsole.log(value)",
      },
    ])
  })

  it("skips code components with no code", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-code">
        ${createSe4ModuleScript({ type: "v2_code" })}
        <pre class="__se_code_view"></pre>
      </div>
    `)

    expect(parsed.blocks).toEqual([])
  })

  it("parses code components without language metadata", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-code">
        ${createSe4ModuleScript({ type: "v2_code" })}
        <pre class="__se_code_view">plain()</pre>
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      type: "code",
      language: null,
      code: "plain()",
    })
  })

})
