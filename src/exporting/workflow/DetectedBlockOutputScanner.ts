import type { ScanResult } from "../../domain/blog/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
import type { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"

import { parsePostHtml } from "../../parsing/naver-blog/core/PostParser.js"
import { mapConcurrent } from "../../shared/async/AsyncUtils.js"

import { filterPostsByScope } from "./ExportScope.js"

export const blockDetectionConcurrency = 3

export const detectPostBlockOutputKeys = ({
  html,
  sourceUrl,
  options,
}: {
  html: string
  sourceUrl: string
  options: ExportOptions
}) => {
  const parsedPost = parsePostHtml({
    html,
    sourceUrl,
    options: {
      blockOutputs: options.blockOutputs,
    },
  })

  return parsedPost.blocks
    .map((block) => block.outputSelectionKey)
    .filter((key): key is string => Boolean(key))
}

export const detectBlockOutputKeys = async ({
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
      return detectPostBlockOutputKeys({
        html,
        sourceUrl: post.source,
        options,
      })
    },
  })

  return Array.from(new Set(postKeys.flat()))
}
