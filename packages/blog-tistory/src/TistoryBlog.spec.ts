import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { exportBlogPostUnit } from "@exitpress/engine/exporting/blog/BlogPostExportUnit.js"
import { renderBlockTemplates } from "@exitpress/engine/markdown/util/renderBlockTemplates.js"
import { describe, expect, it, vi } from "vitest"

import { createTistoryBlog } from "./TistoryBlog.js"

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

describe("createTistoryBlog", () => {
  it("parses a Tistory post URL source", () => {
    const blog = createTistoryBlog()

    expect(blog.parseSource("https://sample.tistory.com/42")).toEqual({
      blogKey: "tistory",
      sourceId: "sample.tistory.com",
      displayName: "sample.tistory.com",
      input: "https://sample.tistory.com/42",
    })
  })

  it("loads and parses a minimal public Tistory post", async () => {
    const fetchText = vi.fn(async () => html)
    const blog = createTistoryBlog({ fetchText })
    const options = defaultExportOptions()
    const source = blog.parseSource("https://sample.tistory.com/42")

    const scan = await blog.scan(source)
    const post = scan.posts[0]!
    const content = await blog.loadPostContent({ source, post })
    const parsed = blog.parseContent({
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

  it("exports a Tistory blog post to markdown", async () => {
    const blog = createTistoryBlog({
      fetchText: vi.fn(async () => html),
    })
    const source = blog.parseSource("https://sample.tistory.com/42")
    const scan = await blog.scan(source)
    const post = scan.posts[0]!
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "exitpress-blog-tistory-"))

    try {
      const result = await exportBlogPostUnit({
        blog,
        source,
        outputDir: tempDir,
        post,
        categories: scan.categories,
        options: defaultExportOptions(),
        uploadEnabled: false,
        abortSignal: null,
      })
      const markdown = await readFile(result.markdownFilePath, "utf8")

      expect(markdown).toContain("Fixture Tistory Post")
      expect(markdown).toContain("First paragraph.")
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it("exposes Tistory block template definitions", () => {
    const blog = createTistoryBlog()
    const definitions = blog.getBlockTemplateDefinitions()
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
