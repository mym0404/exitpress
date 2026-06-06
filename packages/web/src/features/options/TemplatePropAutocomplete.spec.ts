import { describe, expect, it } from "vitest"

import { createTemplatePropCompletionSource } from "./TemplatePropAutocomplete.js"

const getCompletionLabels = ({
  template,
  cursor = template.length,
}: {
  template: string
  cursor?: number
}) => {
  const source = createTemplatePropCompletionSource({
    caption: { label: "캡션", type: "string?" },
    slug: { label: "Slug", type: "string" },
    url: { label: "URL", type: "string" },
  })

  return (
    source({
      explicit: true,
      pos: cursor,
      state: {
        doc: {
          sliceString: (from: number, to: number) => template.slice(from, to),
        },
      },
    })?.options.map((option) => option.label) ?? []
  )
}

describe("createTemplatePropCompletionSource", () => {
  it("suggests matching props inside template expressions", () => {
    expect(getCompletionLabels({ template: "{{ c" })).toEqual(["caption"])
  })

  it("does not suggest props outside template expressions", () => {
    expect(getCompletionLabels({ template: "caption" })).toEqual([])
    expect(getCompletionLabels({ template: "{{ caption }} text" })).toEqual([])
  })
})
