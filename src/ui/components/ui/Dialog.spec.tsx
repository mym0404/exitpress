// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen, within } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog.js"

afterEach(() => {
  cleanup()
})

describe("Dialog", () => {
  it("renders dialog primitives with close controls", async () => {
    const user = userEvent.setup()

    const { container } = render(
      <Dialog open>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <DialogClose asChild>
              <button type="button">Custom close</button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getByText("Dialog title")).toBeInTheDocument()
    expect(screen.getByText("Dialog description")).toBeInTheDocument()
    expect(container.querySelector('[data-slot="dialog-trigger"]')).toHaveAttribute(
      "data-slot",
      "dialog-trigger",
    )

    await user.click(screen.getByRole("button", { name: "Custom close" }))
  })

  it("renders dialog content without the default close button when requested", () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>No close</DialogTitle>
            <DialogDescription>Dialog without close</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    )

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).queryByRole("button", { name: "Close" })).not.toBeInTheDocument()
  })
})
