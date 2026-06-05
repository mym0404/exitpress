import { describe, expect, it } from "vitest"

import {
  expectBlockTemplateDefinition,
  parseSe2Blocks,
} from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2TableBlock", () => {
  it("parses Color Scripter tables into code blocks", () => {
    const parsed = parseSe2Blocks(`
      <div class="colorscripter-code" style="overflow:auto">
        <table class="colorscripter-code-table" style="margin:0; padding:0; border:none;" cellspacing="0" cellpadding="0">
          <tbody>
            <tr>
              <td style="padding:6px; border-right:2px solid #4f4f4f">
                <div><div>1</div><div>2</div><div>3</div><div>4</div></div>
              </td>
              <td style="padding:6px 0">
                <div>
                  <div style="padding:0 6px; white-space:pre">(리스트&nbsp;생성)</div>
                  <div style="padding:0 6px; white-space:pre"><span style="color:#ff3399">void</span>&nbsp;ListInit(List&nbsp;<span style="color:#ff3399">*</span>&nbsp;plist);</div>
                  <div style="padding:0 6px; white-space:pre">&nbsp;</div>
                  <div style="padding:0 6px; white-space:pre"><span style="color:#4be6fa">int</span>&nbsp;LCount(List&nbsp;<span style="color:#ff3399">*</span>plist);</div>
                </div>
              </td>
              <td style="vertical-align:bottom; padding:0 2px 4px 0">
                <a href="http://colorscripter.com/info#e" target="_blank" class="con_link">
                  <span style="font-size:9px;">cs</span>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: [
          "(리스트 생성)",
          "void ListInit(List * plist);",
          "",
          "int LCount(List *plist);",
        ].join("\n"),
      },
    ])
  })

  it("ignores Color Scripter footer markup when extracting code blocks", () => {
    const parsed = parseSe2Blocks(`
      <table class="colorscripter-code-table" style="margin:0; padding:0; border:none;" cellspacing="0" cellpadding="0">
        <tbody>
          <tr>
            <td style="padding:6px; border-right:2px solid #e5e5e5">
              <div><div>1</div><div>2</div></div>
            </td>
            <td style="padding:6px 0">
              <div>
                <div style="padding:0 6px; white-space:pre"><span style="color:#ff3399">typedef</span>&nbsp;<span style="color:#ff3399">struct</span>&nbsp;_node</div>
                <div style="padding:0 6px; white-space:pre">{</div>
              </div>
              <div style="text-align:right; margin-top:-13px; margin-right:5px; font-size:9px; font-style:italic">
                <a href="http://colorscripter.com/info#e" target="_blank" class="con_link">Colored by Color Scripter</a>
              </div>
            </td>
            <td style="vertical-align:bottom; padding:0 2px 4px 0">
              <p>
                <span style="font-size:9px;">
                  <a href="http://colorscripter.com/info#e" target="_blank" class="con_link"><br /></a>
                </span>
              </p>
              <p>
                <span style="font-size:9px;">
                  <a href="http://colorscripter.com/info#e" target="_blank" class="con_link">cs</a>
                </span>
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: ["typedef struct _node", "{"].join("\n"),
      },
    ])
  })

  it("parses mobile Color Scripter markup that stores styles in _foo", () => {
    const parsed = parseSe2Blocks(`
      <table class="colorscripter-code-table" cellspacing="0" cellpadding="0">
        <tr>
          <td><div><div>1</div><div>2</div></div></td>
          <td>
            <div _foo="margin: 0px; padding: 0px;">
              <div style="" _foo="padding:0 6px; white-space:pre"><span _foo="color:#ff3399">void</span>&nbsp;ListInit(List&nbsp;* plist);</div>
              <div style="" _foo="padding:0 6px; white-space:pre"><span _foo="color:#4be6fa">int</span>&nbsp;LCount(List&nbsp;*plist);</div>
            </div>
          </td>
          <td><a href="http://colorscripter.com/info#e" class="con_link">cs</a></td>
        </tr>
      </table>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: ["void ListInit(List * plist);", "int LCount(List *plist);"].join("\n"),
      },
    ])
  })

  it("parses searched Color Scripter tables without line number columns", () => {
    const parsed = parseSe2Blocks(`
      <table class="colorscripter-code-table" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding:6px 0">
            <div _foo="margin:0; padding:0; color:#010101">
              <div _foo="padding:0 6px; white-space:pre"><span _foo="color:#a71d5d">class</span>&nbsp;Person</div>
              <div _foo="padding:0 6px; white-space:pre">var&nbsp;person&nbsp;<span _foo="color:#a71d5d">=</span>&nbsp;Person()</div>
            </div>
          </td>
          <td><a href="http://colorscripter.com/info#e" class="con_link">cs</a></td>
        </tr>
      </table>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: ["class Person", "var person = Person()"].join("\n"),
      },
    ])
  })

  it("parses searched Color Scripter div wrappers", () => {
    const parsed = parseSe2Blocks(`
      <div class="colorscripter-code-table" style="margin:0">
        <div style="padding:0 6px; white-space:pre">#include&nbsp;&lt;stdio.h&gt;</div>
        <div style="padding:0 6px; white-space:pre">printf(<span>"hello"</span>);</div>
        <a href="http://colorscripter.com/info#e" class="con_link">cs</a>
      </div>
    `)

    expect(parsed.blocks).toEqual([
      {
        type: "code",
        language: null,
        code: ["#include <stdio.h>", 'printf("hello");'].join("\n"),
      },
    ])
  })

  it("skips empty Color Scripter tables from live failure samples", () => {
    const parsed = parseSe2Blocks(`
      <p>before</p>
      <table class="colorscripter-code-table" cellspacing="0" cellpadding="0">
        <tr><td style="padding:6px 0"></td></tr>
      </table>
      <table class="colorscripter-code-table" cellspacing="0" cellpadding="0"></table>
      <table class="colorscripter-code-table" cellspacing="0" cellpadding="0">
        <tr><td style="padding:6px"></td><td style="padding:6px 0"></td></tr>
      </table>
      <p>after</p>
    `)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "before" },
      { type: "paragraph", text: "after" },
    ])
  })

  it("parses table tags into table blocks", () => {
    const parsed = parseSe2Blocks(`
      <table>
        <tr><th>name</th><th>value</th></tr>
        <tr><td colspan="2">merged</td></tr>
      </table>
    `)

    expect(parsed.blocks).toHaveLength(1)
    expect(parsed.blocks[0]).toMatchObject({
      type: "table",
      complex: true,
      rows: [
        [
          { text: "name", isHeader: true },
          { text: "value", isHeader: true },
        ],
        [{ text: "merged", colspan: 2, isHeader: false }],
      ],
    })
  })

  it("flattens single-column layout tables into paragraph blocks", () => {
    const parsed = parseSe2Blocks(`
      <table>
        <tr><td><p>첫 줄<br>둘째 줄</p></td></tr>
        <tr><td><p>셋째 줄</p></td></tr>
      </table>
    `)

    expect(parsed.blocks).toEqual([
      { type: "paragraph", text: "첫 줄  \n둘째 줄" },
      { type: "paragraph", text: "셋째 줄" },
    ])
  })

  it("keeps empty single-column tables as table blocks", () => {
    const parsed = parseSe2Blocks(`
      <table>
        <tr><td><br /></td></tr>
      </table>
    `)

    expect(parsed.blocks[0]).toMatchObject({
      type: "table",
      complex: false,
      rows: [[{ text: "", html: "<br>", colspan: 1, rowspan: 1, isHeader: false }]],
    })
  })

  it("preserves non-table Color Scripter wrapper text without code", () => {
    const parsed = parseSe2Blocks(`
      <div class="colorscripter-code-table">not code</div>
    `)

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "not code" }])
  })

  it("applies every output option", () => {
    expectBlockTemplateDefinition({
      editorType: "naver-se2",
      blockId: "table",
      parse: (blockOutputs) =>
        parseSe2Blocks(
          `
            <table>
              <tr><th>name</th><th>value</th></tr>
              <tr><td>alpha</td><td>1</td></tr>
            </table>
          `,
          { blockOutputs },
        ),
    })
  })
})
