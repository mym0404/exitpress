import { describe, expect, it } from "vitest"

import type { ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"

import type {
  ParserBlockContext,
  ParserBlockConvertContext,
  ParserBlockTemplateDefinition,
} from "./ParserBlock.js"

import { BlogEditorParser, type BlogEditorParseInput } from "./BlogEditorParser.js"
import { LeafParserBlock } from "./ParserBlock.js"

class TemplateLessParagraphBlock extends LeafParserBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "ignore", label: "무시", template: "" }],
    props: {},
  } satisfies ParserBlockTemplateDefinition

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
  it("keeps empty block templates in the block template catalog", () => {
    const editor = new TemplateLessEditor()

    expect(editor.getBlockTemplateDefinitions()).toEqual([
      {
        key: "template-less:paragraph",
        label: "문단",
        presets: [{ id: "ignore", label: "무시", template: "" }],
        props: {},
      },
    ])
  })
})
