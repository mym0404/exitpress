import { describe, expect, it } from "vitest"
import {
  expectEveryBlockOutputOption,
  parseSe4Blocks,
  parseSe4BlocksWithOptions,
} from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4ImageBlock", () => {
  it("parses image components into image blocks with captions", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-image">
        <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/image.png"}'>
          <img src="https://example.com/image.png" alt="diagram" />
        </a>
        <p class="se-image-caption">image caption</p>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/image.png",
          originalSourceUrl: "https://example.com/image.png",
          alt: "diagram",
          caption: "image caption",
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se4:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("parses image components that use __se_image_link markup", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-image se-l-default">
        <div class="se-component-content se-component-content-fit">
          <div class="se-section se-section-image se-l-default se-section-align-">
            <a
              href="#"
              class="se-module se-module-image __se_image_link __se_link"
              data-linktype="img"
              data-linkdata='{"src":"https://example.com/legacy-se4.png"}'
            >
              <img
                src="https://example.com/legacy-se4.png?type=w80_blur"
                data-lazy-src="https://example.com/legacy-se4.png?type=w800"
                alt=""
                class="se-image-resource"
              />
            </a>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/legacy-se4.png",
          originalSourceUrl: "https://example.com/legacy-se4.png",
          alt: "",
          caption: null,
          mediaKind: "image",
        },
        outputSelectionKey: "naver-se4:image",
        outputSelection: {
          variant: "markdown-image",
          params: {
            includeCaption: false,
          },
        },
      },
    ])
  })

  it("throws when an image component has no parseable image link", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-image">
          <a class="se-module-image-link"><img alt="" /></a>
        </div>
      `),
    ).toThrow("SE4 image block parsing failed.")
  })

  it("falls back to img src when link data has no source", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-image">
        <a class="se-module-image-link">
          <img src="https://example.com/fallback.png" alt="fallback" />
        </a>
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      type: "image",
      image: {
        sourceUrl: "https://example.com/fallback.png",
        originalSourceUrl: null,
        alt: "fallback",
      },
    })
  })

  it("falls back to 360vr preview background images", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-image se-l-default">
        <div class="se-module se-module-image se-module-image-360vr">
          <div
            class="se-360vr-preview"
            style="background-image:url('https://example.com/vr.jpg?type=preview966_544');"
          ></div>
        </div>
        <p class="se-image-caption">360 preview</p>
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      type: "image",
      image: {
        sourceUrl: "https://example.com/vr.jpg?type=preview966_544",
        originalSourceUrl: null,
        alt: "",
        caption: "360 preview",
        mediaKind: "image",
      },
    })
  })

  it("uses an empty alt when the image has no alt attribute", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-image">
        <a class="se-module-image-link">
          <img src="https://example.com/no-alt.png" />
        </a>
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      type: "image",
      image: {
        sourceUrl: "https://example.com/no-alt.png",
        alt: "",
      },
    })
  })

  it("applies every output option", () => {
    expectEveryBlockOutputOption({
      editorType: "naver-se4",
      blockId: "image",
      parse: (blockOutputs) =>
        parseSe4BlocksWithOptions({
          blockOutputs,
          components: [
            `
              <div class="se-component se-image">
                <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/se4-image.png"}'>
                  <img src="https://example.com/se4-image.png" alt="se4 image" />
                </a>
              </div>
            `,
          ],
        }),
    })
  })
})
