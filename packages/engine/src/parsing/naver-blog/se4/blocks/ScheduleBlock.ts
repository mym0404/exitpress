import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { ParsedBlock } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { LeafParserBlock } from "../../core/ParserBlock.js"

const readString = (record: UnknownRecord | undefined, key: string) => {
  const value = record?.[key]

  return typeof value === "string" ? compactText(value) : ""
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export class NaverSe4ScheduleBlock extends LeafParserBlock {
  override readonly id = "schedule"
  override readonly label = "일정"
  override readonly templateDefinition = {
    label: this.label,
    presets: [
      {
        id: "schedule",
        label: "일정",
        template:
          "${(url ? '[' + title + '](' + url + ')' : title) + (startAt ? '\\n' + startAt : '') + (endAt ? ' - ' + endAt : '')}",
      },
    ],
    props: {
      title: { label: "제목", type: "string" },
      startAt: { label: "시작", type: "string" },
      endAt: { label: "종료", type: "string" },
      url: { label: "URL", type: "string" },
    },
  } satisfies ParserBlockTemplateDefinition

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_schedule" || $node.hasClass("se-schedule")
  }

  override convert({
    $node,
    moduleData,
    blockId,
    options,
  }: Parameters<LeafParserBlock["convert"]>[0]) {
    const data = isRecord(moduleData?.data) ? moduleData.data : undefined
    const title = compactText($node.find(".se-schedule-title-text").first().text())
    const url = $node.find("a.se-schedule-url[href]").first().attr("href") ?? ""

    return [
      {
        blockId,
        props: {
          title: title || url,
          startAt: readString(data, "startAt"),
          endAt: readString(data, "endAt"),
          url: url && options.resolveLinkUrl ? options.resolveLinkUrl(url) : url,
        },
      } satisfies ParsedBlock,
    ]
  }
}
