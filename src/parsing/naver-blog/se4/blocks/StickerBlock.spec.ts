import { describe, expect, it } from "vitest"

import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4StickerBlock", () => {
  it("skips sticker components with the default asset option", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-sticker se-l-default">
        <div class="se-module se-module-sticker">
          <a class="__se_sticker_link" data-linkdata='{"src":"https://example.com/sticker.png","width":"370","height":"320"}'>
            <img class="se-sticker-image" src="https://example.com/sticker.png?type=p100_100" alt="" />
          </a>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([])
  })

  it("throws when a sticker has no source", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-sticker">
          <a class="__se_sticker_link"></a>
        </div>
      `),
    ).toThrow("SE4 sticker block parsing failed.")
  })

  it("handles invalid link data and uses preview source only", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-sticker">
        <a class="__se_sticker_link" data-linkdata="{bad json}">
          <img class="se-sticker-image" src="https://example.com/preview.png" />
        </a>
      </div>
    `)

    expect(parsed.blocks).toEqual([])
  })
})
