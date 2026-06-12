import { readFile, rm } from "node:fs/promises"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { createMarkdownMockBlog } from "@tests/support/blog/MockBlogs.js"
import { createTestTempDir } from "@tests/support/test-paths.js"
import { describe, expect, it, vi } from "vitest"

import type { Blog } from "@exitpress/engine/blog/Blog.js"

import { exportBlogPostUnit } from "./BlogPostExportUnit.js"

describe("exportBlogPostUnit", () => {
  it("exports one blog post through the markdown renderer", async () => {
    const tempDir = await createTestTempDir("blog-post-export-")
    const blog = createMarkdownMockBlog()
    const source = blog.parseSource("mock-blog")
    const scan = await blog.scan(source)
    const post = scan.posts[0]
    const options = defaultExportOptions()

    try {
      const result = await exportBlogPostUnit({
        blog,
        source,
        outputDir: tempDir,
        post,
        categories: scan.categories,
        options,
        uploadEnabled: false,
        abortSignal: null,
      })

      expect(result.jobItem.status).toBe("success")
      expect(result.blockIds).toEqual(["mock:paragraph"])
      const markdown = await readFile(result.markdownFilePath, "utf8")

      expect(markdown).toContain("Hello from markdown blog")
      expect(markdown).toContain("postId: mock-post-1")
      expect(markdown).not.toContain(".nan")
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it("resolves blog post links with configured same-blog link options", async () => {
    const tempDir = await createTestTempDir("blog-post-export-links-")
    const blog: Blog = {
      ...createMarkdownMockBlog(),
      parseContent: ({ content, options }) => {
        if (content.kind !== "markdown") {
          throw new Error(`Unsupported mock content kind: ${content.kind}`)
        }

        const targetUrl = "https://mock.example.com/posts/target-post"

        return {
          tags: content.tags,
          blocks: [
            {
              blockId: "mock:paragraph",
              props: {
                text: options.resolveLinkUrl?.(targetUrl) ?? targetUrl,
              },
            },
          ],
        }
      },
      resolvePostLinkIdentity: (url) =>
        url === "https://mock.example.com/posts/target-post"
          ? {
              blogKey: "mock-markdown",
              sourceId: "mock-blog",
              postId: "target-post",
            }
          : undefined,
    }
    const source = blog.parseSource("mock-blog")
    const scan = await blog.scan(source)
    const post = scan.posts[0]
    const targetPost = {
      ...post,
      postId: "target-post",
      title: "Target post",
      sourceUrl: "https://mock.example.com/posts/target-post",
    }
    const options = defaultExportOptions()
    options.links.sameBlogPostMode = "custom-url"
    options.links.sameBlogPostCustomUrlTemplate =
      "https://archive.example.com/{{ sourceId }}/{{ postId }}"

    try {
      const result = await exportBlogPostUnit({
        blog,
        source,
        outputDir: tempDir,
        post,
        posts: [post, targetPost],
        categories: scan.categories,
        options,
        uploadEnabled: false,
        abortSignal: null,
      })
      const markdown = await readFile(result.markdownFilePath, "utf8")

      expect(markdown).toContain("https://archive.example.com/mock-blog/target-post")
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it("fails clearly when local asset export needs a blog binary fetcher", async () => {
    const tempDir = await createTestTempDir("blog-post-export-assets-")
    const blog: Blog = {
      ...createMarkdownMockBlog(),
      parseContent: ({ content }) => {
        if (content.kind !== "markdown") {
          throw new Error(`Unsupported mock content kind: ${content.kind}`)
        }

        return {
          tags: content.tags,
          blocks: [
            {
              blockId: "mock:image",
              props: {
                url: "https://mock.example.com/image.png",
                alt: "mock image",
              },
              assets: {
                url: {
                  role: "image",
                  sourceUrl: "https://mock.example.com/image.png",
                  required: true,
                },
              },
            },
          ],
        }
      },
      getBlockTemplateDefinitions: () => [
        {
          key: "mock:image",
          label: "Mock Image",
          props: {
            url: { label: "url", type: "string" },
            alt: { label: "alt", type: "string" },
          },
          presets: [{ id: "default", label: "Default", template: "{{ `![${alt}](${url})` }}" }],
        },
      ],
    }
    const source = blog.parseSource("mock-blog")
    const scan = await blog.scan(source)
    const post = scan.posts[0]

    try {
      await expect(
        exportBlogPostUnit({
          blog,
          source,
          outputDir: tempDir,
          post,
          categories: scan.categories,
          options: defaultExportOptions(),
          uploadEnabled: false,
          abortSignal: null,
        }),
      ).rejects.toThrow("로컬 자산 저장을 지원하는 fetchBinary downloader가 필요합니다.")
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it("uses blog fetchBinary for local asset export", async () => {
    const tempDir = await createTestTempDir("blog-post-export-fetch-binary-")
    const fetchBinary = vi.fn(async () => ({
      bytes: Buffer.from("mock image"),
      contentType: "image/png",
    }))
    const blog: Blog = {
      ...createMarkdownMockBlog(),
      fetchBinary,
      parseContent: ({ content }) => {
        if (content.kind !== "markdown") {
          throw new Error(`Unsupported mock content kind: ${content.kind}`)
        }

        return {
          tags: content.tags,
          blocks: [
            {
              blockId: "mock:image",
              props: {
                url: "https://mock.example.com/image.png",
                alt: "mock image",
              },
              assets: {
                url: {
                  role: "image",
                  sourceUrl: "https://mock.example.com/image.png",
                  required: true,
                },
              },
            },
          ],
        }
      },
      getBlockTemplateDefinitions: () => [
        {
          key: "mock:image",
          label: "Mock Image",
          props: {
            url: { label: "url", type: "string" },
            alt: { label: "alt", type: "string" },
          },
          presets: [{ id: "default", label: "Default", template: "{{ `![${alt}](${url})` }}" }],
        },
      ],
    }
    const source = blog.parseSource("mock-blog")
    const scan = await blog.scan(source)
    const post = scan.posts[0]

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

      expect(fetchBinary).toHaveBeenCalledWith({
        sourceUrl: "https://mock.example.com/image.png",
      })
      expect(result.assetPaths).toHaveLength(1)
      expect(result.assetPaths[0]).toMatch(/(?:^|\/)public\/.+\.png$/)
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })
})
