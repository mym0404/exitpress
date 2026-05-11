import { describe, expect, it } from "vitest"
import { parseSe4Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4WrappingParagraphBlock", () => {
  it("parses right wrapping paragraph components into image and paragraph blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-wrappingParagraph se-l-inner-big-right">
        <div class="se-component-content">
          <div class="se-component-slot se-component-slot-float">
            <div class="se-section se-section-image se-l-default se-section-align-">
              <a
                class="se-module se-module-image __se_image_link __se_link"
                data-linktype="img"
                data-linkdata='{"src":"https://example.com/wrapped.png"}'
              >
                <img
                  src="https://example.com/wrapped.png?type=w80_blur"
                  data-lazy-src="https://example.com/wrapped.png?type=w800"
                  alt="wrapped"
                  class="se-image-resource"
                />
              </a>
            </div>
          </div>
          <div class="se-component-slot">
            <div class="se-section se-section-text se-l-default">
              <div class="se-module se-module-text">
                <p class="se-text-paragraph">Wrapped <strong>text</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "image",
        image: {
          sourceUrl: "https://example.com/wrapped.png",
          originalSourceUrl: "https://example.com/wrapped.png",
          alt: "wrapped",
          caption: null,
          mediaKind: "image",
        },
      },
      { type: "paragraph", text: "Wrapped **text**" },
    ])
  })

  it("throws when right wrapping paragraph image markup is not parseable", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-wrappingParagraph se-l-inner-big-right">
          <div class="se-component-slot se-component-slot-float">
            <a class="se-module se-module-image __se_image_link"><img alt="" /></a>
          </div>
        </div>
      `),
    ).toThrow("SE4 wrapping paragraph image parsing failed.")
  })
})
