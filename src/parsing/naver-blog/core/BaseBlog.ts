import type { CheerioAPI } from "cheerio"
import type { EditorBlockOutputDefinition, ParsedPost } from "../../../domain/ast/Types.js"
import type { ExportOptions } from "../../../domain/export-options/Types.js"
import type { BaseEditor } from "./BaseEditor.js"
import type { ParserBlockSourceEvidence } from "./BaseEditorTypes.js"

type BlogPostParseInput = {
  $: CheerioAPI
  html: string
  sourceUrl: string
  tags: string[]
  options: Pick<ExportOptions, "blockOutputs"> & {
    resolveLinkUrl?: (url: string) => string
  }
  captureBlockEvidence?: (evidence: ParserBlockSourceEvidence) => void
}

export abstract class BaseBlog {
  abstract readonly editors: BaseEditor[]

  getBlockOutputDefinitions(): EditorBlockOutputDefinition[] {
    return this.editors.flatMap((editor) => editor.getBlockOutputDefinitions())
  }

  getEditorForHtml(html: string) {
    return this.editors.find((candidate) => candidate.canParse(html)) ?? null
  }

  parsePost(input: BlogPostParseInput): ParsedPost {
    const editor = this.getEditorForHtml(input.html)

    if (!editor) {
      throw new Error("지원하는 블로그 에디터를 찾지 못했습니다.")
    }

    return editor.parse(input)
  }
}
