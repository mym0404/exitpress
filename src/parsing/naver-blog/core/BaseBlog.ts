import type { CheerioAPI } from "cheerio"

import type { ParsedPost, ParserBlockOptions } from "../../../domain/parser/Types.js"
import type { BlockTemplateDefinition } from "../../../domain/template/Types.js"

import type { BaseEditor } from "./BaseEditor.js"
import type { ParserBlockSourceEvidence } from "./BaseEditorTypes.js"

type BlogPostParseInput = {
  $: CheerioAPI
  html: string
  sourceUrl: string
  tags: string[]
  options: ParserBlockOptions
  captureBlockEvidence?: (evidence: ParserBlockSourceEvidence) => void
}

export abstract class BaseBlog {
  abstract readonly editors: BaseEditor[]

  getBlockTemplateDefinitions(): BlockTemplateDefinition[] {
    return this.editors.flatMap((editor) => editor.getBlockTemplateDefinitions())
  }

  getParserBlockStoryDefinitions() {
    return this.editors.flatMap((editor) => editor.getParserBlockStoryDefinitions())
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
