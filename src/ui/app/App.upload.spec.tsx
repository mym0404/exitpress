// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ExportJobState } from "../../domain/export-job/Types.js"

import "@testing-library/jest-dom/vitest"

import {
  buildJsonResponse,
  defaultExportOptions,
  frontmatterFieldMeta,
  frontmatterFieldOrder,
  getBootstrapResponse,
  moveToDiagnosticsStep,
  optionDescriptions,
  renderApp,
  rewritePendingJob,
  scanResult,
  selectOption,
  skippedUploadJob,
  testOutputDir,
  uploadCompletedJob,
  uploadFailedJob,
  uploadingJob,
  uploadReadyJob,
} from "../../../tests/support/ui/AppSpecHarness.js"

describe("App upload", () => {
  it("submits structured provider fields from the upload step and returns to results", async () => {
    let uploadPollCount = 0
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        return buildJsonResponse({ jobId: "job-upload" }, init?.method === "POST" ? 202 : 200)
      }

      if (url.endsWith("/api/export/job-upload/upload")) {
        expect(init?.headers).toMatchObject({
          "x-requested-with": "XMLHttpRequest",
        })
        expect(JSON.parse(String(init?.body))).toEqual({
          providerKey: "github",
          providerFields: {
            branch: "main",
            customUrl: "https://cdn.jsdelivr.net/gh/owner/name@main",
            repo: "owner/name",
            token: "ghp_upload_secret",
          },
        })
        return buildJsonResponse({ jobId: "job-upload", status: "uploading" }, 202)
      }

      if (url.endsWith("/api/export/job-upload")) {
        uploadPollCount += 1

        if (uploadPollCount <= 2) {
          return buildJsonResponse(uploadReadyJob)
        }

        if (uploadPollCount <= 5) {
          return buildJsonResponse(uploadingJob)
        }

        return buildJsonResponse(uploadCompletedJob)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()
    let jsDelivrToggle: HTMLElement | null = null

    await moveToDiagnosticsStep(user)
    await user.click(screen.getByRole("button", { name: "내보내기" }))

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="upload"]')).not.toBeNull()
      expect(document.querySelector("#upload-targets-table")).toBeNull()
      expect(document.querySelector("#upload-progress")?.getAttribute("aria-valuenow")).toBe("0")
      expect(
        document
          .querySelector('#job-file-tree [data-upload-row-id="NestJS/2026-04-11-1/index.md"]')
          ?.getAttribute("data-upload-row-status"),
      ).toBe("pending")
      expect(
        document
          .querySelector('#job-file-tree [data-upload-row-id="React/2026-04-12-2/index.md"]')
          ?.getAttribute("data-upload-row-status"),
      ).toBe("pending")
      expect(document.querySelector("#upload-form")).not.toBeNull()
      expect(document.querySelector("#upload-providerKey")).not.toBeNull()
      expect(screen.getByLabelText(/^Repository\b/)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Branch\b/)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Token\b/)).toBeInTheDocument()
      jsDelivrToggle = screen.getByRole("checkbox", { name: /jsDelivr CDN 사용/i })
      expect(jsDelivrToggle).not.toBeChecked()
      expect(document.querySelector("#job-file-tree")).not.toBeNull()
      expect(document.querySelector("#job-file-tree")?.textContent).toContain("NestJS")
      expect(document.querySelector("#job-file-tree")?.textContent).toContain("2026-04-11-1")
      expect(document.querySelector("#job-file-tree")?.textContent).toContain("업로드 상태")
    })

    fireEvent.change(screen.getByLabelText(/^Repository\b/), {
      target: { value: "owner/name" },
    })
    fireEvent.change(screen.getByLabelText(/^Branch\b/), {
      target: { value: "main" },
    })
    fireEvent.change(screen.getByLabelText(/^Token\b/), {
      target: { value: "ghp_upload_secret" },
    })
    fireEvent.change(screen.getByLabelText(/^Custom URL\b/), {
      target: { value: "https://raw.example.com" },
    })
    expect(jsDelivrToggle).not.toBeNull()

    if (!jsDelivrToggle) {
      throw new Error("jsDelivr toggle not found")
    }

    await user.click(jsDelivrToggle)
    expect(screen.getByLabelText(/^Custom URL\b/)).toBeDisabled()
    expect(screen.getByLabelText(/^Custom URL\b/)).toHaveValue("https://raw.example.com")
    expect(
      (document.querySelector("#upload-github-jsdelivr-preview") as HTMLInputElement | null)?.value,
    ).toBe("https://cdn.jsdelivr.net/gh/owner/name@main")
    await user.click(screen.getByRole("button", { name: "업로드 시작" }))

    await waitFor(
      () => {
        expect(
          ["uploading", "upload-completed"].some((status) =>
            document.querySelector("#status-text")?.textContent?.includes(status),
          ),
        ).toBe(true)
        expect(document.querySelector("#upload-form")).toBeNull()
      },
      { timeout: 7000 },
    )

    await waitFor(
      () => {
        const firstUploadRow = document.querySelector(
          '#job-file-tree [data-upload-row-id="NestJS/2026-04-11-1/index.md"]',
        )
        const secondUploadRow = document.querySelector(
          '#job-file-tree [data-upload-row-id="React/2026-04-12-2/index.md"]',
        )

        expect(document.querySelector("#status-text")?.textContent).toContain("upload-completed")
        expect(document.querySelector('[data-step-view="result"]')).not.toBeNull()
        expect(document.querySelector("#upload-targets-table")).toBeNull()
        expect(document.querySelector("#upload-progress")?.getAttribute("aria-valuenow")).toBe(
          "100",
        )
        expect(firstUploadRow?.getAttribute("data-upload-row-status")).toBe("complete")
        expect(secondUploadRow?.getAttribute("data-upload-row-status")).toBe("complete")
        expect(firstUploadRow?.textContent).toContain("#1")
        expect(firstUploadRow?.textContent).toContain("#2")
        expect(secondUploadRow?.textContent).toContain("#1")
        expect(secondUploadRow?.textContent).toContain("#2")
        expect(firstUploadRow?.querySelectorAll("a")).toHaveLength(2)
        expect(secondUploadRow?.querySelectorAll("a")).toHaveLength(2)
        expect(
          document.querySelector('[data-job-item-id="NestJS/2026-04-11-1/index.md"]')?.textContent,
        ).toContain("2026-04-11-1")
        expect(document.querySelector("#job-file-tree")?.textContent).toContain("NestJS")
        expect(document.querySelector("#job-file-tree")?.textContent).toContain("2026-04-11-1")
      },
      { timeout: 7000 },
    )
  }, 10000)

  it("keeps provider-specific values when switching upload providers", async () => {
    let jobFetchCount = 0
    const providerSwitchReadyJob: ExportJobState = {
      ...uploadReadyJob,
      id: "job-provider-switch",
    }
    const providerSwitchCompletedJob: ExportJobState = {
      ...uploadCompletedJob,
      id: "job-provider-switch",
    }
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        return buildJsonResponse(
          { jobId: "job-provider-switch" },
          init?.method === "POST" ? 202 : 200,
        )
      }

      if (url.endsWith("/api/export/job-provider-switch/upload")) {
        expect(JSON.parse(String(init?.body))).toEqual({
          providerKey: "tcyun",
          providerFields: {
            appId: "app-123",
            permission: 1,
            port: 2443,
            slim: true,
          },
        })

        return buildJsonResponse({ jobId: "job-provider-switch", status: "uploading" }, 202)
      }

      if (url.endsWith("/api/export/job-provider-switch")) {
        jobFetchCount += 1

        return buildJsonResponse(
          jobFetchCount <= 2 ? providerSwitchReadyJob : providerSwitchCompletedJob,
        )
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await moveToDiagnosticsStep(user)
    await user.click(screen.getByRole("button", { name: "내보내기" }))

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="upload"]')).not.toBeNull()
      expect(screen.getByLabelText(/^Repository\b/)).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/^Repository\b/), "owner/name")
    await user.click(screen.getByRole("checkbox", { name: /jsDelivr CDN 사용/i }))
    await selectOption({
      user,
      trigger: document.querySelector("#upload-providerKey") as HTMLElement,
      value: "tcyun",
    })

    await waitFor(() => {
      expect(screen.queryByLabelText(/^Repository\b/)).toBeNull()
      expect(screen.getByLabelText(/^App ID\b/)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Permission\b/)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Port\b/)).toBeInTheDocument()
      expect(screen.getByRole("checkbox", { name: /Slim/i })).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/^Permission\b/)).toHaveAttribute("data-value", "0")
    await user.type(screen.getByLabelText(/^App ID\b/), "app-123")
    await selectOption({
      user,
      trigger: screen.getByLabelText(/^Permission\b/),
      value: "1",
    })
    await user.clear(screen.getByLabelText(/^Port\b/))
    await user.type(screen.getByLabelText(/^Port\b/), "2443")
    await user.click(screen.getByRole("checkbox", { name: /Slim/i }))

    await selectOption({
      user,
      trigger: document.querySelector("#upload-providerKey") as HTMLElement,
      value: "github",
    })
    expect(screen.getByLabelText(/^Repository\b/)).toHaveValue("owner/name")
    expect(screen.getByRole("checkbox", { name: /jsDelivr CDN 사용/i })).toBeChecked()

    await selectOption({
      user,
      trigger: document.querySelector("#upload-providerKey") as HTMLElement,
      value: "tcyun",
    })
    expect(screen.getByLabelText(/^App ID\b/)).toHaveValue("app-123")
    expect(screen.getByLabelText(/^Permission\b/)).toHaveAttribute("data-value", "1")
    expect(screen.getByLabelText(/^Port\b/)).toHaveValue(2443)
    expect(screen.getByRole("checkbox", { name: /Slim/i })).toBeChecked()

    await user.click(screen.getByRole("button", { name: "업로드 시작" }))

    await waitFor(
      () => {
        expect(document.querySelector("#status-text")?.textContent).toContain("upload-completed")
        expect(document.querySelector('[data-step-view="result"]')).not.toBeNull()
      },
      { timeout: 7000 },
    )
  }, 10000)

  it("loads upload providers only when needed and hides internal runtime errors", async () => {
    let uploadProviderRequestCount = 0
    let jobFetchCount = 0
    const uploadErrorReadyJob: ExportJobState = {
      ...uploadReadyJob,
      id: "job-upload-error",
    }
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/export-defaults")) {
        return buildJsonResponse({
          profile: "gfm",
          options: defaultExportOptions(),
          lastOutputDir: testOutputDir,
          resumedJob: null,
          resumeSummary: null,
          resumedScanResult: null,
          frontmatterFieldOrder,
          frontmatterFieldMeta,
          optionDescriptions,
        })
      }

      if (url.endsWith("/api/upload-providers")) {
        uploadProviderRequestCount += 1
        return buildJsonResponse(
          {
            error: "runtime bootstrap failed",
          },
          503,
        )
      }

      if (url.endsWith("/api/export-resume/lookup")) {
        return buildJsonResponse({
          resumedJob: null,
          resumeSummary: null,
          resumedScanResult: null,
        })
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        return buildJsonResponse({ jobId: "job-upload-error" }, init?.method === "POST" ? 202 : 200)
      }

      if (url.endsWith("/api/export/job-upload-error")) {
        jobFetchCount += 1
        return buildJsonResponse(uploadErrorReadyJob)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await moveToDiagnosticsStep(user)
    expect(uploadProviderRequestCount).toBe(0)

    await user.click(screen.getByRole("button", { name: "내보내기" }))

    await waitFor(() => {
      expect(jobFetchCount).toBeGreaterThan(0)
      expect(document.querySelector('[data-step-view="upload"]')).not.toBeNull()
      expect(screen.getByText("업로드 설정을 불러오지 못했습니다.")).toBeInTheDocument()
    })

    expect(uploadProviderRequestCount).toBe(1)
    expect(screen.queryByText("runtime bootstrap failed")).toBeNull()
  })

  it("keeps the same job editable after upload failure and allows retry with corrected fields", async () => {
    let uploadAttempt = 0
    let jobFetchCount = 0
    const retryReadyJob: ExportJobState = {
      ...uploadReadyJob,
      id: "job-failed",
    }
    const retryFailedJob: ExportJobState = {
      ...uploadFailedJob,
      id: "job-failed",
    }
    const retryCompletedJob: ExportJobState = {
      ...uploadCompletedJob,
      id: "job-failed",
    }
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        return buildJsonResponse({ jobId: "job-failed" }, init?.method === "POST" ? 202 : 200)
      }

      if (url.endsWith("/api/export/job-failed/upload")) {
        uploadAttempt += 1
        jobFetchCount = 0
        const body = JSON.parse(String(init?.body)) as {
          providerKey: string
          providerFields: Record<string, string>
        }

        expect(body.providerKey).toBe("github")

        if (uploadAttempt === 1) {
          expect(body.providerFields).toEqual({
            repo: "owner/name",
            token: "ghp_bad_secret",
          })
          return buildJsonResponse({ jobId: "job-failed", status: "uploading" }, 202)
        }

        expect(body.providerFields).toEqual({
          repo: "owner/name",
          token: "ghp_fixed_secret",
        })
        return buildJsonResponse({ jobId: "job-failed", status: "uploading" }, 202)
      }

      if (url.endsWith("/api/export/job-failed")) {
        jobFetchCount += 1

        if (uploadAttempt === 0) {
          return buildJsonResponse(retryReadyJob)
        }

        if (uploadAttempt === 1) {
          return buildJsonResponse(retryFailedJob)
        }

        return buildJsonResponse(retryCompletedJob)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await moveToDiagnosticsStep(user)
    await user.click(screen.getByRole("button", { name: "내보내기" }))

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="upload"]')).not.toBeNull()
      expect(screen.getByLabelText(/^Repository\b/)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Token\b/)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/^Repository\b/), {
      target: { value: "owner/name" },
    })
    fireEvent.change(screen.getByLabelText(/^Token\b/), {
      target: { value: "ghp_bad_secret" },
    })
    await user.click(screen.getByRole("button", { name: "업로드 시작" }))

    await waitFor(() => {
      expect(document.querySelector("#status-text")?.textContent).toContain("upload-failed")
      expect(screen.getByText("Image upload failed.")).toBeInTheDocument()
      expect(document.querySelector("#upload-form")).not.toBeNull()
      expect(document.querySelector("#upload-progress")?.getAttribute("aria-valuenow")).toBe("75")
      expect(
        document
          .querySelector('#job-file-tree [data-upload-row-id="NestJS/2026-04-11-1/index.md"]')
          ?.getAttribute("data-upload-row-status"),
      ).toBe("failed")
      expect(
        document
          .querySelector('#job-file-tree [data-upload-row-id="React/2026-04-12-2/index.md"]')
          ?.getAttribute("data-upload-row-status"),
      ).toBe("failed")
      expect(document.querySelector("#upload-providerKey")).not.toBeNull()
      expect(screen.getByLabelText(/^Repository\b/)).toHaveValue("owner/name")
      expect(screen.getByLabelText(/^Token\b/)).toHaveValue("ghp_bad_secret")
    })

    await user.clear(screen.getByLabelText(/^Token\b/))
    await user.type(screen.getByLabelText(/^Token\b/), "ghp_fixed_secret")
    await user.click(screen.getByRole("button", { name: "업로드 시작" }))

    await waitFor(() => {
      expect(uploadAttempt).toBe(2)
    })
  }, 12000)

  it("shows rewrite-pending copy when the upload bar is full but completion is not final yet", async () => {
    let jobFetchCount = 0
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        return buildJsonResponse(
          { jobId: "job-rewrite-pending" },
          init?.method === "POST" ? 202 : 200,
        )
      }

      if (url.endsWith("/api/export/job-rewrite-pending/upload")) {
        return buildJsonResponse({ jobId: "job-rewrite-pending", status: "uploading" }, 202)
      }

      if (url.endsWith("/api/export/job-rewrite-pending")) {
        jobFetchCount += 1

        if (jobFetchCount <= 2) {
          return buildJsonResponse(uploadReadyJob)
        }

        if (jobFetchCount <= 6) {
          return buildJsonResponse(rewritePendingJob)
        }

        return buildJsonResponse(uploadCompletedJob)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await moveToDiagnosticsStep(user)
    await user.click(screen.getByRole("button", { name: "내보내기" }))

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="upload"]')).not.toBeNull()
      expect(document.querySelector("#upload-form")).not.toBeNull()
    })

    fireEvent.change(screen.getByLabelText(/^Repository\b/), {
      target: { value: "owner/name" },
    })
    fireEvent.change(screen.getByLabelText(/^Token\b/), {
      target: { value: "ghp_upload_secret" },
    })
    await user.click(screen.getByRole("button", { name: "업로드 시작" }))

    await waitFor(() => {
      expect(document.querySelector("#status-text")?.textContent).toContain("uploading")
      expect(document.querySelector("#upload-progress")?.getAttribute("aria-valuenow")).toBe("100")
      expect(document.querySelector("#upload-form")).toBeNull()
    })
  })

  it("hides the upload form when the export completed with skipped-no-candidates", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        return buildJsonResponse({ jobId: "job-skipped" }, init?.method === "POST" ? 202 : 200)
      }

      if (url.endsWith("/api/export/job-skipped")) {
        return buildJsonResponse(skippedUploadJob)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await moveToDiagnosticsStep(user)
    await user.click(screen.getByRole("button", { name: "내보내기" }))

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="result"]')).not.toBeNull()
      expect(
        screen.getByText("업로드할 로컬 이미지가 없어 내보내기만 완료되었습니다."),
      ).toBeInTheDocument()
    })
    expect(document.querySelector("#upload-providerKey")).toBeNull()
    expect(screen.queryByLabelText(/^Repository\b/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Token\b/)).not.toBeInTheDocument()
  })
})
