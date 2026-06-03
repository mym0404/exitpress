import type { CheerioAPI } from "cheerio"

import type { AstBlock, ImageData } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

const parseBookWidgetBlocks = ({
  element,
  resolveLinkUrl,
}: {
  element: ReturnType<CheerioAPI>
  resolveLinkUrl?: (url: string) => string
}) => {
  /* v8 ignore next */
  const bookWidget = element.is('[s_type="db"][s_subtype="book"]') ? element : null

  /* v8 ignore next 3 */
  if (!bookWidget || bookWidget.length === 0) {
    return null
  }

  const blocks: AstBlock[] = []
  const imageNode = bookWidget.find("img").first()
  const imageSource = imageNode.attr("src")?.trim()

  if (imageSource) {
    blocks.push({
      type: "image",
      image: {
        sourceUrl: normalizeAssetUrl(imageSource),
        originalSourceUrl: null,
        alt: imageNode.attr("alt")?.trim() ?? "",
        caption: null,
        mediaKind: "image",
      } satisfies ImageData,
    })
  }

  const title =
    compactText(bookWidget.find("strong.tit").first().text()) ||
    compactText(bookWidget.find("p a.con_link").first().text())
  const detailLines = bookWidget
    .find("dl")
    .first()
    .children()
    .toArray()
    .map((node) => {
      const child = bookWidget.find(node)
      const tagName = node.tagName?.toLowerCase()
      const text = compactText(child.text())

      if (!text || (tagName !== "dt" && tagName !== "dd")) {
        return null
      }

      return text
    })
    .filter((text): text is string => Boolean(text))
  const summaryLines = [title ? `**${title}**` : "", ...detailLines].filter(Boolean)

  if (summaryLines.length > 0) {
    blocks.push({
      type: "paragraph",
      text: summaryLines.join("  \n"),
    })
  }

  const reviewLink = bookWidget.find("a.link, a.con_link").last()
  const reviewUrl = reviewLink.attr("href")?.trim() ?? ""
  const reviewLabel = compactText(reviewLink.text()) || "리뷰보기"

  if (reviewUrl) {
    blocks.push({
      type: "paragraph",
      /* v8 ignore next */
      text: `[${reviewLabel}](${resolveLinkUrl ? resolveLinkUrl(reviewUrl) : reviewUrl})`,
    })
  }

  return blocks.length > 0 ? blocks : null
}

export class NaverSe2BookWidgetBlock extends LeafBlock {
  override readonly id = "bookWidget"
  override readonly label = "책 위젯"

  override match({ node, $node }: ParserBlockContext) {
    return node.type === "tag" && $node.is('[s_type="db"][s_subtype="book"]')
  }

  override convert({ $node, options }: Parameters<LeafBlock["convert"]>[0]) {
    const blocks = parseBookWidgetBlocks({
      element: $node,
      resolveLinkUrl: options.resolveLinkUrl,
    })

    if (!blocks) {
      throw new Error("SE2 book widget block parsing failed.")
    }

    return blocks
  }
}
