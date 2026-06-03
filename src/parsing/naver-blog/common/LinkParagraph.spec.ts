import { describe, expect, it } from "vitest"

import { createLinkParagraphBlocks } from "./LinkParagraph.js"

describe("createLinkParagraphBlocks", () => {
  it("uses the URL as the link label when the title is empty", () => {
    expect(
      createLinkParagraphBlocks({
        title: "",
        description: "",
        url: "https://example.com/post",
        hasThumbnail: false,
      }),
    ).toEqual([
      {
        type: "paragraph",
        text: "[https://example.com/post](https://example.com/post)",
      },
    ])
  })
})
