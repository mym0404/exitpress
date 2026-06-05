import { describe, expect, it } from "vitest"

import type { ParsedPost } from "../../../domain/parser/Types.js"

import type { ParserBlockContext, ParserBlockConvertContext } from "./BaseBlock.js"

import { LeafBlock } from "./BaseBlock.js"
import { BaseEditor, type BaseEditorParseInput } from "./BaseEditor.js"

class TemplateLessParagraphBlock extends LeafBlock {
  override readonly id = "paragraph"
  override readonly label = "문단"

  override match(_context: ParserBlockContext) {
    return false
  }

  override convert(_context: ParserBlockConvertContext) {
    return []
  }
}

class TemplateLessEditor extends BaseEditor {
  override readonly type = "template-less"
  override readonly label = "Template Less"

  protected override readonly supportedBlocks = [new TemplateLessParagraphBlock()]

  override canParse(_html: string) {
    return true
  }

  override parse(_input: BaseEditorParseInput): ParsedPost {
    return {
      tags: [],
      blocks: [],
    }
  }
}

describe("BaseEditor", () => {
  it("does not create block template presets for blocks without template definitions", () => {
    const editor = new TemplateLessEditor()

    expect(editor.getBlockTemplateDefinitions()).toEqual([])
  })
})
