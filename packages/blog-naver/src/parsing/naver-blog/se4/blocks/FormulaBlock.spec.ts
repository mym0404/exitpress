import { renderTemplateExpressions } from "@exitpress/domain/template/util/renderTemplateExpressions.js"
import {
  createSe4ModuleScript,
  expectBlockTemplateDefinition,
  parseSe4Blocks,
  parseSe4BlocksWithOptions,
} from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

import { NaverSe4FormulaBlock } from "./FormulaBlock.js"

describe("NaverSe4FormulaBlock", () => {
  it("parses formula components into formula blocks", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-math">
        ${createSe4ModuleScript({ type: "v2_formula", data: { latex: "$x^2 + y^2 = z^2$" } })}
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:formula",
        props: {
          formula: "x^2 + y^2 = z^2",
          display: true,
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
        blockId: "naver-se4:formula",
        props: {
          formula: "x+y",
          display: false,
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

    expect(parsed.blocks[0]).toMatchObject({
      blockId: "naver-se4:formula",
      props: { formula: "a+b" },
    })
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
      blockId: "naver-se4:formula",
      props: {
        formula: "c+d",
        display: false,
      },
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
    expectBlockTemplateDefinition({
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

it("preserves every MathQuill line instead of choosing the longest line", () => {
  const parsed = parseSe4Blocks(`<div class="se-component se-math">
    ${createSe4ModuleScript({ type: "v2_formula", data: { html: '<span class="mq-selectable">$x=1$</span><span class="mq-selectable">$$</span><span class="mq-selectable">$y=x+2$</span><span class="mq-root-block">duplicated visible text</span>' } })}
  </div>`)

  expect(parsed.blocks.map((block) => block.props.formula)).toEqual(["x=1", "y=x+2"])
  expect(
    parsed.blocks.map((block) =>
      renderTemplateExpressions({
        template: new NaverSe4FormulaBlock().templateDefinition.presets[0].template,
        props: block.props,
      }),
    ),
  ).toEqual(["$$\nx=1\n$$", "$$\ny=x+2\n$$"])
})

it("keeps nested combi braces as grouping rather than inventing binomial arguments", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: String.raw`\combi{\left(2^{\frac{N}{2}}\right)}` } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(String.raw`{\left(2^{\frac{N}{2}}\right)}`)
})

it("normalizes Naver's harpoon accent without changing its argument", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: String.raw`\overrightharpoonup{OA}` } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(String.raw`\overrightharpoon{OA}`)
})

it("normalizes Naver's non-congruence relation", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: String.raw`a_1-a_2\nequiv 0` } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(String.raw`a_1-a_2\not\equiv 0`)
})

it("normalizes Naver's union operator", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: String.raw`A\lcup B=B\lcup A` } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(String.raw`A\cup B=B\cup A`)
})

it("removes editor backspace controls without removing TeX commands", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: "\u0008\u0008r=2^{-n}+\\beta" } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(String.raw`r=2^{-n}+\beta`)
})

it("preserves a trailing escaped space without turning line breaks into spaces", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { html: '<span class="mq-selectable">$x=1\\ $</span><span class="mq-selectable">$y=2\\\\$</span>' } })}</div>`,
  )
  expect(parsed.blocks.map((block) => block.props.formula)).toEqual(["x=1\\ ", "y=2\\\\"])
})

it("normalizes Naver's set non-membership relation", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: String.raw`i\nin S` } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(String.raw`i\notin S`)
})

it("preserves Naver's upright font wrapper and nested color expression", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: String.raw`\normal{1}{\textcolor{#000000}{x}}` } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(String.raw`\mathrm{\textcolor{#000000}{x}}`)
})

it("preserves grid cell values and per-cell right and bottom borders", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: String.raw`\begin{grid}\cell{0100}2&\cell{0000}1&\cell{0000}-2\\\cell{0100}\ &\cell{0010}0&\cell{0010}2\\\cell{0000}\ &\cell{0100}1&\cell{0000}-1\end{grid}` } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(
    String.raw`\begin{array}{ccc}2\vert&1&-2\\\ \vert&\underline{0}&\underline{2}\\\ &1\vert&-1\end{array}`,
  )
})

it("preserves the remaining grid border sides without applying borders to adjacent cells", () => {
  const parsed = parseSe4Blocks(
    `<div class="se-component se-math">${createSe4ModuleScript({ type: "v2_formula", data: { latex: String.raw`\begin{grid}\cell{1001}a&\cell{0000}b\end{grid}` } })}</div>`,
  )
  expect(parsed.blocks[0]?.props.formula).toBe(
    String.raw`\begin{array}{cc}\vert \overline{a}&b\end{array}`,
  )
})
