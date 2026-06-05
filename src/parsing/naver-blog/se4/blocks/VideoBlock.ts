import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

import { normalizeAssetUrl } from "../../../../domain/blog/NaverUrl.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { createVideoBlock } from "../../core/ParsedBlockOutput.js"

export class NaverSe4VideoBlock extends LeafBlock {
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

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_video" || $node.hasClass("se-video")
  }

  override convert({ moduleData, sourceUrl, blockId }: Parameters<LeafBlock["convert"]>[0]) {
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
      createVideoBlock({
        blockId,
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
      }),
    ]
  }
}
