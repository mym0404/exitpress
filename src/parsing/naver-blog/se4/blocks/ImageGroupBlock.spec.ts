import { describe, expect, it } from "vitest"
import {
  createSe4ModuleScript,
  parseSe4Blocks,
} from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4ImageGroupBlock", () => {
  it("parses image group components into imageGroup blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-image-group">
        ${createSe4ModuleScript({ type: "v2_imageGroup" })}
        <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/one.png"}'>
          <img src="https://example.com/one.png" alt="one" />
        </a>
        <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/two.png"}'>
          <img src="https://example.com/two.png" alt="two" />
        </a>
        <p class="se-image-caption">shared caption</p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "imageGroup",
        images: [
          {
            sourceUrl: "https://example.com/one.png",
            originalSourceUrl: "https://example.com/one.png",
            alt: "one",
            caption: "shared caption",
            mediaKind: "image",
          },
          {
            sourceUrl: "https://example.com/two.png",
            originalSourceUrl: "https://example.com/two.png",
            alt: "two",
            caption: "shared caption",
            mediaKind: "image",
          },
        ],
      },
    ])
  })

  it("lets image group module metadata win over image class fallback", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-image se-image-group">
        ${createSe4ModuleScript({ type: "v2_imageGroup" })}
        <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/group.png"}'>
          <img src="https://example.com/group.png" alt="group" />
        </a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "imageGroup",
        images: [
          {
            sourceUrl: "https://example.com/group.png",
            originalSourceUrl: "https://example.com/group.png",
            alt: "group",
            caption: null,
            mediaKind: "image",
          },
        ],
      },
    ])
  })

  it("throws when an image group has no parseable images", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-image-group">
          ${createSe4ModuleScript({ type: "v2_imageGroup" })}
          <a class="se-module-image-link"><img alt="" /></a>
        </div>
      `),
    ).toThrow("SE4 image group block parsing failed.")
  })
})
