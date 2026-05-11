import { describe, expect, it } from "vitest"
import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2InlineGifVideoBlock", () => {
  it("parses inline gif video blocks into image blocks", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <video
          src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
          class="fx _postImage _gifmp4"
          data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
        ></video>&nbsp;
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210",
          originalSourceUrl: "https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800",
          alt: "",
          caption: null,
          mediaKind: "image",
        },
      },
    ])
  })

  it("parses inline gif video blocks inside div wrappers", () => {
    const parsed = parseSe2Blocks(`
      <div align="" _foo="">
        <video
          src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
          class="fx _postImage _gifmp4"
          data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
        ></video>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210",
          originalSourceUrl: "https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800",
          alt: "",
          caption: null,
          mediaKind: "image",
        },
      },
    ])
  })

  it("parses inline gif video blocks inside span wrappers", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <span style="background-color: rgb(255, 255, 255);">
          <video
            src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
            class="fx _postImage _gifmp4"
            data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
          ></video>
        </span>
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210",
          originalSourceUrl: "https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800",
          alt: "",
          caption: null,
          mediaKind: "image",
        },
      },
    ])
  })

  it("ignores inline gif videos mixed with text", () => {
    const parsed = parseSe2Blocks(`
      <p>
        caption
        <video
          src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
          class="fx _postImage _gifmp4"
          data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
        ></video>
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "caption",
      },
    ])
  })

  it("ignores inline gif videos mixed with other media", () => {
    expect(() =>
      parseSe2Blocks(`
        <p>
          <video
            src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
            class="fx _postImage _gifmp4"
            data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
          ></video>
          <iframe src="https://example.com/embed"></iframe>
        </p>
      `),
    ).toThrow("파싱 가능한 naver-se2 block이 없습니다: p")
  })

  it("ignores inline gif videos without a source", () => {
    expect(() =>
      parseSe2Blocks(`
        <p>
          <video class="fx _postImage _gifmp4" data-gif-url=""></video>
        </p>
      `),
    ).toThrow("파싱 가능한 naver-se2 block이 없습니다: p")
  })
})
