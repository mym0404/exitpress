import { parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2PollBlock", () => {
  it("parses div-wrapped poll iframes into link paragraphs", () => {
    const parsed = parseSe2Blocks(`
      <div align="center">
        <iframe
          class="poll_iframe"
          src="https://m.blog.naver.com/Poll.naver?pollKey=abc&amp;blogId=anglekim3708"
          title="포스트에 첨부된 투표"
        ></iframe>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:poll",
        props: {
          text: "[포스트에 첨부된 투표](https://m.blog.naver.com/Poll.naver?pollKey=abc&blogId=anglekim3708)",
        },
      },
    ])
  })

  it("uses a fallback title for untitled div-wrapped poll iframes", () => {
    const parsed = parseSe2Blocks(`
      <div>
        <iframe class="poll_iframe" src="https://m.blog.naver.com/Poll.naver?pollKey=abc"></iframe>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:poll",
        props: {
          text: "[투표](https://m.blog.naver.com/Poll.naver?pollKey=abc)",
        },
      },
    ])
  })

  it("ignores style tags beside div-wrapped poll iframes", () => {
    const parsed = parseSe2Blocks(`
      <div>
        <style>.poll_iframe { width: 100%; }</style>
        <iframe
          class="poll_iframe"
          src="https://m.blog.naver.com/Poll.naver?pollKey=abc"
          title="포스트에 첨부된 투표"
        ></iframe>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:poll",
        props: {
          text: "[포스트에 첨부된 투표](https://m.blog.naver.com/Poll.naver?pollKey=abc)",
        },
      },
    ])
  })

  it("parses paragraph-wrapped poll iframes into link paragraphs", () => {
    const parsed = parseSe2Blocks(`
      <p align="center" style="text-align: center;">
        <iframe
          class="poll_iframe"
          src="https://m.blog.naver.com/Poll.naver?pollKey=abc"
          title="포스트에 첨부된 투표"
        ></iframe>&nbsp;
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:poll",
        props: {
          text: "[포스트에 첨부된 투표](https://m.blog.naver.com/Poll.naver?pollKey=abc)",
        },
      },
    ])
  })

  it("does not parse div-wrapped poll iframes mixed with text", () => {
    const parsed = parseSe2Blocks(`
      <div>
        caption
        <iframe class="poll_iframe" src="https://m.blog.naver.com/Poll.naver?pollKey=abc"></iframe>
      </div>
    `)

    expect(parsed.blocks).toEqual([{ blockId: "naver-se2:paragraph", props: { text: "caption" } }])
  })

  it("does not parse div-wrapped poll iframes mixed with other media", () => {
    const parsed = parseSe2Blocks(`
      <div>
        <iframe class="poll_iframe" src="https://m.blog.naver.com/Poll.naver?pollKey=abc"></iframe>
        <img src="https://example.com/other.png" alt="" />
      </div>
    `)

    expect(parsed.blocks).toMatchObject([
      {
        blockId: "naver-se2:image",
        props: {
          url: "https://example.com/other.png",
          alt: "",
          caption: null,
        },
        assets: {
          url: {
            role: "image",
            sourceUrl: "https://example.com/other.png",
            required: true,
          },
        },
      },
    ])
  })

  it("does not parse div-wrapped poll iframes without a source", () => {
    expect(() =>
      parseSe2Blocks(`
        <div>
          <iframe class="poll_iframe"></iframe>
        </div>
      `),
    ).toThrow("파싱 가능한 naver-se2 block이 없습니다: div")
  })
})
