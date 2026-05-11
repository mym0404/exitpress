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
