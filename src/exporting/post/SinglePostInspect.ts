import { load } from "cheerio"

import type { AstBlock } from "../../domain/ast/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
import type { ParserBlockInspection } from "../../parsing/naver-blog/core/BaseEditorTypes.js"

import { extractBlogId, getSourceUrl } from "../../domain/blog/NaverUrl.js"
import { cloneExportOptions } from "../../domain/export-options/ExportOptions.js"
import { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"
import { extractPostTags, parsePostHtml } from "../../parsing/naver-blog/core/PostParser.js"
import { NaverBlog } from "../../parsing/naver-blog/NaverBlog.js"
import { toErrorMessage } from "../../shared/error/ErrorUtils.js"

type SinglePostInspectFetcher = {
  fetchPostHtml: (logNo: string) => Promise<string>
}

export type SinglePostInspectDiagnostics = {
  blogId: string
  logNo: string
  sourceUrl: string
  editor: {
    type: string
    label: string
  } | null
  parse:
    | {
        status: "success"
        blockTypes: AstBlock["type"][]
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
  blogId,
  logNo,
  html,
  sourceUrl,
  options,
}: {
  blogId: string
  logNo: string
  html: string
  sourceUrl: string
  options: ExportOptions
}): SinglePostInspectDiagnostics => {
  const $ = load(html)
  const tags = extractPostTags($)
  const blog = new NaverBlog()
  const editor = blog.getEditorForHtml(html)
  const parserOptions = {
    blockOutputs: cloneExportOptions(options, {
      blockOutputDefinitions: blog.getBlockOutputDefinitions(),
    }).blockOutputs,
  }

  if (!editor) {
    return {
      blogId,
      logNo,
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
      blockTypes: parsedPost.blocks.map((block) => block.type),
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
    blogId,
    logNo,
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
  blogId,
  logNo,
  options,
  createFetcher,
}: {
  blogId: string
  logNo: string
  options: ExportOptions
  createFetcher?: (input: {
    blogId: string
  }) => SinglePostInspectFetcher | Promise<SinglePostInspectFetcher>
}) => {
  const resolvedBlogId = extractBlogId(blogId)
  const fetcher = createFetcher
    ? await createFetcher({
        blogId: resolvedBlogId,
      })
    : new NaverBlogFetcher({
        blogId: resolvedBlogId,
      })
  const html = await fetcher.fetchPostHtml(logNo)

  return inspectPostHtml({
    blogId: resolvedBlogId,
    logNo,
    html,
    sourceUrl: getSourceUrl({
      blogId: resolvedBlogId,
      logNo,
    }),
    options,
  })
}
