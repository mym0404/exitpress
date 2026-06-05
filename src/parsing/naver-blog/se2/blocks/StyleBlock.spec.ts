import { describe, expect, it } from "vitest"

import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2StyleBlock", () => {
  it("skips inline style tags around classic content", () => {
    const parsed = parseSe2Blocks(`
      <style>@media all and (min-width:116px){#_video1 iframe{width:76px}}</style>
      <p>본문</p>
    `)

    expect(parsed.blocks).toEqual([{ type: "paragraph", text: "본문" }])
  })
})
