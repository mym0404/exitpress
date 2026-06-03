import { describe, expect, it } from "vitest"

import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4LinkCardBlock", () => {
  it("parses oglink components into link paragraphs", () => {
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
        type: "paragraph",
        text: "[External article](https://example.com/article)",
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
        type: "paragraph",
        text: "[https://example.com/fallback](https://example.com/fallback)",
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
        type: "paragraph",
        text: "[Docs](https://example.com/docs)",
      },
      {
        type: "paragraph",
        text: "Useful reference",
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
