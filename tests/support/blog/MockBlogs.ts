import type { Blog } from "@exitpress/engine/blog/Blog.js"

export const createMarkdownMockBlog = (): Blog => ({
  key: "mock-markdown",
  label: "Mock Markdown",
  parseSource: (input) => ({
    blogKey: "mock-markdown",
    sourceId: input,
    displayName: input,
    input,
  }),
  scan: async (source) => ({
    source,
    totalPostCount: 1,
    categories: [
      {
        id: 1,
        name: "Mock Category",
        parentId: undefined,
        postCount: 1,
        path: ["Mock Category"],
        depth: 0,
      },
    ],
    posts: [
      {
        blogKey: source.blogKey,
        sourceId: source.sourceId,
        postId: "mock-post-1",
        title: "Mock markdown post",
        sourceUrl: "https://example.com/mock-post-1",
        publishedAt: "2026-06-10T00:00:00.000Z",
        categoryId: 1,
        categoryName: "Mock Category",
        thumbnailUrl: undefined,
      },
    ],
  }),
  loadPostContent: async () => ({
    kind: "markdown",
    markdown: "Hello from markdown blog",
    sourceUrl: "https://example.com/mock-post-1",
    tags: ["mock"],
  }),
  parseContent: ({ content }) => {
    if (content.kind !== "markdown") {
      throw new Error(`Unsupported mock content kind: ${content.kind}`)
    }

    return {
      tags: content.tags,
      blocks: [
        {
          blockId: "mock:paragraph",
          props: {
            text: content.markdown,
          },
        },
      ],
    }
  },
  getBlockTemplateDefinitions: () => [
    {
      key: "mock:paragraph",
      label: "Mock Paragraph",
      props: { text: { label: "text", type: "string" } },
      presets: [{ id: "default", label: "Default", template: "{{ text }}" }],
    },
  ],
})
