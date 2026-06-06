import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4FileBlock extends LeafParserBlock {
  override readonly id = "file"
  override readonly label = "첨부파일"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_file" || $node.hasClass("se-file")
  }

  override convert({
    $node,
    moduleData,
    blockId,
    options,
  }: Parameters<LeafParserBlock["convert"]>[0]) {
    const data = (moduleData?.data ?? {}) as UnknownRecord & {
      link?: string
    }
    const url = $node.find("a.se-file-save-button").attr("href") ?? data.link ?? ""

    if (!url) {
      throw new Error("SE4 file block parsing failed.")
    }

    const title = [
      compactText($node.find(".se-file-name").text()),
      compactText($node.find(".se-file-extension").text()),
    ].join("")

    return createLinkParagraphBlocks({
      blockId,
      title: title || url,
      description: "",
      url,
      hasThumbnail: false,
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
