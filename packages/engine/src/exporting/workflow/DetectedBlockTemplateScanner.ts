import { filterPostsByScope } from "@exitpress/domain/export-scope/ExportScope.js"
import { parsePostHtml } from "@exitpress/engine/parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "@exitpress/engine/parsing/naver-blog/NaverBlog.js"
import { mapConcurrent } from "@exitpress/engine/shared/async/util/AsyncTasks.js"
import { load } from "cheerio"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { NaverBlogFetcher } from "@exitpress/engine/integrations/naver-blog/NaverBlogFetcher.js"
import type { ParserBlockInspection } from "@exitpress/engine/parsing/naver-blog/core/ParserBlockDiagnostics.js"

export const blockDetectionConcurrency = 3

const flattenInspections = (inspections: ParserBlockInspection[]): ParserBlockInspection[] =>
  inspections.flatMap((inspection) => [
    inspection,
    ...flattenInspections(inspection.children ?? []),
  ])

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
  const $ = load(html)
  const parsedPost = parsePostHtml({
    html,
    sourceUrl,
    options: {
      blockOutputs: options.blockOutputs,
    },
  })
  const inspectedBlockIds = editor
    ? flattenInspections(
        editor.inspect({
          $,
          sourceUrl,
          tags: [],
          options: {
            blockOutputs: options.blockOutputs,
          },
        }),
      ).flatMap((inspection) => inspection.matchedBlockId ?? [])
    : []
  const detectedBlockIds = new Set<string>([
    ...parsedPost.blocks.map((block) => block.blockId),
    ...inspectedBlockIds.map((blockId) => `${editor?.type}:${blockId}`),
  ])

  return blog
    .getBlockTemplateDefinitions()
    .filter(
      (definition) =>
        (!editor || definition.key.startsWith(`${editor.type}:`)) &&
        detectedBlockIds.has(definition.key),
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
