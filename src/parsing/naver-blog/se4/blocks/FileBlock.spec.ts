import { describe, expect, it } from "vitest"
import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4FileBlock", () => {
  it("parses file components into single link paragraphs without descriptions", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-file se-l-default">
        <script
          class="__se_module_data"
          data-module-v2='{"type":"v2_file","data":{"link":"https://example.com/from-data.pdf"}}'
        ></script>
        <span class="se-file-name">seminar</span><span class="se-file-extension">.pdf</span>
        <a class="se-file-save-button __se_link" href="https://example.com/seminar.pdf">
          파일 다운로드
        </a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[seminar.pdf](https://example.com/seminar.pdf)",
      },
    ])
  })

  it("uses module data and url fallbacks when visible file data is missing", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-file">
        <script
          class="__se_module_data"
          data-module-v2='{"type":"v2_file","data":{"link":"https://example.com/from-data.pdf"}}'
        ></script>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[https://example.com/from-data.pdf](https://example.com/from-data.pdf)",
      },
    ])
  })

  it("throws when a file component has no url", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-file"></div>
      `),
    ).toThrow("SE4 file block parsing failed.")
  })
})
