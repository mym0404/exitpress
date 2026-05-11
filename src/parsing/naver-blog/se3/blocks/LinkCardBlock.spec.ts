import { describe, expect, it } from "vitest"
import { parseSe3Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3LinkCardBlock", () => {
  it("parses oglink components into link cards", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_oglink default ">
        <div class="se_sectionArea se_align-center">
          <div class="se_viewArea se_og_wrap">
            <a class="se_og_box __se_link" href="http://www.chinesetest.cn/index.do" data-linktype="link">
              <div class="se_og_txt">
                <div class="se_og_tit">首页--汉语考试服务网</div>
                <div class="se_og_desc">简体中文 | English | 한국어</div>
                <div class="se_og_cp">www.chinesetest.cn</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "linkCard",
        card: {
          title: "首页--汉语考试服务网",
          description: "简体中文 | English | 한국어",
          url: "http://www.chinesetest.cn/index.do",
          imageUrl: null,
        },
      },
    ])
  })

  it("parses thumbnail and data link fallbacks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_oglink og_bSize ">
        <div class="se_viewArea se_og_wrap">
          <a class="se_og_box" data-linkdata='{"link":"https://example.com/from-data"}'>
            <div class="se_og_thumb">
              <img data-lazy-src="https://dthumb-phinf.pstatic.net/sample.jpg?type=ff500_300" alt="">
            </div>
            <div class="se_og_txt">
              <div class="se_og_tit"></div>
            </div>
          </a>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "linkCard",
        card: {
          title: "https://example.com/from-data",
          description: "",
          url: "https://example.com/from-data",
          imageUrl: "https://dthumb-phinf.pstatic.net/sample.jpg?type=ff500_300",
        },
      },
    ])
  })

  it("throws when a link card has no url", () => {
    expect(() =>
      parseSe3Blocks(`
        <div class="se_component se_oglink default "></div>
      `),
    ).toThrow("SE3 link card block parsing failed.")
  })

  it("throws when data link fallback is not parseable", () => {
    expect(() =>
      parseSe3Blocks(`
        <div class="se_component se_oglink default ">
          <a class="se_og_box" data-linkdata="{bad json}"></a>
        </div>
      `),
    ).toThrow("SE3 link card block parsing failed.")

    expect(() =>
      parseSe3Blocks(`
        <div class="se_component se_oglink default ">
          <a class="se_og_box" data-linkdata='{"link":123}'></a>
        </div>
      `),
    ).toThrow("SE3 link card block parsing failed.")
  })
})
