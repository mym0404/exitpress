import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { renderBlockTemplates } from "@exitpress/engine/markdown/util/renderBlockTemplates.js"
import { describe, expect, it, vi } from "vitest"

import { createTistoryBlogProvider } from "./TistoryBlogProvider.js"

const html = `<!doctype html>
<html>
  <head>
    <title>Fallback Fixture Title</title>
    <meta property="og:title" content="Fixture Tistory Post" />
    <meta property="article:published_time" content="2024-01-02T03:04:05.000Z" />
  </head>
  <body>
    <article>
      <h1>Fixture Tistory Post</h1>
      <p>First paragraph.</p>
      <p>Second paragraph with <a href="https://example.com">a link</a>.</p>
    </article>
  </body>
</html>`

describe("createTistoryBlogProvider", () => {
  it("parses a Tistory post URL source", () => {
    const provider = createTistoryBlogProvider()

    expect(provider.parseSource("https://sample.tistory.com/42")).toEqual({
      providerKey: "tistory",
      sourceId: "sample.tistory.com",
      displayName: "sample.tistory.com",
      input: "https://sample.tistory.com/42",
    })
  })

  it("loads and parses a minimal public Tistory post", async () => {
    const fetchText = vi.fn(async () => html)
    const provider = createTistoryBlogProvider({ fetchText })
    const options = defaultExportOptions()
    const source = provider.parseSource("https://sample.tistory.com/42")

    const scan = await provider.scan(source)
    const post = scan.posts[0]!
    const content = await provider.loadPostContent({ source, post })
    const parsed = provider.parseContent({
      source,
      post,
      content,
      options: {
        blockOutputs: options.blockOutputs,
        assets: options.assets,
      },
    })

    expect(post.title).toBe("Fixture Tistory Post")
    expect(fetchText).toHaveBeenCalledWith("https://sample.tistory.com/42")
    expect(parsed.blocks.map((block) => block.blockId)).toEqual([
      "tistory:heading",
      "tistory:paragraph",
      "tistory:paragraph",
    ])
  })

  it("exposes Tistory block template definitions", () => {
    const provider = createTistoryBlogProvider()
    const definitions = provider.getBlockTemplateDefinitions()
    const definitionKeys = definitions.map((definition) => definition.key)

    expect(definitionKeys).toContain("tistory:heading")
    expect(definitionKeys).toContain("tistory:paragraph")
    expect(definitions[0]?.presets[0].id).toBe("default")
    expect(
      renderBlockTemplates([
        {
          template: definitions[0]!.presets[0].template,
          props: { level: 1, marker: "#", text: "Fixture Tistory Post" },
        },
      ]),
    ).toBe("# Fixture Tistory Post")
  })
})
