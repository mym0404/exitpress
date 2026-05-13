import type { AnyNode } from "domhandler"
import type { OutputOption } from "../../../../domain/ast/Types.js"
import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"
import { compactText } from "../../../../shared/text/TextUtils.js"
import { LeafBlock } from "../../core/BaseBlock.js"
import { parseJsonAttribute } from "../../core/JsonAttribute.js"
import { findInComponentRoot } from "./util/ComponentBoundary.js"

const parseDimension = (value: unknown) => {
  if (typeof value === "string" && !compactText(value)) {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

const getRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {}

const getAdjacentModuleScripts = ({ $, $node }: Pick<ParserBlockContext, "$" | "$node">) => {
  const scripts: AnyNode[] = []
  const siblings = $node.nextAll()

  for (let index = 0; index < siblings.length; index += 1) {
    const sibling = siblings[index]!
    const $sibling = $(sibling)

    if ($sibling.hasClass("se_component")) {
      break
    }

    if ($sibling.is("script.__se_module_data")) {
      scripts.push(sibling)
    }
  }

  return scripts
}

const getVideoModuleData = ({ $, $node }: Pick<ParserBlockContext, "$" | "$node">) => {
  const mediaId = findInComponentRoot({ $, $component: $node, selector: ".se_mediaArea[id]" })
    .first()
    .attr("id")
  const moduleScripts = getAdjacentModuleScripts({ $, $node })

  if (!mediaId) {
    return parseJsonAttribute($(moduleScripts[0]).attr("data-module"))
  }

  for (let index = 0; index < moduleScripts.length; index += 1) {
    const moduleData = parseJsonAttribute($(moduleScripts[index]).attr("data-module"))
    const data = getRecord(moduleData?.data)

    if (moduleData?.id === mediaId || data.baseElId === mediaId) {
      return moduleData
    }
  }

  return undefined
}

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

  override convert({ $, $node, sourceUrl = "" }: Parameters<LeafBlock["convert"]>[0]) {
    const moduleData = getVideoModuleData({ $, $node })
    const data = getRecord(moduleData?.data)
    const title =
      compactText(
        findInComponentRoot({
          $,
          $component: $node,
          selector: ".se_mediaCaption .se_textarea",
        }).text(),
      ) || "Video"

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
