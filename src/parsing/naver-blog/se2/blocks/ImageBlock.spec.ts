import { describe, expect, it } from "vitest"

import {
  expectEveryBlockOutputOption,
  parseSe2Blocks,
} from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2ImageBlock", () => {
  it("parses standalone image wrappers into image blocks", () => {
    const parsed = parseSe2Blocks(`
      <p><img src="https://example.com/se2-image.png" alt="legacy image" /></p>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/se2-image.png",
          originalSourceUrl: null,
          alt: "legacy image",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se2:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("parses top-level legacy post images into image blocks", () => {
    const parsed = parseSe2Blocks(`
      <img class="fx _postImage" src="https://example.com/top-level.png" alt="top level image" />
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/top-level.png",
          originalSourceUrl: null,
          alt: "top level image",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se2:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("parses multiple standalone images into imageGroup blocks", () => {
    const parsed = parseSe2Blocks(`
      <div>
        <img src="https://example.com/one.png" alt="one" />
        <img src="https://example.com/two.png" alt="two" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "imageGroup",
        images: [
          {
            sourceUrl: "https://example.com/one.png",
            originalSourceUrl: null,
            alt: "one",
            caption: null,
            mediaKind: "image",
          },
          {
            sourceUrl: "https://example.com/two.png",
            originalSourceUrl: null,
            alt: "two",
            caption: null,
            mediaKind: "image",
          },
        ],
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
        type: "image",
        image: {
          sourceUrl: "https://example.com/valid.png",
          originalSourceUrl: null,
          alt: "valid",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se2:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("parses legacy thumburl image groups inside nested wrappers", () => {
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
        type: "imageGroup",
        images: [
          {
            sourceUrl: "https://mblogthumb-phinf.pstatic.net/one.png?type=w800",
            originalSourceUrl: null,
            alt: "",
            caption: null,
            mediaKind: "image",
          },
          {
            sourceUrl: "https://mblogthumb-phinf.pstatic.net/two.png?type=w800",
            originalSourceUrl: null,
            alt: "",
            caption: null,
            mediaKind: "image",
          },
        ],
      },
      { type: "paragraph", text: "블렌더 어렵다" },
    ])
  })

  it("applies every output option", () => {
    expectEveryBlockOutputOption({
      editorType: "naver-se2",
      blockId: "image",
      parse: (blockOutputs) =>
        parseSe2Blocks(
          `<p><img src="https://example.com/se2-image.png" alt="legacy image" /></p>`,
          { blockOutputs },
        ),
    })
  })
})
