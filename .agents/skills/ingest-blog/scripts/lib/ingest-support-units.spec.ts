import { describe, expect, it } from "vitest"

import { createSupportUnit } from "./ingest-support-units.js"

describe("createSupportUnit", () => {
  it("uses SE4 module type as the support unit key", () => {
    const unit = createSupportUnit({
      editorType: "naver-se4",
      firstUnsupportedTag: "div",
      firstUnsupportedClassName: "se-poll se-component",
      firstUnsupportedModuleType: "v2_poll",
    })

    expect(unit.supportUnitKey).toBe("naver-se4:v2_poll")
    expect(unit.failureBlockHash).toMatch(/^[a-f0-9]{8}$/)
  })

  it("uses normalized class and hash for non-module failures", () => {
    const unit = createSupportUnit({
      editorType: "naver-se2",
      firstUnsupportedTag: "div",
      firstUnsupportedClassName: "beta alpha",
      firstUnsupportedModuleType: null,
    })

    expect(unit.supportUnitKey).toMatch(/^naver-se2:div:alpha-beta:[a-f0-9]{8}$/)
  })

  it("keeps the non-module support unit key stable when class order changes", () => {
    const left = createSupportUnit({
      editorType: "naver-se2",
      firstUnsupportedTag: "div",
      firstUnsupportedClassName: "beta alpha",
      firstUnsupportedModuleType: null,
    })
    const right = createSupportUnit({
      editorType: "naver-se2",
      firstUnsupportedTag: "div",
      firstUnsupportedClassName: "alpha beta",
      firstUnsupportedModuleType: null,
    })

    expect(left.supportUnitKey).toBe(right.supportUnitKey)
    expect(left.failureBlockHash).toBe(right.failureBlockHash)
  })
})
