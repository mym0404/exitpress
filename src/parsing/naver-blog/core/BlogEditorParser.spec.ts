import { describe, expect, it } from "vitest"

import type { ParsedPost } from "../../../domain/parser/Types.js"

import type { ParserBlockContext, ParserBlockConvertContext } from "./ParserBlock.js"

import { BlogEditorParser, type BlogEditorParseInput } from "./BlogEditorParser.js"
import { LeafParserBlock } from "./ParserBlock.js"

class TemplateLessParagraphBlock extends LeafParserBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"

  override match(_context: ParserBlockContext) {
    return false
  }

  override convert(_context: ParserBlockConvertContext) {
    return []
  }
}

class TemplateLessEditor extends BlogEditorParser {
  override readonly type = "template-less"
  override readonly label = "Template Less"

  protected override readonly supportedBlocks = [new TemplateLessParagraphBlock()]

  override canParse(_html: string) {
    return true
  }

  override parse(_input: BlogEditorParseInput): ParsedPost {
    return {
      tags: [],
      blocks: [],
    }
  }
}

describe("BlogEditorParser", () => {
  it("does not create block template presets for blocks without template definitions", () => {
    const editor = new TemplateLessEditor()

    expect(editor.getBlockTemplateDefinitions()).toEqual([])
  })
})
