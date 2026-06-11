import { parseSe3Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe3MapBlock", () => {
  it("parses default map components into map blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_map default">
        <div class="se_caption_group is-contact">
          <div class="se_map_article">
            <div class="se_title_area">
              <div class="se_title">지리산 청강원</div>
            </div>
            <div class="se_address">경상남도 산청군 시천면 지리산대로 373</div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se3:map",
        props: {
          places: [
            {
              name: "지리산 청강원",
              address: "경상남도 산청군 시천면 지리산대로 373",
              url: "https://map.naver.com/p/search/%EC%A7%80%EB%A6%AC%EC%82%B0%20%EC%B2%AD%EA%B0%95%EC%9B%90",
            },
          ],
        },
      },
    ])
  })

  it("throws instead of dropping matched map components without a title", () => {
    expect(() =>
      parseSe3Blocks(`
        <div class="se_component se_map default">
          <div class="se_address">경상남도 산청군 시천면 지리산대로 373</div>
        </div>
      `),
    ).toThrow("SE3 map block parsing failed.")
  })
})
