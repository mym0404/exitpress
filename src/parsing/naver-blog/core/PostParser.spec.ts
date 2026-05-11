import { describe, expect, it } from "vitest"
import { defaultExportOptions } from "../../../domain/export-options/ExportOptions.js"
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
    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "SE4 text" }])
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

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "[내부 글](../other/index.md)" }])
  })

  it("rewrites same-blog link card urls when they become paragraphs", () => {
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

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "[내부 카드](../card/index.md)" }])
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
    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "SE3 text" }])
  })

  it("ignores stale code output selections", () => {
    const options = defaultExportOptions()
    options.blockOutputs.defaults["naver-se4:code"] = {
      variant: "tilde-fence",
    }
    options.blockOutputs.defaults["naver-se3:code"] = {
      variant: "backtick-fence",
    }
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
      type: "code",
      language: "typescript",
      code: "const se4 = true",
    })
    expect(se3Parsed.blocks[0]).toMatchObject({
      type: "code",
      language: null,
      code: "const se3 = true",
    })
    expect(se4Parsed.blocks[0]).not.toHaveProperty("outputSelectionKey")
    expect(se3Parsed.blocks[0]).not.toHaveProperty("outputSelectionKey")
  })

  it("renders paragraph links inline when stale reference link selections are present", () => {
    const options = defaultExportOptions()
    options.blockOutputs.defaults["naver-se4:paragraph"] = {
      variant: "reference-links",
    }

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
      type: "paragraph",
      text: "See [docs](https://example.com)",
    })
  })

  it("routes legacy html to the SE2 parser", () => {
    const parsed = parsePostHtml({
      html: `
        <div id="viewTypeSelector">
          <h2>SE2 title</h2>
        </div>
      `,
      sourceUrl: "https://blog.naver.com/mym0404/3",
      options: parserOptions,
    })
    expect(parsed.blocks).toEqual([{ type: "heading", level: 2, text: "SE2 title" }])
  })
})
