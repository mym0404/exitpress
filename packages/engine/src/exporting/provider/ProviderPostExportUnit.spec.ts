import { readFile, rm } from "node:fs/promises"

import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { createMarkdownMockProvider } from "@tests/support/provider/MockBlogProviders.js"
import { createTestTempDir } from "@tests/support/test-paths.js"
import { describe, expect, it, vi } from "vitest"

import type { BlogProvider } from "@exitpress/engine/blog-provider/BlogProvider.js"

import { exportProviderPostUnit } from "./ProviderPostExportUnit.js"

describe("exportProviderPostUnit", () => {
  it("exports one provider post through the markdown renderer", async () => {
    const tempDir = await createTestTempDir("provider-post-export-")
    const provider = createMarkdownMockProvider()
    const source = provider.parseSource("mock-blog")
    const scan = await provider.scan(source)
    const post = scan.posts[0]
    const options = defaultExportOptions()

    try {
      const result = await exportProviderPostUnit({
        provider,
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

      expect(markdown).toContain("Hello from markdown provider")
      expect(markdown).toContain("logNo: mock-post-1")
      expect(markdown).not.toContain(".nan")
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it("resolves provider post links with configured same-blog link options", async () => {
    const tempDir = await createTestTempDir("provider-post-export-links-")
    const provider: BlogProvider = {
      ...createMarkdownMockProvider(),
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
              providerKey: "mock-markdown",
              sourceId: "mock-blog",
              postId: "target-post",
            }
          : undefined,
    }
    const source = provider.parseSource("mock-blog")
    const scan = await provider.scan(source)
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
      "https://archive.example.com/{{ blogId }}/{{ logNo }}"

    try {
      const result = await exportProviderPostUnit({
        provider,
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

  it("fails clearly when local asset export needs a provider binary fetcher", async () => {
    const tempDir = await createTestTempDir("provider-post-export-assets-")
    const provider: BlogProvider = {
      ...createMarkdownMockProvider(),
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
    const source = provider.parseSource("mock-blog")
    const scan = await provider.scan(source)
    const post = scan.posts[0]

    try {
      await expect(
        exportProviderPostUnit({
          provider,
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

  it("uses provider fetchBinary for local asset export", async () => {
    const tempDir = await createTestTempDir("provider-post-export-fetch-binary-")
    const fetchBinary = vi.fn(async () => ({
      bytes: Buffer.from("mock image"),
      contentType: "image/png",
    }))
    const provider: BlogProvider = {
      ...createMarkdownMockProvider(),
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
    const source = provider.parseSource("mock-blog")
    const scan = await provider.scan(source)
    const post = scan.posts[0]

    try {
      const result = await exportProviderPostUnit({
        provider,
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
