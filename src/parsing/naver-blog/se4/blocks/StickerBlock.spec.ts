import { describe, expect, it } from "vitest"
import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4StickerBlock", () => {
  it("parses sticker components into image blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-sticker se-l-default">
        <div class="se-module se-module-sticker">
          <a class="__se_sticker_link" data-linkdata='{"src":"https://example.com/sticker.png","width":"370","height":"320"}'>
            <img class="se-sticker-image" src="https://example.com/sticker.png?type=p100_100" alt="" />
          </a>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/sticker.png?type=p100_100",
          originalSourceUrl: "https://example.com/sticker.png",
          alt: "",
          caption: null,
          mediaKind: "sticker",
        },
      },
    ])
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

    expect(parsed.blocks[0]).toMatchObject({
      type: "image",
      image: {
        sourceUrl: "https://example.com/preview.png",
        originalSourceUrl: null,
      },
    })
  })
})
