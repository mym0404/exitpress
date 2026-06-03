import { describe, expect, it } from "vitest"

import {
  createSe4ModuleScript,
  parseSe4Blocks,
} from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4OembedBlock", () => {
  it("parses oembed components into link paragraphs", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-oembed">
        ${createSe4ModuleScript({
          type: "v2_oembed",
          data: {
            title: "Video embed",
            description: "embedded preview",
            inputUrl: "https://youtu.be/demo",
            thumbnailUrl: "https://example.com/oembed.png",
          },
        })}
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[Video embed](https://youtu.be/demo)",
      },
    ])
  })

  it("throws when oembed metadata has no url", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-oembed">
          ${createSe4ModuleScript({ type: "v2_oembed", data: {} })}
        </div>
      `),
    ).toThrow("SE4 oEmbed block parsing failed.")
  })

  it("uses iframe and provider fallbacks", () => {
    const iframeParsed = parseSe4Blocks(`
      <div class="se-component se-oembed">
        ${createSe4ModuleScript({
          type: "v2_oembed",
          data: { html: '<iframe src="https://player.example.com"></iframe>' },
        })}
      </div>
    `)
    const providerParsed = parseSe4Blocks(`
      <div class="se-component se-oembed">
        ${createSe4ModuleScript({
          type: "v2_oembed",
          data: { providerUrl: "https://provider.example.com" },
        })}
      </div>
    `)

    expect(iframeParsed.blocks[0]).toMatchObject({
      type: "paragraph",
      text: "[https://player.example.com](https://player.example.com)",
    })
    expect(providerParsed.blocks[0]).toMatchObject({
      type: "paragraph",
      text: "[https://provider.example.com](https://provider.example.com)",
    })
  })

  it("uses provider url when iframe html has no src", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-oembed">
        ${createSe4ModuleScript({
          type: "v2_oembed",
          data: { html: "<iframe></iframe>", providerUrl: "https://provider-fallback.example.com" },
        })}
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      type: "paragraph",
      text: "[https://provider-fallback.example.com](https://provider-fallback.example.com)",
    })
  })

  it("throws when class-only oembed has no metadata", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-oembed"></div>
      `),
    ).toThrow("SE4 oEmbed block parsing failed.")
  })
})
