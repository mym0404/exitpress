import { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import { extractBlogId, extractNaverBlogPostIdentity } from "@exitpress/blog-naver/NaverUrl.js"
import { parsePostHtml } from "@exitpress/blog-naver/parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "@exitpress/blog-naver/parsing/naver-blog/NaverBlog.js"

import type { BlogProvider } from "@exitpress/engine/blog-provider/BlogProvider.js"

const providerKey = "naver"

export const createNaverBlogProvider = (): BlogProvider => {
  const createFetcher = (blogId: string) => new NaverBlogFetcher({ blogId })
  const createAssetFetcher = () => new NaverBlogFetcher({ blogId: "" })

  return {
    key: providerKey,
    label: "Naver Blog",
    parseSource: (input) => {
      const sourceId = extractBlogId(input)

      return {
        providerKey,
        sourceId,
        displayName: sourceId,
        input,
      }
    },
    scan: async (source) => {
      const scan = await createFetcher(source.sourceId).scanBlog({ includePosts: true })

      return {
        source,
        totalPostCount: scan.totalPostCount,
        categories: scan.categories.map((category) => ({
          id: category.id,
          name: category.name,
          parentId: category.parentId ?? undefined,
          postCount: category.postCount,
          path: category.path,
          depth: category.depth,
        })),
        posts: (scan.posts ?? []).map((post) => ({
          providerKey,
          sourceId: post.sourceId,
          postId: post.postId,
          title: post.title,
          sourceUrl: post.source,
          publishedAt: post.publishedAt,
          categoryId: post.categoryId,
          categoryName: post.categoryName,
          thumbnailUrl: post.thumbnailUrl ?? undefined,
        })),
      }
    },
    loadPostContent: async ({ source, post }) => {
      const html = await createFetcher(source.sourceId).fetchPostHtml(post.postId)

      return {
        kind: "html",
        html,
        sourceUrl: post.sourceUrl,
        tags: [],
      }
    },
    parseContent: ({ content, options }) => {
      if (content.kind !== "html") {
        throw new Error(`Unsupported Naver Blog content kind: ${content.kind}`)
      }

      return parsePostHtml({
        html: content.html,
        sourceUrl: content.sourceUrl,
        options,
      })
    },
    getBlockTemplateDefinitions: () => new NaverBlog().getBlockTemplateDefinitions(),
    downloadBinary: (input) => createAssetFetcher().downloadBinary(input),
    fetchBinary: (input) => createAssetFetcher().fetchBinary(input),
    resolvePostLinkIdentity: (url) => {
      const identity = extractNaverBlogPostIdentity(url)

      if (!identity) {
        return undefined
      }

      return {
        providerKey,
        sourceId: identity.sourceId,
        postId: identity.postId,
      }
    },
  }
}
