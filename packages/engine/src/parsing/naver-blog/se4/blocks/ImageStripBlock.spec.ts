import { parseSe4Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe4ImageStripBlock", () => {
  it("parses image strip components into imageStrip blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-imageStrip se-imageStrip2 se-l-default">
        <div class="se-module se-module-image">
          <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/strip-1.png"}'>
            <img src="https://example.com/strip-1.png?type=w80_blur" alt="" />
          </a>
        </div>
        <div class="se-module se-module-image">
          <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/strip-2.png"}'>
            <img src="https://example.com/strip-2.png?type=w80_blur" alt="" />
          </a>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:imageStrip",
        props: {
          images: [
            {
              url: "https://example.com/strip-1.png",
              alt: "",
              caption: null,
            },
            {
              url: "https://example.com/strip-2.png",
              alt: "",
              caption: null,
            },
          ],
        },
        assets: {
          "images.0.url": {
            role: "image",
            sourceUrl: "https://example.com/strip-1.png",
            required: true,
          },
          "images.1.url": {
            role: "image",
            sourceUrl: "https://example.com/strip-2.png",
            required: true,
          },
        },
      },
    ])
  })

  it("throws when an image strip has no parseable images", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-imageStrip">
          <a class="se-module-image-link"><img alt="" /></a>
        </div>
      `),
    ).toThrow("SE4 image strip block parsing failed.")
  })
})
