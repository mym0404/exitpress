import type { AnyNode, Element } from "domhandler"

import { convertHtmlToMarkdown } from "../../converter/HtmlFragmentConverter.js"
import { getMarkdownLinkStyleFromSelection } from "../../../shared/BlockMarkdown.js"
import type { OutputOption } from "../../../shared/Types.js"
import { compactMarkdownText } from "../../../shared/Utils.js"
import {LeafBlock, type ParserBlockContext} from "../BaseBlock.js"

type TextBlock = { type: "paragraph"; text: string }

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

const parseRecommendationTextBlocks = (texts: string[]) => {
  const recommendationStartIndex = texts.findIndex((text) =>
    recommendationHeaderPatterns.some((pattern) => pattern.test(text)),
  )

  if (recommendationStartIndex === -1 || texts.length - recommendationStartIndex < 6) {
    return null
  }

  const introBlocks = texts.slice(0, recommendationStartIndex).map((text) => ({
    type: "paragraph" as const,
    text,
  }))
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
    {
      type: "paragraph" as const,
      text: items.map((item) => `- ${item}`).join("\n"),
    },
  ]
}

export const parseTextBlocks = ({
  $node,
  options,
  outputSelection,
}: {
  $node: Parameters<LeafBlock["convert"]>[0]["$node"]
  options: ParserBlockContext["options"]
  outputSelection?: Parameters<LeafBlock["convert"]>[0]["outputSelection"]
}) => {
  const convertParagraph = (paragraph: Element) =>
    compactMarkdownText(
      convertHtmlToMarkdown({
        /* v8 ignore next */
        html: $node.find(paragraph).html() ?? "",
        options: {
          linkStyle: getMarkdownLinkStyleFromSelection(outputSelection),
        },
        resolveLinkUrl: options.resolveLinkUrl,
      }),
    )
  const toParagraphBlock = (text: string): TextBlock[] =>
    /* v8 ignore next */
    text ? [{ type: "paragraph", text }] : []
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
  const parseContainer = (container: Element) =>
    $node
      .find(container)
      .contents()
      .toArray()
      .flatMap((child) => {
        if (!isElementNode(child)) {
          return []
        }

        const $child = $node.find(child)
        const tagName = $child.prop("tagName")?.toLowerCase()

        if (tagName === "p" && $child.hasClass("se-text-paragraph")) {
          return parseParagraph(child)
        }

        if ((tagName === "ul" || tagName === "ol") && $child.hasClass("se-text-list")) {
          return parseList(child)
        }

        return []
      })

  const textModules = $node.find(".se-module-text").toArray()
  const blocks = (textModules.length > 0 ? textModules : [$node.get(0)])
    .filter(isElementNode)
    .flatMap(parseContainer)
  const parsedBlocks = blocks.length > 0
    ? blocks
    : $node.find("p.se-text-paragraph").toArray().flatMap(parseParagraph)
  const texts = parsedBlocks
    .map((block) => block.text)
    .filter(Boolean)

  const hasListBlock = parsedBlocks.some((block) => /^(- |\d+\. )/m.test(block.text))
  const recommendationBlocks = hasListBlock ? null : parseRecommendationTextBlocks(texts)

  if (recommendationBlocks) {
    return recommendationBlocks
  }

  return parsedBlocks
}

export class NaverSe4TextBlock extends LeafBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"
  override readonly outputOptions = [
    {
      id: "inline-links",
      label: "inline links",
      description: "문단 안 링크를 inline 형식으로 출력합니다.",
      preview: {
        type: "paragraph",
        text: "일반 링크: [example](https://example.com)",
      },
      isDefault: true,
    },
    {
      id: "reference-links",
      label: "reference links",
      description: "문단 안 링크를 reference 형식으로 분리합니다.",
      preview: {
        type: "paragraph",
        text: "일반 링크: [example][ref-1]\n\n[ref-1]: https://example.com",
      },
    },
  ] satisfies OutputOption<"paragraph">[]

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_text" || $node.hasClass("se-text")
  }

  override convert({ $node, options, outputSelection }: Parameters<LeafBlock["convert"]>[0]) {
    return parseTextBlocks({ $node, options, outputSelection })
  }
}
