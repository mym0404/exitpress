import { load } from "cheerio"
import TurndownService, { type Node as TurndownNode } from "turndown"
import { gfm } from "turndown-plugin-gfm"

type AttributeNode = TurndownNode & {
  getAttribute: (name: string) => string | null
}

const cleanLinkAttribute = (attribute: string | null) =>
  attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : ""

const escapeLinkDestination = (destination: string) => {
  const escaped = destination.replace(/([<>()])/g, "\\$1")

  return escaped.includes(" ") ? `<${escaped}>` : escaped
}

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

  return { html: $.root().html() ?? html, codeBlocks }
}

const restoreCodeBlockPlaceholders = ({
  markdown,
  codeBlocks,
}: {
  markdown: string
  codeBlocks: string[]
}) =>
  codeBlocks.reduce(
    (currentMarkdown, code, index) =>
      currentMarkdown.replace(
        new RegExp(`[ \\t]*${codeBlockPlaceholderPrefix}${index}[ \\t]*`, "g"),
        `\n\n\`\`\`\n${code}\n\`\`\`\n\n`,
      ),
    markdown,
  )

const escapeMarkdownHtmlLikeText = (markdown: string) =>
  markdown.replace(
    /(^|[^\\])<([A-Za-z][A-Za-z0-9-]*(?:[,\s:/][^<>\n]*)?\s*\/?)(?<!\\)>/g,
    "$1\\<$2\\>",
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

  service.use(gfm)
  service.remove(["script", "style", "noscript"])
  service.addRule("hardBreak", {
    filter: "br",
    replacement: () => "  \n",
  })
  service.addRule("emptyParagraph", {
    filter: (node: TurndownNode) => node.nodeName === "P" && !node.textContent?.trim(),
    replacement: () => "",
  })

  if (resolveLinkUrl) {
    service.addRule("resolvedInlineLink", {
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

        return `[${content}](${escapeLinkDestination(resolveLinkUrl(href))}${titlePart})`
      },
    })
  }

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

  return escapeMarkdownHtmlLikeText(markdown.trim()).replace(/\n{3,}/g, "\n\n")
}
