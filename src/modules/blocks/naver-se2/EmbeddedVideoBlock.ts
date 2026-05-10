import type { CheerioAPI } from "cheerio"

import { normalizeAssetUrl, compactText } from "../../../shared/Utils.js"
import type { OutputOption } from "../../../shared/Types.js"
import { LeafBlock } from "../BaseBlock.js"
import type { ParserBlockContext } from "../ParserNode.js"

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

const getEmbeddedVideo = ({ $node }: { $node: ReturnType<CheerioAPI> }) => {
  if (!$node.is("p, div, span")) {
    return null
  }

  const iframes = $node.find("span._outerVideo iframe[src]")

  if (iframes.length !== 1) {
    return null
  }

  const cloneWithoutVideo = $node.clone()
  cloneWithoutVideo.find("style, span._outerVideo").remove()

  if (cloneWithoutVideo.find("img, iframe, video, table").length > 0) {
    return null
  }

  if (compactText(cloneWithoutVideo.text())) {
    return null
  }

  const iframe = iframes.first()
  const sourceUrl = normalizeAssetUrl(iframe.attr("src")!)

  if (!sourceUrl) {
    return null
  }

  return {
    title: "Video",
    thumbnailUrl: null,
    sourceUrl,
    vid: parseVideoId(sourceUrl),
    inkey: null,
    width: parseDimension(iframe.attr("width")),
    height: parseDimension(iframe.attr("height")),
  }
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

  override match({ node, $node }: ParserBlockContext) {
    return node.type === "tag" && getEmbeddedVideo({ $node }) !== null
  }

  override convert({ $node }: Parameters<LeafBlock["convert"]>[0]) {
    const video = getEmbeddedVideo({ $node })

    /* v8 ignore next 3 */
    if (!video) {
      return []
    }

    return [{ type: "video" as const, video }]
  }
}
