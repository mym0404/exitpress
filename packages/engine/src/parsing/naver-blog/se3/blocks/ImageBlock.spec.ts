import {
  expectBlockTemplateDefinition,
  parseSe3Blocks,
  parseSe3BlocksWithOptions,
} from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

const imageAsset = (sourceUrl: string) => ({
  role: "image",
  sourceUrl,
  required: true,
})

describe("NaverSe3ImageBlock", () => {
  it("parses standalone image components into image blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image">
        <img src="https://example.com/se3-image.png" alt="se3 image" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/se3-image.png",
          alt: "se3 image",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/se3-image.png"),
        },
      },
    ])
  })

  it("parses multiple standalone images into image blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image">
        <img src="https://example.com/one.png" alt="one" />
        <img src="https://example.com/two.png" alt="two" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/one.png",
          alt: "one",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/one.png"),
        },
      },
      {
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/two.png",
          alt: "two",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/two.png"),
        },
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
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/lazy.png",
          alt: "lazy",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/lazy.png"),
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
        blockId: "naver-se3:image",
        props: {
          url: "https://mblogthumb-phinf.pstatic.net/sample.gif?type=w800",
          alt: "",
          caption: null,
        },
        assets: {
          url: imageAsset("https://mblogthumb-phinf.pstatic.net/sample.gif?type=w800"),
        },
      },
    ])
  })

  it("falls back to 360vr preview background images", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image se_360vr default">
        <div class="se_sectionArea se_align-justify">
          <div class="se_editArea">
            <div class="se_viewArea is-default __se_360vr_wrapper">
              <div class="se_mediaArea __se_360vr_container">
                <div class="se_imageArea">
                  <div
                    class="se_mediaImage __se_360vr_preview"
                    style="background-image:url('https://example.com/vr.jpg?type=preview966_544');"
                  ></div>
                </div>
              </div>
              <div class="se_editView">
                <div class="se_textView se_mediaCaption">
                  <span class="se_textarea">360 preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/vr.jpg?type=preview966_544",
          alt: "",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/vr.jpg?type=preview966_544"),
        },
      },
      {
        blockId: "naver-se3:paragraph",
        props: {
          text: "360 preview",
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
        blockId: "naver-se3:image",
        props: {
          url: "https://mblogthumb-phinf.pstatic.net/source-only.gif?type=w800",
          alt: "",
          caption: null,
        },
        assets: {
          url: imageAsset("https://mblogthumb-phinf.pstatic.net/source-only.gif?type=w800"),
        },
      },
    ])
  })

  it("parses classic sticker image components as image blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_sticker default">
        <img src="https://example.com/sticker.png" alt="sticker" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/sticker.png",
          alt: "sticker",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/sticker.png"),
        },
      },
    ])
  })

  it("parses classic image strip components as image strip blocks", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_imageStrip imageStrip2 default">
        <img src="https://example.com/strip-1.png" alt="strip 1" />
        <img src="https://example.com/strip-2.png" alt="strip 2" />
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se3:imageStrip",
        props: {
          images: [
            {
              url: "https://example.com/strip-1.png",
              alt: "strip 1",
              caption: null,
            },
            {
              url: "https://example.com/strip-2.png",
              alt: "strip 2",
              caption: null,
            },
          ],
        },
        assets: {
          "images.0.url": imageAsset("https://example.com/strip-1.png"),
          "images.1.url": imageAsset("https://example.com/strip-2.png"),
        },
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
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/image.png",
          alt: "image",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/image.png"),
        },
      },
      {
        blockId: "naver-se3:paragraph",
        props: {
          text: "image caption",
        },
      },
    ])
  })

  it("preserves text inside image strip components as a paragraph after the image strip", () => {
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
        blockId: "naver-se3:imageStrip",
        props: {
          images: [
            {
              url: "https://example.com/strip-1.png",
              alt: "strip 1",
              caption: null,
            },
            {
              url: "https://example.com/strip-2.png",
              alt: "strip 2",
              caption: null,
            },
          ],
        },
        assets: {
          "images.0.url": imageAsset("https://example.com/strip-1.png"),
          "images.1.url": imageAsset("https://example.com/strip-2.png"),
        },
      },
      {
        blockId: "naver-se3:paragraph",
        props: {
          text: "strip caption",
        },
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
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/root.png",
          alt: "root",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/root.png"),
        },
      },
    ])
  })

  it("does not pull 360vr preview images from nested components into the parent image block", () => {
    const parsed = parseSe3Blocks(`
      <div class="se_component se_image">
        <img src="https://example.com/root.png" alt="root" />
        <div class="se_component se_image se_360vr default">
          <div class="se_mediaImage __se_360vr_preview" style="background-image:url('https://example.com/nested-vr.jpg');"></div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se3:image",
        props: {
          url: "https://example.com/root.png",
          alt: "root",
          caption: null,
        },
        assets: {
          url: imageAsset("https://example.com/root.png"),
        },
      },
    ])
  })

  it("applies every output option", () => {
    expectBlockTemplateDefinition({
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
