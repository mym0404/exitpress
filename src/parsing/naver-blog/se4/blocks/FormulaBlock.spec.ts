import { describe, expect, it } from "vitest"

import {
  createSe4ModuleScript,
  expectEveryBlockOutputOption,
  parseSe4Blocks,
  parseSe4BlocksWithOptions,
} from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe4FormulaBlock", () => {
  it("parses formula components into formula blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-math">
        ${createSe4ModuleScript({ type: "v2_formula", data: { latex: "$x^2 + y^2 = z^2$" } })}
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "formula",
        formula: "x^2 + y^2 = z^2",
        display: true,
        outputSelectionKey: "naver-se4:formula",
        outputSelection: {
          variant: "wrapper",
          params: {
            inlineWrapper: "$",
            blockWrapper: "$$",
          },
        },
      },
    ])
  })

  it("marks inline formula components as display false", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-math se-inline-math">
        ${createSe4ModuleScript({ type: "v2_formula", data: { latex: "$x+y$" } })}
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "formula",
        formula: "x+y",
        display: false,
        outputSelectionKey: "naver-se4:formula",
        outputSelection: {
          variant: "wrapper",
          params: {
            inlineWrapper: "$",
            blockWrapper: "$$",
          },
        },
      },
    ])
  })

  it("parses formula text from html metadata", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-math">
        ${createSe4ModuleScript({
          type: "v2_formula",
          data: { html: '<span class="mq-selectable">a+b</span>' },
        })}
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({ type: "formula", formula: "a+b" })
  })

  it("parses formula text metadata and display flags", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-math">
        ${createSe4ModuleScript({
          type: "v2_formula",
          data: { text: "$c+d$", display: false },
        })}
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      type: "formula",
      formula: "c+d",
      display: false,
    })
  })

  it("throws when formula metadata has no formula text", () => {
    expect(() =>
      parseSe4Blocks(`
        <div class="se-component se-math">
          ${createSe4ModuleScript({ type: "v2_formula", data: {} })}
        </div>
      `),
    ).toThrow("SE4 formula block parsing failed.")
  })

  it("applies every output option", () => {
    expectEveryBlockOutputOption({
      editorType: "naver-se4",
      blockId: "formula",
      parse: (blockOutputs) =>
        parseSe4BlocksWithOptions({
          blockOutputs,
          components: [
            `
              <div class="se-component se-math">
                ${createSe4ModuleScript({ type: "v2_formula", data: { latex: "$x+y$" } })}
              </div>
            `,
          ],
        }),
    })
  })
})
