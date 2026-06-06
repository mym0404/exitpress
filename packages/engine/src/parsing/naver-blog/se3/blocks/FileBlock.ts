import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { ParsedBlock } from "@exitpress/domain/parser/schema/ParsedPost.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

import { findInComponentRoot } from "./util/ComponentBoundary.js"

export class NaverSe3FileBlock extends LeafParserBlock {
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

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_file") && $node.hasClass("default")
  }

  override convert({ $, $node, blockId, options }: Parameters<LeafParserBlock["convert"]>[0]) {
    const link = findInComponentRoot({
      $,
      $component: $node,
      selector: "a.se_name_area[href]",
    }).first()
    const url = link.attr("href") ?? ""

    if (!url) {
      throw new Error("SE3 file block parsing failed.")
    }

    const title = compactText(link.find(".se_name").text()) || url
    const extension = title.match(/(\.[A-Za-z0-9]+)$/)?.[1] ?? ""
    const fileName = extension ? title.slice(0, -extension.length) : title

    return [
      {
        blockId,
        props: {
          fileName,
          fileExtension: extension,
          fileUrl: options.resolveLinkUrl ? options.resolveLinkUrl(url) : url,
        },
      } satisfies ParsedBlock,
    ]
  }
}
