import { load } from "cheerio"

import type { ParsedBlock } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { BlogProvider } from "@exitpress/engine/blog-provider/BlogProvider.js"

const providerKey = "tistory"
const uncategorizedCategoryId = 0

type CreateTistoryBlogProviderOptions = {
  fetchText?: (url: string) => Promise<string>
}

const defaultFetchText = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Tistory fetch failed: ${response.status}`)
  }

  return response.text()
}

const getPostId = (input: string) => {
  const url = new URL(input)
  const lastSegment = url.pathname.split("/").filter(Boolean).at(-1)

  return lastSegment ?? url.href
}

const getTitle = (html: string) => {
  const $ = load(html)

  return (
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    "Untitled Tistory Post"
  )
}

const getPublishedAt = (html: string) => {
  const $ = load(html)

  return (
    $('meta[property="article:published_time"]').attr("content")?.trim() ||
    new Date(0).toISOString()
  )
}

const parseHtmlBlocks = (html: string) => {
  const $ = load(html)
  const root = $("article").first().length > 0 ? $("article").first() : $("body")
  const blocks: ParsedBlock[] = []

  root.find("h1, h2, h3, p").each((_, element) => {
    const node = $(element)
    const text = node.text().trim()

    if (!text) {
      return
    }

    const tagName = element.tagName.toLowerCase()

    if (tagName === "p") {
      blocks.push({
        blockId: "tistory:paragraph",
        props: {
          text,
        },
      })
      return
    }

    blocks.push({
      blockId: "tistory:heading",
      props: {
        level: Number(tagName.slice(1)),
        marker: "#".repeat(Number(tagName.slice(1))),
        text,
      },
    })
  })

  return blocks
}

const blockTemplateDefinitions: BlockTemplateDefinition[] = [
  {
    key: "tistory:heading",
    label: "Tistory Heading",
    props: {
      level: {
        label: "level",
        type: "number",
      },
      text: {
        label: "text",
        type: "string",
      },
      marker: {
        label: "marker",
        type: "string",
      },
    },
    presets: [
      {
        id: "default",
        label: "Default",
        template: "{{ marker }} {{ text }}",
      },
    ],
  },
  {
    key: "tistory:paragraph",
    label: "Tistory Paragraph",
    props: {
      text: {
        label: "text",
        type: "string",
      },
    },
    presets: [
      {
        id: "default",
        label: "Default",
        template: "{{ text }}",
      },
    ],
  },
]

export const createTistoryBlogProvider = ({
  fetchText = defaultFetchText,
}: CreateTistoryBlogProviderOptions = {}): BlogProvider => ({
  key: providerKey,
  label: "Tistory",
  parseSource: (input) => {
    const url = new URL(input)

    return {
      providerKey,
      sourceId: url.host,
      displayName: url.host,
      input,
    }
  },
  scan: async (source) => {
    const html = await fetchText(source.input)
    const postId = getPostId(source.input)
    const title = getTitle(html)
    const categoryName = "Uncategorized"

    return {
      source,
      totalPostCount: 1,
      categories: [
        {
          id: uncategorizedCategoryId,
          name: categoryName,
          parentId: undefined,
          postCount: 1,
          path: [categoryName],
          depth: 0,
        },
      ],
      posts: [
        {
          providerKey,
          sourceId: source.sourceId,
          postId,
          title,
          sourceUrl: source.input,
          publishedAt: getPublishedAt(html),
          categoryId: uncategorizedCategoryId,
          categoryName,
          thumbnailUrl: undefined,
        },
      ],
    }
  },
  loadPostContent: async ({ source, post }) => ({
    kind: "html",
    html: await fetchText(post.sourceUrl || source.input),
    sourceUrl: post.sourceUrl || source.input,
    tags: [],
  }),
  parseContent: ({ content }) => {
    if (content.kind !== "html") {
      throw new Error(`Unsupported Tistory content kind: ${content.kind}`)
    }

    return {
      tags: content.tags,
      blocks: parseHtmlBlocks(content.html),
    }
  },
  getBlockTemplateDefinitions: () => blockTemplateDefinitions,
})
