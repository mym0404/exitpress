import type { AnyNode, Element } from "domhandler"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { convertHtmlToMarkdown } from "../../../../markdown/utils/convertHtmlToMarkdown.js"
import { compactMarkdownText } from "../../../../shared/text/TextUtils.js"
import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

const isElementNode = (node: AnyNode | undefined): node is Element =>
  node?.type === "tag" || node?.type === "script" || node?.type === "style"

const recommendationHeaderPatterns = [/^추천트렌드/, /^이런 상품 어때요/]
const recommendationNoisePatterns = [
  ...recommendationHeaderPatterns,
  /^요즘 많이 찾는/,
  /^추천검색어/,
]

const isHashtagParagraph = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => token.startsWith("#"))

const parseRecommendationTextBlocks = ({
  blockId,
  texts,
}: {
  blockId: string
  texts: string[]
}) => {
  const recommendationStartIndex = texts.findIndex((text) =>
    recommendationHeaderPatterns.some((pattern) => pattern.test(text)),
  )

  if (recommendationStartIndex === -1 || texts.length - recommendationStartIndex < 6) {
    return null
  }

  const introBlocks = texts
    .slice(0, recommendationStartIndex)
    .map((text) => createParagraphBlock({ blockId, text }))
  const items: string[] = []
  let currentItem: string | null = null

  texts.slice(recommendationStartIndex).forEach((text) => {
    if (recommendationNoisePatterns.some((pattern) => pattern.test(text))) {
      return
    }

    if (isHashtagParagraph(text)) {
      if (currentItem) {
        currentItem = `${currentItem} ${text}`.trim()
      }
      return
    }

    if (currentItem) {
      items.push(currentItem)
    }

    currentItem = text
  })

  if (currentItem) {
    items.push(currentItem)
  }

  if (items.length < 3) {
    return null
  }

  return [
    ...introBlocks,
    createParagraphBlock({ blockId, text: items.map((item) => `- ${item}`).join("\n") }),
  ]
}

export const parseTextBlocks = ({
  $,
  $node,
  blockId,
  options,
}: {
  $: Parameters<LeafParserBlock["convert"]>[0]["$"]
  $node: Parameters<LeafParserBlock["convert"]>[0]["$node"]
  blockId: string
  options: ParserBlockContext["options"]
}) => {
  const convertParagraph = (paragraph: Element) =>
    compactMarkdownText(
      convertHtmlToMarkdown({
        /* v8 ignore next */
        html: $node.find(paragraph).html() ?? "",
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )
  const toParagraphBlock = (text: string) =>
    /* v8 ignore next */
    text ? [createParagraphBlock({ blockId, text })] : []
  const parseParagraph = (paragraph: Element) => toParagraphBlock(convertParagraph(paragraph))
  const parseList = (list: Element) => {
    const $list = $node.find(list)
    const ordered = $list.prop("tagName")?.toLowerCase() === "ol"
    const lines = $list
      .children("li")
      .toArray()
      .map((item, index) => {
        const text = $node
          .find(item)
          .find("p.se-text-paragraph")
          .toArray()
          .map(convertParagraph)
          .filter(Boolean)
          .join("  \n")

        /* v8 ignore next */
        return text ? (ordered ? `${index + 1}. ${text}` : `- ${text}`) : ""
      })
      .filter(Boolean)

    return toParagraphBlock(lines.join("\n"))
  }
  const parseLooseNode = (node: AnyNode) => {
    if (!isElementNode(node)) {
      return node.type === "text" ? toParagraphBlock(compactMarkdownText(node.data)) : []
    }

    if (node.type === "script" || node.type === "style") {
      return []
    }

    return toParagraphBlock(
      compactMarkdownText(
        convertHtmlToMarkdown({
          html: $.html(node) ?? $node.find(node).text(),
          resolveLinkUrl: options.resolveLinkUrl,
        }),
      ),
    )
  }
  const parseContainer = (container: Element) =>
    $node
      .find(container)
      .contents()
      .toArray()
      .flatMap((child) => {
        if (!isElementNode(child)) {
          return parseLooseNode(child)
        }

        const $child = $node.find(child)
        const tagName = $child.prop("tagName")?.toLowerCase()

        if (tagName === "p" && $child.hasClass("se-text-paragraph")) {
          return parseParagraph(child)
        }

        if ((tagName === "ul" || tagName === "ol") && $child.hasClass("se-text-list")) {
          return parseList(child)
        }

        return parseLooseNode(child)
      })

  const textModules = $node.find(".se-module-text").toArray()
  const blocks = (textModules.length > 0 ? textModules : [$node.get(0)])
    .filter(isElementNode)
    .flatMap(parseContainer)
  const parsedBlocks =
    blocks.length > 0 ? blocks : $node.find("p.se-text-paragraph").toArray().flatMap(parseParagraph)
  const texts = parsedBlocks
    .map((block) => block.props.text)
    .filter((text): text is string => typeof text === "string")

  const hasListBlock = texts.some((text) => /^(- |\d+\. )/m.test(text))
  const recommendationBlocks = hasListBlock
    ? null
    : parseRecommendationTextBlocks({ blockId, texts })

  if (recommendationBlocks) {
    return recommendationBlocks
  }

  return parsedBlocks
}

export class NaverSe4TextBlock extends LeafParserBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_text" || $node.hasClass("se-text")
  }

  override convert({ $, $node, blockId, options }: Parameters<LeafParserBlock["convert"]>[0]) {
    return parseTextBlocks({ $, $node, blockId, options })
  }
}
