import { describe, expect, it } from "vitest"

import { renderBlockTemplates } from "./renderBlockTemplates.js"

describe("renderBlockTemplates", () => {
  it("renders plain text and expressions from props", () => {
    const markdown = renderBlockTemplates([
      {
        template: "## {{ title }}",
        props: {
          title: "Hello",
        },
      },
      {
        template: "{{ `![${alt}](${url})` }}",
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
          template: "{{ missing }}",
          props: {},
        },
      ]),
    ).toThrow(/missing identifier/)
  })

  it("renders literal delimiters from string literals", () => {
    const markdown = renderBlockTemplates([
      {
        template: "{{ '{{}}' }}",
        props: {},
      },
    ])

    expect(markdown).toBe("{{}}")
  })

  it("ignores closing delimiters inside string literals", () => {
    const markdown = renderBlockTemplates([
      {
        template: "{{ 'before }} after' }}",
        props: {},
      },
    ])

    expect(markdown).toBe("before }} after")
  })

  it("fails when an expression is not closed", () => {
    expect(() =>
      renderBlockTemplates([
        {
          template: "{{ title",
          props: {
            title: "Hello",
          },
        },
      ]),
    ).toThrow(/unterminated template expression/)
  })

  it("preserves the line prefix for multiline expression values", () => {
    const markdown = renderBlockTemplates([
      {
        template: "> {{ text }}",
        props: {
          text: "First line\nSecond line",
        },
      },
    ])

    expect(markdown).toBe("> First line\n> Second line")
  })
})
