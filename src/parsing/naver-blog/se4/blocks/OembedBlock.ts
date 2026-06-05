import { load } from "cheerio"

import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

export class NaverSe4OembedBlock extends LeafParserBlock {
  override readonly id = "oembed"
  override readonly label = "임베드"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_oembed" || $node.hasClass("se-oembed")
  }

  override convert({ moduleData, blockId, options }: Parameters<LeafParserBlock["convert"]>[0]) {
    const data = (moduleData?.data ?? {}) as UnknownRecord & {
      html?: string
      inputUrl?: string
      thumbnailUrl?: string
      description?: string
      title?: string
      providerUrl?: string
    }
    const iframeUrl =
      typeof data.html === "string" && data.html
        ? (load(data.html)("iframe").attr("src") ?? null)
        : null
    const url = data.inputUrl ?? iframeUrl ?? data.providerUrl ?? ""

    if (!url) {
      throw new Error("SE4 oEmbed block parsing failed.")
    }

    return createLinkParagraphBlocks({
      blockId,
      title: compactText(data.title ?? "") || url,
      description: compactText(data.description ?? ""),
      url,
      hasThumbnail: typeof data.thumbnailUrl === "string" && data.thumbnailUrl !== "",
      resolveLinkUrl: options.resolveLinkUrl,
    })
  }
}
