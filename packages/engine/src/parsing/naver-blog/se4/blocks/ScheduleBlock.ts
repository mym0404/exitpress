import { compactText } from "@exitpress/engine/shared/text/util/TextCompaction.js"

import type { UnknownRecord } from "@exitpress/engine/shared/object/UnknownRecord.js"

import type { ParserBlockContext, ParserBlockTemplateDefinition } from "../../core/ParserBlock.js"

import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { createParagraphBlock } from "../../core/ParsedBlockOutput.js"
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
    presets: [{ id: "default", label: "기본", template: "${text}" }],
    props: {
      text: { label: "본문", type: "string" },
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
    const description = readString(data, "startAt")

    if (url) {
      return createLinkParagraphBlocks({
        blockId,
        title: title || url,
        description,
        url,
        hasThumbnail: false,
        resolveLinkUrl: options.resolveLinkUrl,
      })
    }

    return [title, description]
      .filter(Boolean)
      .map((text) => createParagraphBlock({ blockId, text }))
  }
}
