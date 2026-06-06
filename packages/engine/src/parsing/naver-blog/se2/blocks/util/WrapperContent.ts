import { compactText } from "@exitpress/engine/shared/text/TextUtils.js"

import type { CheerioAPI } from "cheerio"

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
