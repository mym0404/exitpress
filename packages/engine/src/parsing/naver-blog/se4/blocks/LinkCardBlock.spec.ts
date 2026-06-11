import { parseSe4Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe4LinkCardBlock", () => {
  it("parses oglink components into link card blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-oglink">
        <a class="se-oglink-info" href="https://example.com/article"></a>
        <strong class="se-oglink-title">External article</strong>
        <p class="se-oglink-summary">preview text</p>
        <a class="se-oglink-thumbnail" href="https://example.com/article">
          <img class="se-oglink-thumbnail-resource" src="https://example.com/cover.png" />
        </a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:linkCard",
        props: {
          title: "External article",
          description: "preview text",
          url: "https://example.com/article",
          thumbnailUrl: "https://example.com/cover.png",
        },
        assets: {
          thumbnailUrl: {
            role: "thumbnail",
            sourceUrl: "https://example.com/cover.png",
            required: false,
          },
        },
      },
    ])
  })

  it("falls back to thumbnail href and url title", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-oglink">
        <a class="se-oglink-thumbnail" href="https://example.com/fallback"></a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:linkCard",
        props: {
          title: "https://example.com/fallback",
          description: "",
          url: "https://example.com/fallback",
          thumbnailUrl: null,
        },
      },
    ])
  })

  it("keeps non-preview descriptions without duplicated urls", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-oglink">
        <a class="se-oglink-info" href="https://example.com/docs"></a>
        <strong class="se-oglink-title">Docs</strong>
        <p class="se-oglink-summary">
          Useful reference
          https://example.com/docs
          ()
        </p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:linkCard",
        props: {
          title: "Docs",
          description: "Useful reference",
          url: "https://example.com/docs",
          thumbnailUrl: null,
        },
      },
    ])
  })

  it("throws when a link card has no url", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-oglink"></div>
      `),
    ).toThrow("SE4 link card block parsing failed.")
  })
})
