import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3MapTextBlock", () => {
  it("parses text map components into place link paragraphs", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_map map_text">
        <div class="se_caption_group is-contact">
          <i class="ico_map_text"></i>
          <div class="se_map_article">
            <div class="se_title_area">
              <div class="se_title"> 슬지네찐빵 슬지제빵소 </div>
            </div>
            <div class="se_address">전라북도 부안군 진서면 청자로 1076 슬지제빵소</div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "[슬지네찐빵 슬지제빵소](https://map.naver.com/p/search/%EC%8A%AC%EC%A7%80%EB%84%A4%EC%B0%90%EB%B9%B5%20%EC%8A%AC%EC%A7%80%EC%A0%9C%EB%B9%B5%EC%86%8C)",
      },
      { type: "paragraph", text: "전라북도 부안군 진서면 청자로 1076 슬지제빵소" },
    ])
  })
})
