// @vitest-environment jsdom

import { screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderApp } from "../../../tests/support/ui/AppSpecHarness.js"

describe("App storybook route", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/storybook")
  })

  afterEach(() => {
    window.history.replaceState({}, "", "/")
  })

  it("renders storybook stories without loading export defaults", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("storybook route must not call export APIs")
    })

    vi.stubGlobal("fetch", fetchMock)

    renderApp()

    expect(await screen.findByRole("heading", { name: "Storybook" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Back/ })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "Storybook" })).toHaveAttribute("href", "/storybook")
    expect(screen.getByRole("tree", { name: "Storybook stories" })).toBeInTheDocument()
    expect(screen.getByRole("treeitem", { name: /SmartEditor 4/ })).toBeInTheDocument()
    expect(screen.getByRole("treeitem", { name: /SmartEditor 3/ })).toBeInTheDocument()
    expect(screen.getByRole("treeitem", { name: /SmartEditor 2/ })).toBeInTheDocument()
    const se4DocumentTitle = document.querySelector(
      "[data-storybook-block='naver-se4-0-documentTitle']",
    )
    const se4Formula = document.querySelector("[data-storybook-block='naver-se4-1-formula']")

    expect(se4DocumentTitle).toBeInTheDocument()
    expect(se4Formula).toBeInTheDocument()
    expect(se4DocumentTitle?.compareDocumentPosition(se4Formula as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    const storySummary = document.querySelector("[data-storybook-summary='true']")

    expect(storySummary).toHaveTextContent("SmartEditor 4 / documentTitle")
    expect(screen.getByText("SmartEditor 4 / documentTitle")).toBeInTheDocument()
    expect(screen.queryByText(/path 0/)).toBeNull()
    expect(screen.getByText("Input HTML")).toBeInTheDocument()
    expect(screen.getByText("Source Capture")).toBeInTheDocument()
    expect(screen.getByText("Markdown")).toBeInTheDocument()
    expect(document.querySelector("[data-storybook-code='html']")).toBeInTheDocument()
    expect(document.querySelector("[data-storybook-markdown]")).toBeInTheDocument()
    expect(document.querySelector("[data-storybook-token]")).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it("toggles editor groups from the story tree", async () => {
    vi.stubGlobal("fetch", vi.fn())

    renderApp()

    const user = userEvent.setup()
    const smartEditor4 = await screen.findByRole("treeitem", { name: /SmartEditor 4/ })

    expect(smartEditor4).toHaveAttribute("aria-expanded", "true")

    await user.click(smartEditor4)

    expect(smartEditor4).toHaveAttribute("aria-expanded", "false")

    await user.click(smartEditor4)

    expect(smartEditor4).toHaveAttribute("aria-expanded", "true")
  })
})
