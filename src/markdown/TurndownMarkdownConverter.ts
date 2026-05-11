import { JSDOM } from "jsdom"
import TurndownService, { type Node as TurndownNode } from "turndown"
import { gfm } from "turndown-plugin-gfm"

const createDocument = (html: string) => new JSDOM(`<body>${html}</body>`).window.document

const createTurndownService = () => {
  const service = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    headingStyle: "atx",
    hr: "---",
    linkStyle: "inlined",
  })

  service.use(gfm)
  service.addRule("hardBreak", {
    filter: "br",
    replacement: () => "  \n",
  })
  service.addRule("emptyParagraph", {
    filter: (node: TurndownNode) => node.nodeName === "P" && !node.textContent?.trim(),
    replacement: () => "",
  })

  return service
}

const sanitizeHtmlFragment = (html: string) => {
  const document = createDocument(html)

  document.querySelectorAll("script, style, noscript").forEach((node) => {
    node.remove()
  })

  document.querySelectorAll("*").forEach((element) => {
    element.getAttributeNames().forEach((attributeName) => {
      if (attributeName.startsWith("on")) {
        element.removeAttribute(attributeName)
      }
    })
  })

  return document.body.innerHTML.trim()
}

export const convertHtmlToMarkdown = ({
  html,
  resolveLinkUrl,
}: {
  html: string
  resolveLinkUrl?: (url: string) => string
}) => {
  const sanitized = sanitizeHtmlFragment(html)
  const document = createDocument(sanitized)

  if (resolveLinkUrl) {
    document.querySelectorAll("a[href]").forEach((anchor) => {
      const href = anchor.getAttribute("href")

      if (!href?.trim()) {
        return
      }

      anchor.setAttribute("href", resolveLinkUrl(href))
    })
  }

  const turndownService = createTurndownService()
  const markdown = turndownService.turndown(document.body)

  return markdown.trim().replace(/\n{3,}/g, "\n\n")
}
