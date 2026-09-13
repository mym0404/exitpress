import { parseSe3Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe3LinkCardBlock", () => {
  it("preserves literal preview punctuation and TeX without creating Markdown markup", () => {
    const parsed = parseSe3Blocks(String.raw`
      <div class="se_component se_oglink">
        <a class="se_og_box" href="https://example.com/math"></a>
        <strong class="se_og_tit">[C++] &lt;vector&gt; $5</strong>
        <p class="se_og_desc">value | \(n\) and $x$ and \(unfinished</p>
      </div>
    `)

    expect(parsed.blocks[0]?.props).toMatchObject({
      title: String.raw`\[C++\] \<vector> \$5`,
      description: String.raw`value \| \\(n\\) and \$x\$ and \\(unfinished`,
      url: "https://example.com/math",
      thumbnailUrl: null,
    })
    expect(parsed.blocks[0]?.assets).toBeUndefined()
  })

  it("parses oglink components into link card blocks", () => {
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
        blockId: "naver-se3:linkCard",
        props: {
          title: "首页--汉语考试服务网",
          description: "简体中文 \\| English \\| 한국어",
          url: "http://www.chinesetest.cn/index.do",
          thumbnailUrl: null,
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
        blockId: "naver-se3:linkCard",
        props: {
          title: "https://example.com/from-data",
          description: "",
          url: "https://example.com/from-data",
          thumbnailUrl: "https://dthumb-phinf.pstatic.net/sample.jpg?type=ff500_300",
        },
        assets: {
          thumbnailUrl: {
            role: "thumbnail",
            sourceUrl: "https://dthumb-phinf.pstatic.net/sample.jpg?type=ff500_300",
            required: false,
          },
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
