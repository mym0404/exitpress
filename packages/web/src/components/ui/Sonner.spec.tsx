import { describe, expect, it } from "vitest"

import { Toaster } from "./Sonner.js"

describe("Toaster", () => {
  it("uses the shared toaster defaults", () => {
    const toasterElement = Toaster({
      duration: 1000,
    })

    expect(toasterElement.props.position).toBe("top-right")
    expect(toasterElement.props.closeButton).toBe(true)
    expect(toasterElement.props.expand).toBe(true)
    expect(toasterElement.props.richColors).toBe(true)
  })
})
