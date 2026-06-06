import { describe, expect, it } from "vitest"

import { getTemplatePreview } from "./TemplatePreview.js"

describe("getTemplatePreview", () => {
  it("returns rendered preview text", () => {
    expect(getTemplatePreview(() => "2026-04-11-first-post")).toBe("2026-04-11-first-post")
  })

  it("keeps the UI render path stable while a template is incomplete", () => {
    expect(
      getTemplatePreview(() => {
        throw new Error("unterminated template expression")
      }),
    ).toBeUndefined()
  })
})
