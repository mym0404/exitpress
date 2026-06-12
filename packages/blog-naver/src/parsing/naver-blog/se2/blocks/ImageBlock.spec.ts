import { expectBlockTemplateDefinition, parseSe2Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

describe("NaverSe2ImageBlock", () => {
  it("parses standalone image wrappers into image blocks", () => {
    const parsed = parseSe2Blocks(`
      <p><img src="https://example.com/se2-image.png" alt="classic image" /></p>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:image",
        props: {
          url: "https://example.com/se2-image.png",
          alt: "classic image",
          caption: null,
        },
        assets: {
          url: {
            role: "image",
            sourceUrl: "https://example.com/se2-image.png",
            required: true,
          },
        },
      },
    ])
  })

  it("parses top-level classic post images into image blocks", () => {
    const parsed = parseSe2Blocks(`
      <img class="fx _postImage" src="https://example.com/top-level.png" alt="top level image" />
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:image",
        props: {
          url: "https://example.com/top-level.png",
          alt: "top level image",
          caption: null,
        },
        assets: {
          url: {
            role: "image",
            sourceUrl: "https://example.com/top-level.png",
            required: true,
          },
        },
      },
    ])
  })

  it("parses multiple standalone images into image blocks", () => {
    const parsed = parseSe2Blocks(`
      <div>
        <img src="https://example.com/one.png" alt="one" />
        <img src="https://example.com/two.png" alt="two" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:image",
        props: {
          url: "https://example.com/one.png",
          alt: "one",
          caption: null,
        },
        assets: {
          url: {
            role: "image",
            sourceUrl: "https://example.com/one.png",
            required: true,
          },
        },
      },
      {
        blockId: "naver-se2:image",
        props: {
          url: "https://example.com/two.png",
          alt: "two",
          caption: null,
        },
        assets: {
          url: {
            role: "image",
            sourceUrl: "https://example.com/two.png",
            required: true,
          },
        },
      },
    ])
  })

  it("skips image candidates without a source", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <img alt="missing" />
        <img src="https://example.com/valid.png" alt="valid" />
      </p>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:image",
        props: {
          url: "https://example.com/valid.png",
          alt: "valid",
          caption: null,
        },
        assets: {
          url: {
            role: "image",
            sourceUrl: "https://example.com/valid.png",
            required: true,
          },
        },
      },
    ])
  })

  it("skips Naver blank spacer images", () => {
    const parsed = parseSe2Blocks(`
      <p>
        <img src="https://ssl.pstatic.net/static/blog/blank.gif" alt="" />
      </p>
    `)

    expect(parsed.blocks).toEqual([])
  })

  it("parses classic thumburl images inside nested wrappers", () => {
    const parsed = parseSe2Blocks(`
      <div style="font-size:12pt;">
        <p>
          <span class="_img _inl fx" thumburl="https://mblogthumb-phinf.pstatic.net/one.png?type="></span>
          <br />
          <br />
          <span class="_img _inl fx" thumburl="https://mblogthumb-phinf.pstatic.net/two.png?type="></span>&nbsp;
        </p>
        <p><br /></p>
        <p>블렌더 어렵다</p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se2:image",
        props: {
          url: "https://mblogthumb-phinf.pstatic.net/one.png?type=w800",
          alt: "",
          caption: null,
        },
        assets: {
          url: {
            role: "image",
            sourceUrl: "https://mblogthumb-phinf.pstatic.net/one.png?type=w800",
            required: true,
          },
        },
      },
      {
        blockId: "naver-se2:image",
        props: {
          url: "https://mblogthumb-phinf.pstatic.net/two.png?type=w800",
          alt: "",
          caption: null,
        },
        assets: {
          url: {
            role: "image",
            sourceUrl: "https://mblogthumb-phinf.pstatic.net/two.png?type=w800",
            required: true,
          },
        },
      },
      { blockId: "naver-se2:paragraph", props: { text: "블렌더 어렵다" } },
    ])
  })

  it("applies every output option", () => {
    expectBlockTemplateDefinition({
      editorType: "naver-se2",
      blockId: "image",
      parse: (blockOutputs) =>
        parseSe2Blocks(
          `<p><img src="https://example.com/se2-image.png" alt="classic image" /></p>`,
          { blockOutputs },
        ),
    })
  })
})
