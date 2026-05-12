import type { CheerioAPI } from "cheerio"
import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"

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

const createEmbeddedVideo = ({
  iframe,
}: {
  iframe: ReturnType<CheerioAPI>
}) => {
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

  const videoContainers = $node.is("span._outerVideo") ? $node : $node.find("span._outerVideo")

  if (videoContainers.length === 0) {
    return null
  }

  if (!$node.is("span._outerVideo")) {
    const cloneWithoutVideo = $node.clone()
    cloneWithoutVideo.find("style, span._outerVideo").remove()

    if (cloneWithoutVideo.find("img, iframe, video, table").length > 0) {
      return null
    }

    if (compactText(cloneWithoutVideo.text())) {
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
  override readonly outputOptions = [
    {
      id: "source-link",
      label: "원문 링크",
      description: "비디오 제목을 원문 URL 링크로 출력합니다.",
      preview: {
        type: "video",
        video: {
          title: "Video",
          thumbnailUrl: null,
          sourceUrl: "https://example.com/video",
          vid: "vid",
          inkey: null,
          width: 640,
          height: 360,
        },
      },
      isDefault: true,
    },
  ] satisfies OutputOption<"video">[]

  override match({ $, node, $node }: ParserBlockContext) {
    return node.type === "tag" && getEmbeddedVideos({ $, $node }) !== null
  }

  override convert({ $, $node }: Parameters<LeafBlock["convert"]>[0]) {
    const videos = getEmbeddedVideos({ $, $node })

    /* v8 ignore next 3 */
    if (!videos) {
      return []
    }

    return videos.map((video) => ({ type: "video" as const, video }))
  }
}
