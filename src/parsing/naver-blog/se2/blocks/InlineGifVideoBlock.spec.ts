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

  it("parses linked inline gif video wrappers inside legacy paragraphs", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <span>
          <strong>
            <a href="https://example.com/source">
              <video
                src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
                class="fx _postImage _gifmp4"
                data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
              ></video>
            </a>
          </strong>
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

  it("does not claim linked inline gif video wrappers mixed with text", () => {
    const parsed = parseSe2Blocks(`
      <p>
        caption
        <a href="https://example.com/source">
          <video
            src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
            class="fx _postImage _gifmp4"
            data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
          ></video>
        </a>
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "paragraph",
        text: "caption[](https://example.com/source)",
      },
    ])
  })

  it("parses multiple linked inline gif videos into image groups", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <a href="https://example.com/one">
          <video
            src="https://mblogvideo-phinf.pstatic.net/one.gif?type=mp4w800"
            class="fx _postImage _gifmp4"
            data-gif-url="https://mblogthumb-phinf.pstatic.net/one.gif?type=w210"
          ></video>
        </a>
        <br />
        <a href="https://example.com/two">
          <video
            src="https://mblogvideo-phinf.pstatic.net/two.gif?type=mp4w800"
            class="fx _postImage _gifmp4"
            data-gif-url="https://mblogthumb-phinf.pstatic.net/two.gif?type=w210"
          ></video>
        </a>
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "imageGroup",
        images: [
          {
            sourceUrl: "https://mblogthumb-phinf.pstatic.net/one.gif?type=w210",
            originalSourceUrl: "https://mblogvideo-phinf.pstatic.net/one.gif?type=mp4w800",
            alt: "",
            caption: null,
            mediaKind: "image",
          },
          {
            sourceUrl: "https://mblogthumb-phinf.pstatic.net/two.gif?type=w210",
            originalSourceUrl: "https://mblogvideo-phinf.pstatic.net/two.gif?type=mp4w800",
            alt: "",
            caption: null,
            mediaKind: "image",
          },
        ],
      },
    ])
  })

  it("parses top-level inline gif video blocks into image blocks", () => {
    const parsed = parseSe2Blocks(`
      <video
        src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
        class="fx _postImage _gifmp4"
        data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
      ></video>
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

  it("keeps original source empty when inline gif video has no mp4 source", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <video
          class="fx _postImage _gifmp4"
          data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210"
          alt="sample gif"
        ></video>
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://mblogthumb-phinf.pstatic.net/sample.gif?type=w210",
          originalSourceUrl: null,
          alt: "sample gif",
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
