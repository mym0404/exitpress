import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

const getPollLink = ({ $node }: Pick<ParserBlockContext, "$node">) => {
  if (!$node.is("div")) {
    return null
  }

  const iframe = $node.find("iframe.poll_iframe")

  if (iframe.length !== 1) {
    return null
  }

  const cloneWithoutPoll = $node.clone()
  cloneWithoutPoll.find("iframe.poll_iframe").remove()

  if (cloneWithoutPoll.find("img, iframe, video, table").length > 0) {
    return null
  }

  if (compactText(cloneWithoutPoll.text())) {
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

export class NaverSe2PollBlock extends LeafBlock {
  override readonly id = "poll"
  override readonly label = "투표"

  override match({ node, $node }: ParserBlockContext) {
    return node.type === "tag" && getPollLink({ $node }) !== null
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const poll = getPollLink({ $node })

    /* v8 ignore next 3 */
    if (!poll) {
      return []
    }

    return [{ type: "paragraph" as const, text: `[${poll.title}](${poll.sourceUrl})` }]
  }
}
