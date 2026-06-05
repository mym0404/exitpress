import type { CheerioAPI } from "cheerio"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { createVideoBlock } from "../../core/ParsedBlockOutput.js"

import { hasOnlyTargetContent } from "./util/WrapperContent.js"

const parseDimension = (value: string | undefined) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const parseVideoId = (sourceUrl: string) => {
  try {
    return new URL(sourceUrl).searchParams.get("vid")
  } catch {
    return null
  }
}

const createEmbeddedVideo = ({ iframe }: { iframe: ReturnType<CheerioAPI> }) => {
  const sourceUrl = normalizeAssetUrl(iframe.attr("src") ?? "")

  if (!sourceUrl) {
    return null
  }

  return {
    title: compactText(iframe.attr("title") ?? "") || "Video",
    thumbnailUrl: null,
    sourceUrl,
    vid: parseVideoId(sourceUrl),
    inkey: null,
    width: parseDimension(iframe.attr("width")),
    height: parseDimension(iframe.attr("height")),
  }
}

const getEmbeddedVideos = ({ $, $node }: { $: CheerioAPI; $node: ReturnType<CheerioAPI> }) => {
  if ($node.is("iframe[src]")) {
    if ($node.hasClass("poll_iframe")) {
      return null
    }

    const video = createEmbeddedVideo({ iframe: $node })

    return video ? [video] : null
  }

  if (!$node.is("p, div, span")) {
    return null
  }

  const directIframes = $node.children("iframe[src]").toArray()

  if (directIframes.length > 0) {
    const clone = $node.clone()

    clone.children("iframe[src], style").remove()

    if (clone.find("img, iframe, video, table").length > 0 || compactText(clone.text())) {
      return null
    }

    const videos = directIframes
      .map((iframe) => createEmbeddedVideo({ iframe: $(iframe) }))
      .filter((video) => video !== null)

    return videos.length === directIframes.length ? videos : null
  }

  const isVideoContainer = $node.is("span._outerVideo, span._naverVideo")
  const videoContainers = isVideoContainer
    ? $node
    : $node.find("span._outerVideo, span._naverVideo")

  if (videoContainers.length === 0) {
    return null
  }

  if (!isVideoContainer) {
    if (
      !hasOnlyTargetContent({
        element: $node,
        targetSelector: "span._outerVideo, span._naverVideo",
      })
    ) {
      return null
    }
  }

  const videos = []

  for (const container of videoContainers.toArray()) {
    const iframe = $(container).find("iframe[src]")

    if (iframe.length !== 1) {
      return null
    }

    const video = createEmbeddedVideo({ iframe })

    if (!video) {
      return null
    }

    videos.push(video)
  }

  return videos
}

export class NaverSe2EmbeddedVideoBlock extends LeafBlock {
  override readonly id = "video"
  override readonly label = "비디오"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "기본",
        template: "[${title}](${url})",
      },
    ],
    props: {
      title: { label: "제목", type: "string" },
      url: { label: "URL", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $, node, $node }: ParserBlockContext) {
    return node.type === "tag" && getEmbeddedVideos({ $, $node }) !== null
  }

  override convert({ $, $node, blockId }: Parameters<LeafBlock["convert"]>[0]) {
    const videos = getEmbeddedVideos({ $, $node })

    if (!videos) {
      throw new Error("SE2 embedded video block parsing failed.")
    }

    return videos.map((video) => createVideoBlock({ blockId, video }))
  }
}
