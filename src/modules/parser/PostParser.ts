import { load } from "cheerio"

import type { ExportOptions } from "../exporter/Types.js"
import { unique } from "../common/CollectionUtils.js"
import { NaverBlog } from "../blog/NaverBlog.js"
import type { ParserBlockSourceEvidence } from "../editor/BaseEditor.js"

export const extractPostTags = ($: ReturnType<typeof load>) =>
  unique(
    $(".post_tag a, .tag_area a, a[href*='PostTag']")
      .toArray()
      .map((node) => $(node).text().trim())
      .filter(Boolean),
  )

export const parsePostHtml = ({
  html,
  sourceUrl,
  options,
}: {
  html: string
  sourceUrl: string
  options: Pick<ExportOptions, "blockOutputs"> & {
    resolveLinkUrl?: (url: string) => string
  }
}) => {
  const $ = load(html)
  const tags = extractPostTags($)

  return new NaverBlog().parsePost({
    $,
    html,
    sourceUrl,
    tags,
    options,
  })
}

type ParsedPostWithBlockEvidence = ReturnType<typeof parsePostHtml> & {
  blockEvidence: ParserBlockSourceEvidence[]
}

export const parsePostHtmlWithBlockEvidence = ({
  html,
  sourceUrl,
  options,
}: {
  html: string
  sourceUrl: string
  options: Pick<ExportOptions, "blockOutputs"> & {
    resolveLinkUrl?: (url: string) => string
  }
}): ParsedPostWithBlockEvidence => {
  const $ = load(html)
  const tags = extractPostTags($)
  const blockEvidence: ParserBlockSourceEvidence[] = []
  const parsedPost = new NaverBlog().parsePost({
    $,
    html,
    sourceUrl,
    tags,
    options,
    captureBlockEvidence: (evidence) => {
      blockEvidence.push(evidence)
    },
  })

  return {
    ...parsedPost,
    blockEvidence,
  }
}
