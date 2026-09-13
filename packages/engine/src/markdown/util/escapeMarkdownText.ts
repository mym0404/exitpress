import TurndownService from "turndown"

const textEscaper = new TurndownService()

// Escapes literal source text, before generated Markdown syntax is introduced.
export const escapeMarkdownText = (text: string) =>
  textEscaper.escape(text).replace(/[<$|]/g, "\\$&")
