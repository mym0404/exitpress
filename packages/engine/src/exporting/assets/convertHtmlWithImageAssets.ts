import { load } from "cheerio"

import type { ParsedBlockAsset } from "@exitpress/domain/parser/schema/Media.js"

import { convertHtmlToMarkdown } from "../../markdown/util/convertHtmlToMarkdown.js"

export const convertHtmlWithImageAssets = ({
  html,
  propPath = "text",
  format = "markdown",
  resolveLinkUrl,
}: {
  html: string
  propPath?: string
  format?: "markdown" | "html"
  resolveLinkUrl?: (url: string) => string
}) => {
  const $ = load(html, undefined, false)
  const assets: Record<string, ParsedBlockAsset> = {}
  let prefix = "EXITPRESSINLINEIMAGE"

  while (html.includes(prefix)) {
    prefix += "X"
  }

  $("img[src]").each((index, node) => {
    const image = $(node)
    const sourceUrl = image.attr("src")?.trim()

    if (!sourceUrl || image.closest("pre, code").length > 0) {
      return
    }

    const placeholder = `${prefix}${index}END`
    image.attr("src", placeholder)
    const imageHtml = $.html(image)
    const template = format === "html" ? imageHtml : convertHtmlToMarkdown({ html: imageHtml })

    assets[`${propPath}:image:${index}`] = {
      role: "image",
      sourceUrl,
      required: false,
      textReplacement: { propPath, placeholder, template, format },
    }
    image.replaceWith(placeholder)
  })

  const preparedHtml = $.root().html() ?? ""

  return {
    text:
      format === "html"
        ? preparedHtml
        : convertHtmlToMarkdown({ html: preparedHtml, resolveLinkUrl }),
    assets,
  }
}
