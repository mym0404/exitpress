import { renderTemplateExpressions } from "@exitpress/domain/template/util/renderTemplateExpressions.js"
import { createSe4ModuleScript, parseSe4Blocks } from "@tests/support/parser-test-utils.js"
import { describe, expect, it } from "vitest"

import { NaverSe4CodeBlock } from "./CodeBlock.js"

describe("NaverSe4CodeBlock", () => {
  it("parses code components with language metadata", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-code">
        ${createSe4ModuleScript({ type: "v2_code" })}
        <pre class="__se_code_view language-typescript">const value = 1
console.log(value)
</pre>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:code",
        props: {
          language: "typescript",
          code: "const value = 1\nconsole.log(value)",
        },
      },
    ])
  })

  it("skips code components with no code", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-code">
        ${createSe4ModuleScript({ type: "v2_code" })}
        <pre class="__se_code_view"></pre>
      </div>
    `)

    expect(parsed.blocks).toEqual([])
  })

  it("parses code components without language metadata", () => {
    const parsed = parseSe4Blocks(`
      <div class="se-component se-code">
        ${createSe4ModuleScript({ type: "v2_code" })}
        <pre class="__se_code_view">plain()</pre>
      </div>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      blockId: "naver-se4:code",
      props: {
        language: null,
        code: "plain()",
      },
    })
  })
})

it("restores ColorScripter table code with exact spaces, lines and pipes", () => {
  const parsed = parseSe4Blocks(
    '<div class="se-component se-table"><table><tr><td><p><span> id </span><span>|</span><span> name  </span></p><p>----+-------</p><p>  1 | Paul  </p><p></p><p>  SELECT *<br>    FROM company;</p></td><td><p><a href="http://colorscripter.com/info#e">cs</a></p></td></tr></table></div>',
  )

  expect(parsed.blocks).toEqual([
    {
      blockId: "naver-se4:code",
      props: {
        language: null,
        code: " id | name  \n----+-------\n  1 | Paul  \n\n  SELECT *\n    FROM company;",
      },
    },
  ])
  expect(
    renderTemplateExpressions({
      template: new NaverSe4CodeBlock().templateDefinition.presets[0].template,
      props: parsed.blocks[0]!.props,
    }),
  ).toBe("```\n id | name  \n----+-------\n  1 | Paul  \n\n  SELECT *\n    FROM company;\n```")
})

it.each([
  '<tr><td><p>prose</p></td><td><a href="https://example.com/info#e">cs</a></td></tr>',
  '<tr><td><p>prose</p></td><td><a href="https://colorscripter.com/info#e">cs</a> documentation</td></tr>',
  '<tr><td><p>prose</p></td><td><a href="https://colorscripter.com/info#e">cs</a></td></tr><tr><td>a</td><td>b</td></tr>',
  '<tr><td><p><img src="https://example.com/image.png"></p></td><td><a href="https://colorscripter.com/info#e">cs</a></td></tr>',
  '<tr><td colspan="2"><p>prose</p></td><td><a href="https://colorscripter.com/info#e">cs</a></td></tr>',
])("keeps ordinary or media-bearing tables as tables: %s", (rows) => {
  const parsed = parseSe4Blocks(`<div class="se-component se-table"><table>${rows}</table></div>`)
  expect(parsed.blocks[0]?.blockId).toBe("naver-se4:table")
  if (rows.includes("<img")) expect(parsed.blocks[0]?.assets).toBeDefined()
})
