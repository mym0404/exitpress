import { parseSe3Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe3FileBlock", () => {
  it("parses default file components into file blocks", () => {
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
        blockId: "naver-se3:file",
        props: {
          fileName: "seminar",
          fileExtension: ".pdf",
          fileUrl: "https://download.example.com/seminar.pdf",
        },
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
        blockId: "naver-se3:file",
        props: {
          fileName: "https://download.example.com/fallback",
          fileExtension: ".pdf",
          fileUrl: "https://download.example.com/fallback.pdf",
        },
      },
    ])
  })
})
