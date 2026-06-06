import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

import { parseSe4ImageGroup } from "./util/parseSe4ImageGroup.js"

export class NaverSe4ImageGroupBlock extends LeafParserBlock {
  override readonly id = "imageGroup"
  override readonly label = "이미지 그룹"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "기본",
        template: "![${alt}](${url})",
      },
    ],
    props: {
      alt: { label: "대체 텍스트", type: "string" },
      url: { label: "URL", type: "string" },
      caption: { label: "캡션", type: "string?" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ moduleType }: ParserBlockContext) {
    return moduleType === "v2_imageGroup"
  }

  override convert({ $node, options, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    return parseSe4ImageGroup({ $node, options, blockId, blockName: "image group" })
  }
}
