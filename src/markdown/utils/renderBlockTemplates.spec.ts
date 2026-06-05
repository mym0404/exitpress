import { describe, expect, it } from "vitest"

import { renderBlockTemplates } from "./renderBlockTemplates.js"

describe("renderBlockTemplates", () => {
  it("renders plain text and expressions from props", () => {
    const markdown = renderBlockTemplates([
      {
        template: "## ${title}",
        props: {
          title: "Hello",
        },
      },
      {
        template: "![${alt}](${url})",
        props: {
          alt: "cover",
          url: "assets/cover.png",
        },
      },
    ])

    expect(markdown).toBe("## Hello\n\n![cover](assets/cover.png)")
  })

  it("fails without fallback when an expression cannot be evaluated", () => {
    expect(() =>
      renderBlockTemplates([
        {
          template: "${missing}",
          props: {},
        },
      ]),
    ).toThrow(/missing identifier/)
  })

  it("preserves the line prefix for multiline expression values", () => {
    const markdown = renderBlockTemplates([
      {
        template: "> ${text}",
        props: {
          text: "First line\nSecond line",
        },
      },
    ])

    expect(markdown).toBe("> First line\n> Second line")
  })
})
