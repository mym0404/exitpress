import { normalizeAssetUrl } from "@exitpress/blog-naver/NaverUrl.js"
import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { hasOnlyTargetContent } from "./util/hasOnlyTargetContent.js"

const getPollLink = ({ $node }: Pick<ParserBlockContext, "$node">) => {
  if (!$node.is("div, p")) {
    return null
  }

  const iframe = $node.find("iframe.poll_iframe")

  if (iframe.length !== 1) {
    return null
  }

  if (
    !hasOnlyTargetContent({
      element: $node,
      targetSelector: "iframe.poll_iframe",
    })
  ) {
    return null
  }

  const sourceUrl = normalizeAssetUrl(iframe.attr("src") ?? "")

  if (!sourceUrl) {
    return null
  }

  return {
    title: compactText(iframe.attr("title") ?? "") || "투표",
    sourceUrl,
  }
}

export class NaverSe2PollBlock extends LeafParserBlock {
  override readonly id = "poll"
  override readonly label = "투표"
  override readonly templateDefinition = {
    label: this.label,
    presets: [{ id: "default", label: "본문", template: "{{ text }}" }],
    props: {
      text: { label: "본문", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ node, $node }: ParserBlockContext) {
    return node.type === "tag" && getPollLink({ $node }) !== null
  }

  override convert({ $node, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const poll = getPollLink({ $node })

    if (!poll) {
      throw new Error("SE2 poll block parsing failed.")
    }

    return [createParagraphBlock({ blockId, text: `[${poll.title}](${poll.sourceUrl})` })]
  }
}
