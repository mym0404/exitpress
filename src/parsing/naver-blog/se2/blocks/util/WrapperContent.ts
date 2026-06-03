import type { CheerioAPI } from "cheerio"

import { compactText } from "../../../../../shared/text/TextUtils.js"

const blockMediaSelector = "img, iframe, video, table"

export const hasOnlyTargetContent = ({
  element,
  ignoredSelector = "style",
  targetSelector,
}: {
  element: ReturnType<CheerioAPI>
  ignoredSelector?: string
  targetSelector: string
}) => {
  const clone = element.clone()

  clone.find([ignoredSelector, targetSelector].filter(Boolean).join(", ")).remove()

  if (clone.find(blockMediaSelector).length > 0) {
    return false
  }

  return compactText(clone.text()) === ""
}
