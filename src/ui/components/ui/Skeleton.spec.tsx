// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { Skeleton } from "./Skeleton.js"

afterEach(() => {
  cleanup()
})

describe("Skeleton", () => {
  it("renders the skeleton data slot", () => {
    render(<Skeleton className="w-10" data-testid="skeleton" />)

    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-slot", "skeleton")
  })
})
