import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3CodeBlock", () => {
  it("parses code components into code blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_code">
        <pre>const legacy = true
console.log(legacy)
</pre>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: "const legacy = true\nconsole.log(legacy)",
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

  it("parses legacy themed code view components", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_code code_black">
        <div class="se_sectionArea">
          <div class="se_editArea">
            <div class="se_viewArea se_fs_T3">
              <div class="se_editView">
                <div class="se_textView">
                  <div class="__se_code_view se_textarea language-javascript">&lt;audio src="audio/example.mp3" /&gt;
&lt;video src="video/example.mp4" /&gt;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: '<audio src="audio/example.mp3" />\n<video src="video/example.mp4" />',
      },
    ])
  })
})
