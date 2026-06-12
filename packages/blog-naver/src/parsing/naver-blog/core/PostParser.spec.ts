import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { describe, expect, it } from "vitest"

import { parsePostHtml } from "./PostParser.js"

const testOptions = defaultExportOptions()
const parserOptions = {
  blockOutputs: testOptions.blockOutputs,
}

describe("post-parser routing", () => {
  it("routes SE4 html to the SE4 parser and extracts unique tags", () => {
    const parsed = parsePostHtml({
      html: `
        <div class="post_tag">
          <a href="/PostTagView.naver?tagName=algo">algo</a>
          <a href="/PostTagView.naver?tagName=algo">algo</a>
          <a href="/PostTagView.naver?tagName=math">math</a>
        </div>
        <script>var data = { smartEditorVersion: 4 }</script>
        <div id="viewTypeSelector">
          <div class="se-component se-text">
            <script class="__se_module_data" data-module-v2='{"type":"v2_text"}'></script>
            <p class="se-text-paragraph">SE4 text</p>
          </div>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/1",
      options: parserOptions,
    })
    expect(parsed.tags).toEqual(["algo", "math"])
    expect(parsed.blocks).toEqual([{ blockId: "naver-se4:paragraph", props: { text: "SE4 text" } }])
  })

  it("rewrites same-blog links before paragraph markdown is finalized", () => {
    const parsed = parsePostHtml({
      html: `
        <script>var data = { smartEditorVersion: 4 }</script>
        <div id="viewTypeSelector">
          <div class="se-component se-text">
            <script class="__se_module_data" data-module-v2='{"type":"v2_text"}'></script>
            <p class="se-text-paragraph"><a href="https://m.blog.naver.com/PostView.naver?blogId=mym0404&logNo=2">내부 글</a></p>
          </div>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/1",
      options: {
        ...parserOptions,
        resolveLinkUrl: (url) =>
          url === "https://m.blog.naver.com/PostView.naver?blogId=mym0404&logNo=2"
            ? "../other/index.md"
            : url,
      },
    })

    expect(parsed.blocks).toEqual([
      { blockId: "naver-se4:paragraph", props: { text: "[내부 글](../other/index.md)" } },
    ])
  })

  it("rewrites same-blog link card urls", () => {
    const parsed = parsePostHtml({
      html: `
        <script>var data = { smartEditorVersion: 4 }</script>
        <div id="viewTypeSelector">
          <div class="se-component se-oglink">
            <a class="se-oglink-info" href="https://m.blog.naver.com/PostView.naver?blogId=mym0404&logNo=3"></a>
            <strong class="se-oglink-title">내부 카드</strong>
          </div>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/1",
      options: {
        ...parserOptions,
        resolveLinkUrl: (url) =>
          url === "https://m.blog.naver.com/PostView.naver?blogId=mym0404&logNo=3"
            ? "../card/index.md"
            : url,
      },
    })

    expect(parsed.blocks).toEqual([
      {
        blockId: "naver-se4:linkCard",
        props: {
          title: "내부 카드",
          description: "",
          url: "../card/index.md",
          thumbnailUrl: null,
        },
      },
    ])
  })

  it("routes SE3 html to the SE3 parser", () => {
    const parsed = parsePostHtml({
      html: `
        <script>var data = { smartEditorVersion: 3 }</script>
        <div id="viewTypeSelector">
          <div class="se_component_wrap sect_dsc">
            <div class="se_component se_text">
              <div class="se_textarea">SE3 text</div>
            </div>
          </div>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/2",
      options: parserOptions,
    })
    expect(parsed.blocks).toEqual([{ blockId: "naver-se3:paragraph", props: { text: "SE3 text" } }])
  })

  it("ignores stale code output selections", () => {
    const options = defaultExportOptions()
    const se4Parsed = parsePostHtml({
      html: `
        <script>var data = { smartEditorVersion: 4 }</script>
        <div id="viewTypeSelector">
          <div class="se-component se-code">
            <script class="__se_module_data" data-module-v2='{"type":"v2_code"}'></script>
            <pre class="__se_code_view language-typescript">const se4 = true</pre>
          </div>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/4",
      options: {
        blockOutputs: options.blockOutputs,
      },
    })
    const se3Parsed = parsePostHtml({
      html: `
        <script>var data = { smartEditorVersion: 3 }</script>
        <div id="viewTypeSelector">
          <div class="se_component_wrap sect_dsc">
            <div class="se_component se_code">
              <pre>const se3 = true</pre>
            </div>
          </div>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/5",
      options: {
        blockOutputs: options.blockOutputs,
      },
    })

    expect(se4Parsed.blocks[0]).toMatchObject({
      blockId: "naver-se4:code",
      props: {
        language: "typescript",
        code: "const se4 = true",
      },
    })
    expect(se3Parsed.blocks[0]).toMatchObject({
      blockId: "naver-se3:code",
      props: {
        language: null,
        code: "const se3 = true",
      },
    })
  })

  it("renders paragraph links inline when stale reference link selections are present", () => {
    const options = defaultExportOptions()

    const parsed = parsePostHtml({
      html: `
        <script>var data = { smartEditorVersion: 4 }</script>
        <div id="viewTypeSelector">
          <div class="se-component se-text">
            <script class="__se_module_data" data-module-v2='{"type":"v2_text"}'></script>
            <p class="se-text-paragraph">See <a href="https://example.com">docs</a></p>
          </div>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/6",
      options: {
        blockOutputs: options.blockOutputs,
      },
    })

    expect(parsed.blocks[0]).toEqual({
      blockId: "naver-se4:paragraph",
      props: {
        text: "See [docs](https://example.com)",
      },
    })
  })

  it("routes classic html to the SE2 parser", () => {
    const parsed = parsePostHtml({
      html: `
        <div id="viewTypeSelector">
          <h2>SE2 title</h2>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/3",
      options: parserOptions,
    })
    expect(parsed.blocks).toEqual([
      { blockId: "naver-se2:heading", props: { level: 2, text: "SE2 title" } },
    ])
  })
})
