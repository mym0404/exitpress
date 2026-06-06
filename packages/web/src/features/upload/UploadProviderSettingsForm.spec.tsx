// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { UploadProviderCatalogResponse } from "@exitpress/domain/upload/schema/UploadProvider.js"

import { UploadProviderSettingsForm } from "./UploadProviderSettingsForm.js"

const uploadProviders: UploadProviderCatalogResponse = {
  defaultProviderKey: "github",
  providers: [
    {
      key: "github",
      label: "GitHub",
      description: "GitHub provider",
      fields: [
        {
          key: "repo",
          label: "Repo",
          description: "Repository",
          inputType: "text",
          required: true,
          defaultValue: null,
          placeholder: "owner/repo",
        },
      ],
    },
  ],
}

describe("UploadProviderSettingsForm", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it("uses the latest provider fields for changes and test upload", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onTestUpload = vi.fn()

    render(
      <UploadProviderSettingsForm
        resetKey="job-1"
        uploadProviders={uploadProviders}
        testUploadSubmitting={false}
        testUploadResult={null}
        testUploadError={null}
        onChange={onChange}
        onTestUpload={onTestUpload}
      />,
    )

    const testUploadButton = screen.getByRole("button", { name: "테스트 업로드" })
    expect(testUploadButton).toBeDisabled()

    await user.type(screen.getByLabelText("Repo"), "owner/repo")

    expect(onChange).toHaveBeenLastCalledWith({
      providerKey: "github",
      providerFields: { repo: "owner/repo" },
    })
    expect(testUploadButton).toBeEnabled()

    await user.click(testUploadButton)

    expect(onTestUpload).toHaveBeenCalledWith({
      providerKey: "github",
      providerFields: { repo: "owner/repo" },
    })
  })

  it("reports readiness from required provider fields and reset state", async () => {
    const user = userEvent.setup()
    const onReadyChange = vi.fn()
    const { rerender } = render(
      <UploadProviderSettingsForm
        resetKey="job-1"
        uploadProviders={uploadProviders}
        testUploadSubmitting={false}
        testUploadResult={null}
        testUploadError={null}
        onChange={vi.fn()}
        onReadyChange={onReadyChange}
        onTestUpload={vi.fn()}
      />,
    )

    expect(onReadyChange).toHaveBeenLastCalledWith(false)

    await user.type(screen.getByLabelText("Repo"), "owner/repo")

    await waitFor(() => {
      expect(onReadyChange).toHaveBeenLastCalledWith(true)
    })

    rerender(
      <UploadProviderSettingsForm
        resetKey="job-2"
        uploadProviders={uploadProviders}
        testUploadSubmitting={false}
        testUploadResult={null}
        testUploadError={null}
        onChange={vi.fn()}
        onReadyChange={onReadyChange}
        onTestUpload={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(onReadyChange).toHaveBeenLastCalledWith(false)
    })
  })
})
