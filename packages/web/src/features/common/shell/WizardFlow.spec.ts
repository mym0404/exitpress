import { describe, expect, it } from "vitest"

import { getNextSetupStep, getPreviousSetupStep } from "./WizardFlow.js"

describe("upload provider setup step navigation", () => {
  it("visits upload provider options after assets when download-and-upload is selected", () => {
    expect(
      getNextSetupStep({
        setupStep: "assets-options",
        imageHandlingMode: "download-and-upload",
      }),
    ).toBe("upload-provider-options")
  })

  it("skips upload provider options when image handling does not upload", () => {
    expect(getNextSetupStep({ setupStep: "assets-options", imageHandlingMode: "download" })).toBe(
      "links-options",
    )
    expect(getNextSetupStep({ setupStep: "assets-options", imageHandlingMode: "remote" })).toBe(
      "links-options",
    )
  })

  it("goes back from links to upload provider options only for download-and-upload", () => {
    expect(
      getPreviousSetupStep({
        setupStep: "links-options",
        imageHandlingMode: "download-and-upload",
      }),
    ).toBe("upload-provider-options")
    expect(
      getPreviousSetupStep({ setupStep: "links-options", imageHandlingMode: "download" }),
    ).toBe("assets-options")
  })
})
