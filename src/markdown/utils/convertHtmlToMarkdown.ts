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

export const convertHtmlToMarkdown = ({
  html,
  resolveLinkUrl,
}: {
  html: string
  resolveLinkUrl?: (url: string) => string
}) => {
  const turndownService = createTurndownService(resolveLinkUrl)
  const markdown = turndownService.turndown(html)

  return markdown.trim().replace(/\n{3,}/g, "\n\n")
}
