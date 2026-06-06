import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { ParsedBlock } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4FileBlock extends LeafParserBlock {
  override readonly id = "file"
  override readonly label = "첨부파일"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "file-link",
        label: "파일 링크",
        template: "[${fileName}${fileExtension}](${fileUrl})",
      },
    ],
    props: {
      fileName: { label: "파일명", type: "string" },
      fileExtension: { label: "확장자", type: "string" },
      fileUrl: { label: "파일 URL", type: "string" },
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

    return [
      {
        blockId,
        props: {
          fileName: compactText($node.find(".se-file-name").text()) || url,
          fileExtension: compactText($node.find(".se-file-extension").text()),
          fileUrl: options.resolveLinkUrl ? options.resolveLinkUrl(url) : url,
        },
      } satisfies ParsedBlock,
    ]
  }
}
