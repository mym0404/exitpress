import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseJsonAttribute } from "../../core/JsonAttribute.js"

const parseDimension = (value: unknown) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const getRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {}

export class NaverSe3VideoBlock extends LeafBlock {
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
          inkey: "inkey",
          width: 640,
          height: 360,
        },
      },
      isDefault: true,
    },
  ] satisfies OutputOption<"video">[]

  override match({ $node }: ParserBlockContext) {
    return $node.hasClass("se_video") && $node.hasClass("default")
  }

  override convert({ $node, sourceUrl = "" }: Parameters<LeafBlock["convert"]>[0]) {
    const moduleData = parseJsonAttribute(
      $node.nextAll("script.__se_module_data").first().attr("data-module"),
    )
    const data = getRecord(moduleData?.data)
    const title = compactText($node.find(".se_mediaCaption .se_textarea").text()) || "Video"

    return [
      {
        type: "video" as const,
        video: {
          title,
          thumbnailUrl: null,
          sourceUrl,
          vid: typeof data.vid === "string" ? data.vid : null,
          inkey: typeof data.inkey === "string" ? data.inkey : null,
          width: parseDimension(data.width),
          height: parseDimension(data.height),
        },
      },
    ]
  }
}
