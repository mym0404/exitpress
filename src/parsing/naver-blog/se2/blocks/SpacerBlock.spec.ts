import { describe, expect, it } from "vitest"

import { parseSe2Blocks } from "../../../../../tests/support/parser-test-utils.js"

describe("NaverSe2SpacerBlock", () => {
  it("skips empty styled spacer paragraphs instead of keeping rawHtml", () => {
    const parsed = parseSe2Blocks(`
      <p style="" _foo="MsoNormal"><span lang="EN-US" style="font-size:12pt;">&nbsp;</span></p>
      <p><br></p>
      <div><br></div>
      <ul style="list-style-type: disc;"></ul>
    `)

    expect(parsed.blocks).toEqual([])
  })

  it("skips empty inline spacer wrappers instead of keeping rawHtml", () => {
    const parsed = parseSe2Blocks(`
      <span style="" _foo="font-family: 나눔고딕, NanumGothic, sans-serif;"> </span>
      <span style="" _foo="font-family: 나눔고딕, NanumGothic, sans-serif;"><b> </b></span>
      <font><br /></font>
      <strike> </strike>
      <o:p></o:p>
      <a href="mailto:empty@example.com" target="_blank"></a>
    `)

    expect(parsed.blocks).toEqual([])
  })
})
