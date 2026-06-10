import { describe, expect, it } from "vitest"

import { getTemplatePreview } from "./TemplatePreview.js"

describe("getTemplatePreview", () => {
  it("returns rendered preview text", () => {
    expect(getTemplatePreview(() => "2026-04-11-first-post")).toEqual({
      status: "success",
      text: "2026-04-11-first-post",
    })
  })

  it("returns the template error message when a template is incomplete", () => {
    expect(
      getTemplatePreview(() => {
        throw new Error("unterminated template expression")
      }),
    ).toEqual({
      status: "error",
      message: "템플릿 오류: unterminated template expression",
    })
  })
})
