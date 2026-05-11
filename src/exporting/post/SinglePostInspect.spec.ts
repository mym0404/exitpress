import { describe, expect, it } from "vitest"
import { defaultExportOptions } from "../../domain/export-options/ExportOptions.js"
import { inspectPostHtml } from "./SinglePostInspect.js"

const options = defaultExportOptions()
const sourceUrl = "https://blog.naver.com/my-blog/123456789012"

describe("single post inspect", () => {
  it("reports successful parse block types", () => {
    const diagnostics = inspectPostHtml({
      blogId: "my-blog",
      logNo: "123456789012",
      sourceUrl,
      options,
      html: `
        <div id="viewTypeSelector">
          <div class="se-component se-text">
            <script class="__se_module_data" data-module-v2='{"type":"v2_text"}'></script>
            <p class="se-text-paragraph">Hello</p>
          </div>
        </div>
      `,
    })

    expect(diagnostics.editor).toEqual({
      type: "naver-se4",
      label: "SmartEditor 4",
    })
    expect(diagnostics.parse).toEqual({
      status: "success",
      blockTypes: ["paragraph"],
    })
    expect(diagnostics.unsupportedNodes).toEqual([])
  })

  it("includes SE4 module data for unsupported nodes", () => {
    const diagnostics = inspectPostHtml({
      blogId: "my-blog",
      logNo: "123456789012",
      sourceUrl,
      options,
      html: `
        <div id="viewTypeSelector">
          <div class="se-component se-poll se-l-default" id="SE-poll">
            <script class="__se_module_data" data-module-v2='{"type":"v2_poll","data":{"question":"Pick one"}}'></script>
          </div>
        </div>
      `,
    })

    expect(diagnostics.parse).toMatchObject({
      status: "failed",
      error:
        '파싱 가능한 naver-se4 block이 없습니다: div class="se-component se-poll se-l-default" moduleType="v2_poll"',
    })
    expect(diagnostics.unsupportedNodes).toHaveLength(1)
    expect(diagnostics.unsupportedNodes[0]).toMatchObject({
      path: "0",
      tagName: "div",
      id: "SE-poll",
      className: "se-component se-poll se-l-default",
      moduleType: "v2_poll",
      moduleData: {
        type: "v2_poll",
        data: {
          question: "Pick one",
        },
      },
    })
  })

  it("reports unsupported SE2 wrapper children", () => {
    const diagnostics = inspectPostHtml({
      blogId: "my-blog",
      logNo: "123456789012",
      sourceUrl,
      options,
      html: `<div id="viewTypeSelector"><div><p>Intro</p><div><video class="fx _postImage _gifmp4" data-gif-url="https://example.com/sample.gif"></video><iframe src="https://example.com/embed"></iframe></div></div></div>`,
    })

    expect(diagnostics.parse).toMatchObject({
      status: "failed",
      error: "파싱 가능한 naver-se2 block이 없습니다: div",
    })
    expect(diagnostics.unsupportedNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "0.1",
          tagName: "div",
          unsupported: true,
          children: expect.arrayContaining([
            expect.objectContaining({
              path: "0.1.0",
              tagName: "video",
              unsupported: true,
            }),
          ]),
        }),
      ]),
    )
  })
})
