import { load } from "cheerio"
import TurndownService, { type Node as TurndownNode } from "turndown"
import { gfm } from "turndown-plugin-gfm"

import { escapeLinkDestination } from "./escapeLinkDestination.js"
import { escapeMarkdownText } from "./escapeMarkdownText.js"

type AttributeNode = TurndownNode & {
  getAttribute: (name: string) => string | null
}

const cleanLinkAttribute = (attribute: string | null) =>
  attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : ""

const escapeLinkTitle = (title: string) => title.replace(/"/g, '\\"')

const isAttributeNode = (node: TurndownNode): node is AttributeNode =>
  "getAttribute" in node && typeof node.getAttribute === "function"

const codeBlockPlaceholderPrefix = "EXITPRESSCOLORSCRIPTERCODEBLOCK"

const hasPreWhitespace = (value: string | null) => /\bwhite-space\s*:\s*pre\b/i.test(value ?? "")

const replaceColorScripterTables = (html: string) => {
  const $ = load(html, undefined, false)
  const codeBlocks: string[] = []

  $("table.colorscripter-code-table").each((_, table) => {
    const code = $(table)
      .find("div, pre")
      .toArray()
      .filter(
        (lineNode) =>
          lineNode.tagName === "pre" ||
          hasPreWhitespace($(lineNode).attr("style") ?? "") ||
          hasPreWhitespace($(lineNode).attr("_foo") ?? ""),
      )
      .map((lineNode) => $(lineNode).text().replaceAll("\u00a0", " ").replaceAll("\u200b", ""))
      .map((line) => (line.trim() === "" ? "" : line))
      .join("\n")
      .trimEnd()

    if (code) {
      const placeholder = `${codeBlockPlaceholderPrefix}${codeBlocks.length}`

      codeBlocks.push(code)
      $(table).replaceWith(placeholder)
    }
  })

  $.root()
    .find("*")
    .addBack()
    .contents()
    .each((_, node) => {
      if (node.type === "text" && $(node).parents("pre, code").length === 0) {
        node.data = node.data.replaceAll("\u200b", "").replaceAll("\u00a0", " ")
      }
    })

  $("span, font").each((_, node) => {
    if ($(node).parents("pre, code, table").length === 0) {
      $(node).replaceWith($(node).contents())
    }
  })

  $("strong, b").each((_, node) => {
    if ($(node).parents("strong, b").length > 0) {
      $(node).replaceWith($(node).contents())
    }
  })

  $("strong, b").each((_, node) => {
    const previous = node.previousSibling
    if (previous?.type === "tag" && ["strong", "b"].includes(previous.name)) {
      $(previous).append($(node).contents())
      $(node).remove()
    }
  })

  return { html: $.root().html() ?? html, codeBlocks }
}

const restoreCodeBlockPlaceholders = ({
  markdown,
  codeBlocks,
}: {
  markdown: string
  codeBlocks: string[]
}) =>
  markdown.replace(
    new RegExp(`${codeBlockPlaceholderPrefix}(\\d+)`, "g"),
    (placeholder, index: string) => {
      const code = codeBlocks[Number(index)]

      if (code === undefined) {
        return placeholder
      }

      const fence = "`".repeat(
        Math.max(3, ...Array.from(code.matchAll(/`+/g), ([run]) => run.length + 1)),
      )
      return `\n\n${fence}\n${code}\n${fence}\n\n`
    },
  )

const createTurndownService = (resolveLinkUrl?: (url: string) => string) => {
  const service = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    headingStyle: "atx",
    hr: "---",
    linkStyle: "inlined",
  })

  service.escape = escapeMarkdownText
  service.use(gfm)
  service.remove(["script", "style", "noscript"])
  service.addRule("strongParagraphs", {
    filter: ["strong", "b"],
    replacement: (content, node) => {
      if (node.querySelector("pre, table")) {
        return content
      }

      return content
        .trim()
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((paragraph) => `**${paragraph}**`)
        .join("\n\n")
    },
  })
  service.addRule("hardBreak", {
    filter: "br",
    replacement: () => "  \n",
  })
  service.addRule("emptyParagraph", {
    filter: (node: TurndownNode) => node.nodeName === "P" && !node.textContent?.trim(),
    replacement: () => "",
  })

  service.addRule("image", {
    filter: "img",
    replacement: (_, node: TurndownNode) => {
      if (!isAttributeNode(node)) return ""
      const src = cleanLinkAttribute(node.getAttribute("src")).trim()
      if (!src) return ""
      const alt = escapeMarkdownText(cleanLinkAttribute(node.getAttribute("alt")))
      const title = escapeLinkTitle(cleanLinkAttribute(node.getAttribute("title")))
      return `![${alt}](${escapeLinkDestination(src)}${title ? ` "${title}"` : ""})`
    },
  })

  service.addRule("inlineLink", {
    filter: (node: TurndownNode) =>
      node.nodeName === "A" && isAttributeNode(node) && !!node.getAttribute("href"),
    replacement: (content, node: TurndownNode) => {
      if (!isAttributeNode(node)) {
        return content
      }

      const href = cleanLinkAttribute(node.getAttribute("href")).trim()

      if (!href) {
        return content
      }

      const title = escapeLinkTitle(cleanLinkAttribute(node.getAttribute("title")))
      const titlePart = title ? ` "${title}"` : ""

      return `[${content.replace(/\s*\n\s*/g, " ").trim()}](${escapeLinkDestination(resolveLinkUrl ? resolveLinkUrl(href) : href)}${titlePart})`
    },
  })

  return service
}

// Converts trusted HTML fragments into markdown text.
export const convertHtmlToMarkdown = ({
  html,
  resolveLinkUrl,
}: {
  html: string
  resolveLinkUrl?: (url: string) => string
}) => {
  const turndownService = createTurndownService(resolveLinkUrl)
  const preprocessed = replaceColorScripterTables(html)
  const markdown = restoreCodeBlockPlaceholders({
    markdown: turndownService.turndown(preprocessed.html),
    codeBlocks: preprocessed.codeBlocks,
  })

  return markdown.trim()
}
