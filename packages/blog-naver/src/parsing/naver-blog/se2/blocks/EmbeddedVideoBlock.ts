import { normalizeAssetUrl } from "@exitpress/blog-naver/NaverUrl.js"
import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { CheerioAPI } from "cheerio"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createVideoBlock } from "../../core/ParsedBlockOutput.js"
import { LeafParserBlock } from "../../core/ParserBlock.js"

import { hasOnlyTargetContent } from "./util/hasOnlyTargetContent.js"

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

const nativePlayerSelector = "pzp-pc-layout._naverVideo[vid], pzp-mobile-layout._naverVideo[vid]"

const getEmbeddedVideos = ({
  $,
  $node,
  sourceUrl = "",
}: {
  $: CheerioAPI
  $node: ReturnType<CheerioAPI>
  sourceUrl?: string
}) => {
  const players = $node.is(nativePlayerSelector) ? $node : $node.find(nativePlayerSelector)

  if (
    players.length > 0 &&
    ($node.is(nativePlayerSelector) ||
      hasOnlyTargetContent({
        element: $node,
        targetSelector: nativePlayerSelector,
      }))
  ) {
    return players.toArray().map((node) => {
      const player = $(node)
      const blogId = player.attr("domain-or-blogid")
      const postId = player.attr("logno")
      const style = player.attr("style") ?? ""
      const thumbnailPath = player.attr("vthumb")
      const poster =
        player.attr("poster") ??
        player.find("video[poster]").attr("poster") ??
        (thumbnailPath?.startsWith("/") && !thumbnailPath.startsWith("//")
          ? `https://phinf.pstatic.net/image.nmv${thumbnailPath}`
          : undefined)

      return {
        title:
          compactText(player.find("pzp-pc-content-title, pzp-content-title").text()) || "Video",
        thumbnailUrl: poster ? normalizeAssetUrl(poster) : null,
        sourceUrl:
          blogId && postId
            ? `https://blog.naver.com/${encodeURIComponent(blogId)}/${encodeURIComponent(postId)}`
            : sourceUrl,
        vid: player.attr("vid") ?? null,
        inkey: null,
        width: parseDimension(style.match(/(?:^|;)\s*width\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1]),
        height: parseDimension(style.match(/(?:^|;)\s*height\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1]),
      }
    })
  }

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

export class NaverSe2EmbeddedVideoBlock extends LeafParserBlock {
  override readonly id = "video"
  override readonly label = "비디오"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "default",
        label: "썸네일과 링크",
        template:
          "{{ thumbnailUrl ? `![${title}](${thumbnailUrl})\\n[${title}](${url})` : `[${title}](${url})` }}",
      },
    ],
    props: {
      title: { label: "제목", type: "string" },
      url: { label: "URL", type: "string" },
      thumbnailUrl: { label: "썸네일 URL", type: "string?" },
      width: { label: "너비", type: "number?" },
      height: { label: "높이", type: "number?" },
      vid: { label: "비디오 ID", type: "string?" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $, node, $node }: ParserBlockContext) {
    return node.type === "tag" && getEmbeddedVideos({ $, $node }) !== null
  }

  override convert({ $, $node, sourceUrl, blockId }: Parameters<LeafParserBlock["convert"]>[0]) {
    const videos = getEmbeddedVideos({ $, $node, sourceUrl })

    if (!videos) {
      throw new Error("SE2 embedded video block parsing failed.")
    }

    return videos.map((video) => createVideoBlock({ blockId, video }))
  }
}
