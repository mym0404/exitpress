import { describe, expect, it } from "vitest"

import type { Blog } from "./Blog.js"

import { createBlogRegistry } from "./BlogRegistry.js"

const createBlog = (key: string): Blog => ({
  key,
  label: `${key} blog`,
  parseSource: (input) => ({
    blogKey: key,
    sourceId: input,
    displayName: input,
    input,
  }),
  scan: async (source) => ({
    source,
    totalPostCount: 0,
    categories: [],
    posts: [],
  }),
  loadPostContent: async () => ({
    kind: "markdown",
    markdown: "# empty",
    sourceUrl: "https://example.com",
    tags: [],
  }),
  parseContent: () => ({
    tags: [],
    blocks: [{ blockId: `${key}:paragraph`, props: { text: "empty" } }],
  }),
  getBlockTemplateDefinitions: () => [],
})

describe("createBlogRegistry", () => {
  it("finds registered blogs by key", () => {
    const registry = createBlogRegistry([createBlog("alpha"), createBlog("tistory")])

    expect(registry.get("alpha")?.label).toBe("alpha blog")
    expect(registry.require("tistory").key).toBe("tistory")
    expect(registry.list().map((blog) => blog.key)).toEqual(["alpha", "tistory"])
  })

  it("rejects duplicate blog keys", () => {
    expect(() => createBlogRegistry([createBlog("alpha"), createBlog("alpha")])).toThrow(
      "Duplicate blog key: alpha",
    )
  })

  it("throws for missing required blog", () => {
    const registry = createBlogRegistry([])

    expect(() => registry.require("missing")).toThrow("Unknown blog key: missing")
  })
})
