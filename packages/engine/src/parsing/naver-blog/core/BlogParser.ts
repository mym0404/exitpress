import type { ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { ParserBlockOptions } from "@exitpress/domain/parser/schema/ParserBlockOptions.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { CheerioAPI } from "cheerio"

import type { BlogEditorParser } from "./BlogEditorParser.js"
import type { ParserBlockParseEvidence } from "./ParserBlockDiagnostics.js"

type BlogPostParseInput = {
  $: CheerioAPI
  html: string
  sourceUrl: string
  tags: string[]
  options: ParserBlockOptions
  captureBlockParseEvidence?: (evidence: ParserBlockParseEvidence) => void
}

export abstract class BlogParser {
  abstract readonly editors: BlogEditorParser[]

  getBlockTemplateDefinitions(): BlockTemplateDefinition[] {
    return this.editors.flatMap((editor) => editor.getBlockTemplateDefinitions())
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
