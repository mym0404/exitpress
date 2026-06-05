import type { ScanResult } from "../../domain/blog/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
import type { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"

import { parsePostHtml } from "../../parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "../../parsing/naver-blog/NaverBlog.js"
import { mapConcurrent } from "../../shared/async/AsyncUtils.js"

import { filterPostsByScope } from "./ExportScope.js"

export const blockDetectionConcurrency = 3

const getTemplateBlockId = (key: string) => key.split(":").at(-1) ?? key

export const detectPostBlockTemplateKeys = ({
  html,
  sourceUrl,
  options,
}: {
  html: string
  sourceUrl: string
  options: ExportOptions
}) => {
  const blog = new NaverBlog()
  const editor = blog.getEditorForHtml(html)
  const parsedPost = parsePostHtml({
    html,
    sourceUrl,
    options: {
      blockOutputs: options.blockOutputs,
    },
  })

  const detectedBlockTypes = new Set<string>(parsedPost.blocks.map((block) => block.type))

  return blog
    .getBlockTemplateDefinitions()
    .filter(
      (definition) =>
        (!editor || definition.key.startsWith(`${editor.type}:`)) &&
        detectedBlockTypes.has(getTemplateBlockId(definition.key)),
    )
    .map((definition) => definition.key)
}

export const detectBlockTemplateKeys = async ({
  scanResult,
  options,
  fetcher,
}: {
  scanResult: ScanResult & { posts: NonNullable<ScanResult["posts"]> }
  options: ExportOptions
  fetcher: Pick<NaverBlogFetcher, "fetchPostHtml">
}) => {
  const posts = filterPostsByScope({
    posts: scanResult.posts,
    categories: scanResult.categories,
    options,
  })
  const postKeys = await mapConcurrent({
    items: posts,
    concurrency: blockDetectionConcurrency,
    mapper: async (post) => {
      const html = await fetcher.fetchPostHtml(post.logNo)
      return detectPostBlockTemplateKeys({
        html,
        sourceUrl: post.source,
        options,
      })
    },
  })

  return Array.from(new Set(postKeys.flat()))
}
