import { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import { extractSourceId, getSourceUrl } from "@exitpress/blog-naver/NaverUrl.js"
import {
  extractPostTags,
  parsePostHtml,
} from "@exitpress/blog-naver/parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "@exitpress/blog-naver/parsing/naver-blog/NaverBlog.js"
import { cloneExportOptions } from "@exitpress/domain/export-options/ExportOptions.js"
import { toErrorMessage } from "@exitpress/engine/shared/error/util/toErrorMessage.js"
import { load } from "cheerio"

import type { ParserBlockInspection } from "@exitpress/blog-naver/parsing/naver-blog/core/ParserBlockDiagnostics.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

type SinglePostInspectFetcher = {
  fetchPostHtml: (postId: string) => Promise<string>
}

export type SinglePostInspectDiagnostics = {
  blogKey: string
  sourceId: string
  postId: string
  sourceUrl: string
  editor: {
    type: string
    label: string
  } | null
  parse:
    | {
        status: "success"
        blockIds: string[]
      }
    | {
        status: "failed"
        error: string
      }
  nodes: ParserBlockInspection[]
  unsupportedNodes: ParserBlockInspection[]
}

const collectUnsupportedNodes = (nodes: ParserBlockInspection[]): ParserBlockInspection[] =>
  nodes.flatMap((node) =>
    node.unsupported ? [node] : collectUnsupportedNodes(node.children ?? []),
  )

export const inspectPostHtml = ({
  sourceId,
  postId,
  html,
  sourceUrl,
  options,
}: {
  sourceId: string
  postId: string
  html: string
  sourceUrl: string
  options: ExportOptions
}): SinglePostInspectDiagnostics => {
  const $ = load(html)
  const tags = extractPostTags($)
  const blog = new NaverBlog()
  const editor = blog.getEditorForHtml(html)
  const parserOptions = {
    blockOutputs: cloneExportOptions(options).blockOutputs,
  }

  if (!editor) {
    return {
      blogKey: "naver",
      sourceId,
      postId,
      sourceUrl,
      editor: null,
      parse: {
        status: "failed",
        error: "지원하는 블로그 에디터를 찾지 못했습니다.",
      },
      nodes: [],
      unsupportedNodes: [],
    }
  }

  let parseResult: SinglePostInspectDiagnostics["parse"]

  try {
    const parsedPost = parsePostHtml({
      html,
      sourceUrl,
      options: parserOptions,
    })

    parseResult = {
      status: "success",
      blockIds: [...new Set(parsedPost.blocks.map((block) => block.blockId))],
    }
  } catch (error) {
    parseResult = {
      status: "failed",
      error: toErrorMessage(error),
    }
  }

  const nodes = editor.inspect({
    $,
    sourceUrl,
    tags,
    options: parserOptions,
  })

  return {
    blogKey: "naver",
    sourceId,
    postId,
    sourceUrl,
    editor: {
      type: editor.type,
      label: editor.label,
    },
    parse: parseResult,
    nodes,
    unsupportedNodes: collectUnsupportedNodes(nodes),
  }
}

export const inspectSinglePost = async ({
  sourceId,
  postId,
  options,
  createFetcher,
}: {
  sourceId: string
  postId: string
  options: ExportOptions
  createFetcher?: (input: {
    sourceId: string
  }) => SinglePostInspectFetcher | Promise<SinglePostInspectFetcher>
}) => {
  const resolvedSourceId = extractSourceId(sourceId)
  const fetcher = createFetcher
    ? await createFetcher({
        sourceId: resolvedSourceId,
      })
    : new NaverBlogFetcher({
        sourceId: resolvedSourceId,
      })
  const html = await fetcher.fetchPostHtml(postId)

  return inspectPostHtml({
    sourceId: resolvedSourceId,
    postId,
    html,
    sourceUrl: getSourceUrl({
      sourceId: resolvedSourceId,
      postId,
    }),
    options,
  })
}
