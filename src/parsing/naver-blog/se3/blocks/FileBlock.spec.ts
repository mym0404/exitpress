import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3FileBlock", () => {
  it("parses default file components into link paragraphs", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_file default">
        <div class="se_viewArea se_file_wrap">
          <a
            href="https://download.example.com/seminar.pdf"
            class="se_name_area __se_toggle_fileList __se_link"
            data-linktype="file"
          >
            <span class="se_name">seminar.pdf</span>
          </a>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[seminar.pdf](https://download.example.com/seminar.pdf)",
      },
    ])
  })

  it("throws when a file component has no url", () => {
    expect(() =>
      parseSe3Blocks(`
        <div class="se_component se_file default">
          <span class="se_name">seminar.pdf</span>
        </div>
      `),
    ).toThrow("SE3 file block parsing failed.")
  })

  it("uses the url as a fallback label when the file name is missing", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_file default">
        <a class="se_name_area" href="https://download.example.com/fallback.pdf"></a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[https://download.example.com/fallback.pdf](https://download.example.com/fallback.pdf)",
      },
    ])
  })

  it("parses legacy file components with nested download links", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_file default">
        <div class="se_viewArea se_file_wrap">
          <div class="se_name_area">
            <span class="se_name">seminar.hwp</span>
            <a
              href="https://download.example.com/seminar.hwp"
              class="__se_toggle_fileList se_btn_openFileDown __se_link"
              data-linktype="file"
            >
              파일 다운로드
            </a>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[seminar.hwp](https://download.example.com/seminar.hwp)",
      },
    ])
  })
})
