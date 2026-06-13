import { defaultExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { createTestPath } from "@tests/support/test-paths.js"
import { describe, expect, it } from "vitest"

import type { CategoryInfo, PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"

import { buildPostLinkTargets, createPostLinkResolver } from "./PostLinkRewriter.js"

const testExportDir = createTestPath("post-link-rewriter", "export")

const categories: CategoryInfo[] = [
  {
    id: 10,
    name: "Notes",
    parentId: null,
    postCount: 2,
    isDivider: false,
    isOpen: true,
    path: ["Notes"],
    depth: 0,
  },
]

const posts: PostSummary[] = [
  {
    blogKey: "mock",
    sourceId: "source-a",
    postId: "post-1",
    title: "First post",
    publishedAt: "2026-04-11T04:00:00.000Z",
    categoryId: 10,
    categoryName: "Notes",
    source: "https://example.com/source-a/post-1",
    thumbnailUrl: null,
  },
  {
    blogKey: "mock",
    sourceId: "source-a",
    postId: "post-2",
    title: "Second post",
    publishedAt: "2026-04-12T04:00:00.000Z",
    categoryId: 10,
    categoryName: "Notes",
    source: "https://example.com/source-a/post-2",
    thumbnailUrl: null,
  },
]

const resolveIdentity = (url: string) => {
  const match = url.match(/^post:\/\/([^/]+)\/([^/]+)\/([^/]+)$/)

  return match
    ? {
        blogKey: match[1] ?? "",
        sourceId: match[2] ?? "",
        postId: match[3] ?? "",
      }
    : null
}

describe("post-link-rewriter", () => {
  it("rewrites matched same-source links to relative file paths", () => {
    const options = defaultExportOptions()
    const targets = buildPostLinkTargets({
      outputDir: testExportDir,
      posts,
      categories,
      options,
    })
    const resolveLinkUrl = createPostLinkResolver({
      sourceId: "source-a",
      blogKey: "mock",
      markdownFilePath: `${testExportDir}/notes/2026-04-11-first-post/index.md`,
      options: {
        links: {
          sameBlogPostMode: "relative-filepath",
          sameBlogPostCustomUrlTemplate: "",
        },
      },
      targets,
      resolveIdentity,
    })

    expect(resolveLinkUrl("post://mock/source-a/post-2")).toBe("../2026-04-12-second_post/index.md")
    expect(resolveLinkUrl("post://other/source-a/post-2")).toBe("post://other/source-a/post-2")
    expect(resolveLinkUrl("post://mock/source-b/post-1")).toBe("post://mock/source-b/post-1")
  })

  it("rewrites matched same-source links to custom slug URLs and keeps unmatched links as-is", () => {
    const options = defaultExportOptions()
    const targets = buildPostLinkTargets({
      outputDir: testExportDir,
      posts,
      categories,
      options,
    })
    const resolveLinkUrl = createPostLinkResolver({
      sourceId: "source-a",
      blogKey: "mock",
      markdownFilePath: `${testExportDir}/notes/2026-04-11-first-post/index.md`,
      options: {
        links: {
          sameBlogPostMode: "custom-url",
          sameBlogPostCustomUrlTemplate:
            "https://archive.example.com/{{ blogKey }}/{{ category }}/{{ sourceId }}/{{ postId }}/{{ slug }}",
        },
      },
      targets,
      resolveIdentity,
    })

    expect(resolveLinkUrl("post://mock/source-a/post-2")).toBe(
      "https://archive.example.com/mock/notes/source-a/post-2/second_post",
    )
    expect(resolveLinkUrl("post://mock/source-a/missing")).toBe("post://mock/source-a/missing")
  })

  it("uses custom post folder name templates for relative export paths", () => {
    const options = defaultExportOptions()

    options.structure.postFolderNameTemplate = "{{ year }}_{{ month }}_{{ postId }}_{{ slug }}"

    const targets = buildPostLinkTargets({
      outputDir: testExportDir,
      posts,
      categories,
      options,
    })
    const resolveLinkUrl = createPostLinkResolver({
      sourceId: "source-a",
      blogKey: "mock",
      markdownFilePath: `${testExportDir}/notes/2026_04_post-1_first-post/index.md`,
      options: {
        links: {
          sameBlogPostMode: "relative-filepath",
          sameBlogPostCustomUrlTemplate: "",
        },
      },
      targets,
      resolveIdentity,
    })

    expect(resolveLinkUrl("post://mock/source-a/post-2")).toBe(
      "../2026_04_post-2_second_post/index.md",
    )
  })
})
