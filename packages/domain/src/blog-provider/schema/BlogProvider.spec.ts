import { describe, expect, it } from "vitest"

import type {
  BlogContentDocument,
  BlogPostIdentity,
  BlogPostRef,
  BlogSource,
} from "./BlogProvider.js"

import { allBlogContentKinds } from "./BlogProvider.js"

describe("blog provider domain schema", () => {
  it("keeps content kinds stable", () => {
    expect(allBlogContentKinds).toEqual(["html", "markdown", "blocks"])
  })

  it("represents provider-neutral source and post identity", () => {
    const source = {
      providerKey: "tistory",
      sourceId: "fixture-blog",
      displayName: "Fixture Blog",
      input: "https://fixture.tistory.com",
    } satisfies BlogSource
    const post = {
      providerKey: source.providerKey,
      sourceId: source.sourceId,
      postId: "42",
      title: "Fixture Post",
      sourceUrl: "https://fixture.tistory.com/42",
      publishedAt: "2026-06-10T00:00:00.000Z",
      categoryId: 0,
      categoryName: "Uncategorized",
      thumbnailUrl: undefined,
    } satisfies BlogPostRef
    const identity = {
      providerKey: "tistory",
      sourceId: "fixture-blog",
      postId: "42",
    } satisfies BlogPostIdentity

    expect(post.sourceId).toBe(source.sourceId)
    expect(identity.postId).toBe(post.postId)
  })

  it("allows html, markdown, and pre-parsed block content", () => {
    const documents = [
      {
        kind: "html",
        html: "<h1>Hello</h1>",
        sourceUrl: "https://example.com/html",
        tags: [],
      },
      {
        kind: "markdown",
        markdown: "# Hello",
        sourceUrl: "https://example.com/md",
        tags: ["markdown"],
      },
      {
        kind: "blocks",
        blocks: [{ blockId: "mock:paragraph", props: { text: "Hello" } }],
        sourceUrl: "https://example.com/blocks",
        tags: [],
      },
    ] satisfies BlogContentDocument[]

    expect(documents.map((document) => document.kind)).toEqual(["html", "markdown", "blocks"])
  })
})
