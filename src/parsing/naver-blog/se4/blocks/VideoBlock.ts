import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { LeafBlock } from "../../core/BaseBlock.js"

export class NaverSe4VideoBlock extends LeafBlock {
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
          title: "Demo video",
          thumbnailUrl: "https://example.com/video-thumb.png",
          sourceUrl: "https://example.com/video",
          vid: "vid",
          inkey: "inkey",
          width: 640,
          height: 360,
        },
      },
      isDefault: true,
    },
  ] satisfies OutputOption<"video">[]

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_video" || $node.hasClass("se-video")
  }

  override convert({ moduleData, sourceUrl }: Parameters<LeafBlock["convert"]>[0]) {
    const data = (moduleData?.data ?? {}) as UnknownRecord & {
      thumbnail?: string
      vid?: string
      inkey?: string
      mediaMeta?: {
        title?: string
      }
      width?: string
      height?: string
    }

    return [
      {
        type: "video" as const,
        video: {
          title: data.mediaMeta?.title?.trim() || "Video",
          thumbnailUrl: data.thumbnail ? normalizeAssetUrl(data.thumbnail) : null,
          /* v8 ignore next */
          sourceUrl: sourceUrl ?? "",
          vid: data.vid ?? null,
          inkey: data.inkey ?? null,
          width: data.width ? Number(data.width) : null,
          height: data.height ? Number(data.height) : null,
        },
      },
    ]
  }
}
