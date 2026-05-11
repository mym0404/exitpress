// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ToggleGroup, ToggleGroupItem } from "./ToggleGroup.js"

afterEach(() => {
  cleanup()
})

describe("ToggleGroup", () => {
  it("renders selected state and reports value changes", async () => {
    const user = userEvent.setup()
    const handleValueChange = vi.fn()

    render(
      <ToggleGroup value="preview" onValueChange={handleValueChange}>
        <ToggleGroupItem value="preview">Preview toggle</ToggleGroupItem>
        <ToggleGroupItem value="raw">Raw toggle</ToggleGroupItem>
      </ToggleGroup>,
    )

    expect(screen.getByRole("button", { name: "Preview toggle" })).toHaveAttribute(
      "data-state",
      "on",
    )

    await user.click(screen.getByRole("button", { name: "Raw toggle" }))
    expect(handleValueChange).toHaveBeenCalledWith("raw")
  })
})
