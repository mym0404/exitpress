import type { UnknownRecord } from "../../../../shared/object/UnknownRecord.js"
import type { ParserBlockContext } from "../../core/BaseBlock.js"

import { compactText } from "../../../../shared/text/TextUtils.js"
import { createLinkParagraphBlocks } from "../../common/LinkParagraph.js"
import { LeafBlock } from "../../core/BaseBlock.js"

const readString = (record: UnknownRecord | undefined, key: string) => {
  const value = record?.[key]

  return typeof value === "string" ? compactText(value) : ""
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export class NaverSe4ScheduleBlock extends LeafBlock {
  override readonly id = "linkCard"
  override readonly label = "일정"

  override match({ $node, moduleType }: ParserBlockContext) {
    return moduleType === "v2_schedule" || $node.hasClass("se-schedule")
  }

  override convert({ $node, moduleData, options }: Parameters<LeafBlock["convert"]>[0]) {
    const data = isRecord(moduleData?.data) ? moduleData.data : undefined
    const title = compactText($node.find(".se-schedule-title-text").first().text())
    const url = $node.find("a.se-schedule-url[href]").first().attr("href") ?? ""
    const description = readString(data, "startAt")

    if (url) {
      return createLinkParagraphBlocks({
        title: title || url,
        description,
        url,
        hasThumbnail: false,
        resolveLinkUrl: options.resolveLinkUrl,
      })
    }

    return [title, description]
      .filter(Boolean)
      .map((text) => ({ type: "paragraph" as const, text }))
  }
}
