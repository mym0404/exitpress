import type { AnyNode } from "domhandler"

import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/BaseBlock.js"

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
