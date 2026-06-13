import { createSe4ModuleScript, parseSe4Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe4OembedBlock", () => {
  it("parses oembed components into oembed blocks", () => {
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
        blockId: "naver-se4:oembed",
        props: {
          title: "Video embed",
          description: "embedded preview",
          url: "https://youtu.be/demo",
          thumbnailUrl: "https://example.com/oembed.png",
        },
        assets: {
          thumbnailUrl: {
            role: "thumbnail",
            sourceUrl: "https://example.com/oembed.png",
            required: false,
          },
        },
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
      blockId: "naver-se4:oembed",
      props: {
        title: "https://player.example.com",
        description: "",
        url: "https://player.example.com",
        thumbnailUrl: null,
      },
    })
    expect(providerParsed.blocks[0]).toMatchObject({
      blockId: "naver-se4:oembed",
      props: {
        title: "https://provider.example.com",
        description: "",
        url: "https://provider.example.com",
        thumbnailUrl: null,
      },
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
      blockId: "naver-se4:oembed",
      props: {
        title: "https://provider-fallback.example.com",
        description: "",
        url: "https://provider-fallback.example.com",
        thumbnailUrl: null,
      },
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
