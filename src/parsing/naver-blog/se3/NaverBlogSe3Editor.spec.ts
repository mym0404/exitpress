import { load } from "cheerio"
import { describe, expect, it } from "vitest"
import { defaultExportOptions } from "../../../domain/export-options/ExportOptions.js"
import { NaverBlogSE3Editor } from "./NaverBlogSe3Editor.js"

describe("NaverBlogSE3Editor", () => {
  it("inspects SE3 component children", () => {
    const editor = new NaverBlogSE3Editor()
    const inspected = editor.inspect({
      $: load(`
        <div id="viewTypeSelector">
          <div class="se_component_wrap sect_dsc">
            <div class="se_component se_text">
              <div class="se_textarea">Alpha</div>
            </div>
          </div>
        </div>
      `),
      tags: [],
      options: defaultExportOptions(),
    })

    expect(inspected).toEqual([
      expect.objectContaining({
        matchedBlockId: "paragraph",
        unsupported: false,
      }),
    ])
  })
})
