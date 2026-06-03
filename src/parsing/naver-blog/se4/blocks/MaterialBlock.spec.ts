import { describe, expect, it } from "vitest"

import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4MaterialBlock", () => {
  it("parses material components into link paragraphs", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-material">
        <a
          class="se-module-material"
          href="https://example.com/material"
          data-linkdata='{"thumbnail":"https://example.com/material.png","title":"Fallback title"}'
        >
          <strong class="se-material-title">Reference card</strong>
          <img class="se-material-thumbnail-resource" src="https://example.com/material.png" />
          <div class="se-material-detail">
            <div class="se-material-detail-title">Author</div>
            <div class="se-material-detail-description">mj</div>
            <div class="se-material-detail-title">Type</div>
            <div class="se-material-detail-description">note</div>
          </div>
        </a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[Reference card](https://example.com/material)",
      },
    ])
  })

  it("throws when a material component has no url", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-material">
          <a class="se-module-material"></a>
        </div>
      `),
    ).toThrow("SE4 material block parsing failed.")
  })

  it("uses link data fallbacks and skips empty material details", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-material">
        <a
          class="se-module-material"
          data-linkdata='{"link":"https://example.com/from-data","thumbnail":"https://example.com/data.png","title":"Data title"}'
        >
          <div class="se-material-detail">
            <span>ignored</span>
            <div class="se-material-detail-description"></div>
            <div class="se-material-detail-description">loose detail</div>
          </div>
        </a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[Data title](https://example.com/from-data)",
      },
    ])
  })

  it("falls back to url when material title data is empty", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-material">
        <a class="se-module-material" href="https://example.com/no-title"></a>
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      type: "paragraph",
      text: "[https://example.com/no-title](https://example.com/no-title)",
    })
  })

  it("parses custom purchase proof components into link paragraphs", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-custom se-l-default">
        <div class="se-component-content">
          <div class="se-section se-section-custom se-section-align-center se-l-default">
            <div class="not_sponsored_component">
              <div class="thumbnail" style="background-image: url(https://example.com/product.jpg?type=f900_540_nanimated)"></div>
              <div class="text">
                <div class="label">
                  <i class="icon_money"></i>
                  내돈내산 인증
                  <span class="category">쇼핑</span>
                </div>
                <strong class="title">오쿠 저소음 두유제조기 900ml</strong>
                <div class="date"><span class="number">2024.12.</span>구매확정</div>
              </div>
              <a href="https://smartstore.naver.com/main/products/10843938836" class="link"></a>
            </div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[오쿠 저소음 두유제조기 900ml](https://smartstore.naver.com/main/products/10843938836)",
      },
    ])
  })

  it("uses custom purchase proof fallbacks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-custom se-l-default">
        <div class="not_sponsored_component">
          <a href="https://smartstore.naver.com/main/products/1" class="link"></a>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[https://smartstore.naver.com/main/products/1](https://smartstore.naver.com/main/products/1)",
      },
    ])
  })

  it("throws when a custom purchase proof component has no url", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-custom se-l-default">
          <div class="not_sponsored_component"></div>
        </div>
      `),
    ).toThrow("SE4 material block parsing failed.")
  })
})
