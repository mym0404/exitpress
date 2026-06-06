// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs.js"

afterEach(() => {
  cleanup()
})

describe("Tabs", () => {
  it("renders tablist variant and selected content", () => {
    render(
      <Tabs defaultValue="preview">
        <TabsList variant="line">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">Preview panel</TabsContent>
        <TabsContent value="raw">Raw panel</TabsContent>
      </Tabs>,
    )

    expect(screen.getByRole("tablist")).toHaveAttribute("data-variant", "line")
    expect(screen.getByRole("tabpanel", { name: "Preview" })).toHaveTextContent("Preview panel")
  })
})
