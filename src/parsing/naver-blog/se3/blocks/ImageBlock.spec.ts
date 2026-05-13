import { describe, expect, it } from "vitest"
import {
  expectEveryBlockOutputOption,
  parseSe3Blocks,
  parseSe3BlocksWithOptions,
} from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe3ImageBlock", () => {
  it("parses standalone image components into image blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image">
        <img src="https://example.com/se3-image.png" alt="se3 image" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/se3-image.png",
          originalSourceUrl: null,
          alt: "se3 image",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se3:image",
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
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image">
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
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image">
        <img alt="missing" />
        <img data-lazy-src="https://example.com/lazy.png" alt="lazy" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/lazy.png",
          originalSourceUrl: null,
          alt: "lazy",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se3:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("parses gif video images inside default image components", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image default">
        <div class="se_sectionArea se_align-center">
          <div class="se_editArea">
            <div class="se_viewArea">
              <a class="se_mediaArea __se_image_link __se_link" data-linktype="img">
                <video
                  src="https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800"
                  class="_gifmp4 se_mediaImage"
                  data-gif-url="https://mblogthumb-phinf.pstatic.net/sample.gif?type=w800"
                ></video>
              </a>
            </div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://mblogthumb-phinf.pstatic.net/sample.gif?type=w800",
          originalSourceUrl: "https://mblogvideo-phinf.pstatic.net/sample.gif?type=mp4w800",
          alt: "",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se3:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("keeps gif video images without mp4 sources as source-only images", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image default">
        <video
          class="_gifmp4 se_mediaImage"
          data-gif-url="https://mblogthumb-phinf.pstatic.net/source-only.gif?type=w800"
        ></video>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://mblogthumb-phinf.pstatic.net/source-only.gif?type=w800",
          originalSourceUrl: null,
          alt: "",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se3:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("parses legacy sticker image components as image blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_sticker default">
        <img src="https://example.com/sticker.png" alt="sticker" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/sticker.png",
          originalSourceUrl: null,
          alt: "sticker",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se3:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("parses legacy image strip components as image group blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_imageStrip imageStrip2 default">
        <img src="https://example.com/strip-1.png" alt="strip 1" />
        <img src="https://example.com/strip-2.png" alt="strip 2" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "imageGroup",
        images: [
          {
            sourceUrl: "https://example.com/strip-1.png",
            originalSourceUrl: null,
            alt: "strip 1",
            caption: null,
            mediaKind: "image",
          },
          {
            sourceUrl: "https://example.com/strip-2.png",
            originalSourceUrl: null,
            alt: "strip 2",
            caption: null,
            mediaKind: "image",
          },
        ],
      },
    ])
  })

  it("preserves text inside image components as a paragraph after the image", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image default">
        <img src="https://example.com/image.png" alt="image" />
        <div class="se_editView">
          <div class="se_textView se_mediaCaption">
            <span class="se_textarea">image caption</span>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/image.png",
          originalSourceUrl: null,
          alt: "image",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se3:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
      {
        type: "paragraph",
        text: "image caption",
      },
    ])
  })

  it("preserves text inside image strip components as a paragraph after the image group", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_imageStrip imageStrip2 default">
        <img src="https://example.com/strip-1.png" alt="strip 1" />
        <img src="https://example.com/strip-2.png" alt="strip 2" />
        <div class="se_editView">
          <div class="se_textView se_mediaCaption">
            <span class="se_textarea">strip caption</span>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "imageGroup",
        images: [
          {
            sourceUrl: "https://example.com/strip-1.png",
            originalSourceUrl: null,
            alt: "strip 1",
            caption: null,
            mediaKind: "image",
          },
          {
            sourceUrl: "https://example.com/strip-2.png",
            originalSourceUrl: null,
            alt: "strip 2",
            caption: null,
            mediaKind: "image",
          },
        ],
      },
      {
        type: "paragraph",
        text: "strip caption",
      },
    ])
  })

  it("does not pull images from nested components into the parent image block", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image">
        <img src="https://example.com/root.png" alt="root" />
        <div class="se_component se_image">
          <img src="https://example.com/nested.png" alt="nested" />
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/root.png",
          originalSourceUrl: null,
          alt: "root",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se3:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("applies every output option", () => {
    expectEveryBlockOutputOption({
      editorType: "naver-se3",
      blockId: "image",
      parse: (blockOutputs) =>
        parseSe3BlocksWithOptions({
          blockOutputs,
          components: [
            `
              <div class="se_component se_image">
                <img src="https://example.com/se3-image.png" alt="se3 image" />
              </div>
            `,
          ],
        }),
    })
  })
})
