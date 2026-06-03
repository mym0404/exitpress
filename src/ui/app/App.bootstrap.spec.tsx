// @vitest-environment jsdom

import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ExportJobState } from "../../domain/export-job/Types.js"

import "@testing-library/jest-dom/vitest"

import {
  buildJsonResponse,
  completedJob,
  defaultExportOptions,
  frontmatterFieldMeta,
  frontmatterFieldOrder,
  getBootstrapResponse,
  optionDescriptions,
  renderApp,
  runningJob,
  scanResult,
  testOutputDir,
  testResumeOutputDir,
  uploadProviderCatalog,
} from "../../../tests/support/ui/AppSpecHarness.js"

describe("App bootstrap", () => {
  it("restores persisted options from the bootstrap response", async () => {
    const persistedOptions = defaultExportOptions()
    persistedOptions.structure.groupByCategory = false
    persistedOptions.frontmatter.aliases.title = "postTitle"

    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/export-defaults")) {
        return buildJsonResponse({
          profile: "gfm",
          options: persistedOptions,
          lastOutputDir: testOutputDir,
          resumedJob: null,
          resumeSummary: null,
          resumedScanResult: null,
          frontmatterFieldOrder,
          frontmatterFieldMeta,
          optionDescriptions,
        })
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

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "mym0404")
    await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
    })

    await user.click(screen.getByRole("button", { name: "구조 설정" }))
    expect(screen.getByRole("checkbox", { name: /카테고리 폴더 유지/ })).not.toBeChecked()

    await user.click(screen.getByRole("button", { name: "Frontmatter 설정" }))
    expect(screen.getByPlaceholderText("title")).toHaveValue("postTitle")
  })

  it("shows a bootstrap loading state before deciding whether to resume", async () => {
    const bootstrapRequest = {
      resolve: null as ((value: Response) => void) | null,
    }

    const fetchMock = vi.fn<typeof fetch>((input) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/export-defaults")) {
        return new Promise<Response>((resolve) => {
          bootstrapRequest.resolve = resolve
        })
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    renderApp()

    expect(screen.getByRole("status")).toHaveTextContent("작업 상태를 확인하는 중입니다.")
    expect(
      screen.getByText("이전 작업을 다시 불러올지, 새로 시작할지 확인하고 있습니다."),
    ).toBeInTheDocument()
    expect(document.querySelector('[data-step-view="bootstrap-loading"]')).not.toBeNull()
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true")

    await waitFor(() => {
      expect(bootstrapRequest.resolve).not.toBeNull()
    })

    if (!bootstrapRequest.resolve) {
      throw new Error("bootstrap response resolver was not captured")
    }

    bootstrapRequest.resolve(
      buildJsonResponse({
        profile: "gfm",
        options: defaultExportOptions(),
        lastOutputDir: testOutputDir,
        resumedJob: null,
        resumeSummary: null,
        resumedScanResult: null,
        frontmatterFieldOrder,
        frontmatterFieldMeta,
        optionDescriptions,
      }),
    )

    expect(await screen.findByLabelText("블로그 ID 또는 URL")).toBeInTheDocument()
  })

  it("renders the category table without separate path and depth columns", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "mym0404")
    await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))

    const table = await screen.findByRole("table")

    expect(within(table).getByRole("columnheader", { name: "선택" })).toBeInTheDocument()
    expect(within(table).getByRole("columnheader", { name: "카테고리" })).toBeInTheDocument()
    expect(within(table).getByRole("columnheader", { name: "글 수" })).toBeInTheDocument()
    expect(within(table).queryByRole("columnheader", { name: "경로" })).not.toBeInTheDocument()
    expect(within(table).queryByRole("columnheader", { name: "깊이" })).not.toBeInTheDocument()
  })

  it("marks the blog input and status copy as errors when the scan request fails", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse({ error: "API 요청 실패: 404 Not Found" }, 404)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "23213213213")
    await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))

    await waitFor(() => {
      expect(document.querySelector("#scan-status")?.textContent).toContain(
        "API 요청 실패: 404 Not Found",
      )
    })

    expect(screen.getByLabelText("블로그 ID 또는 URL")).toHaveAttribute("aria-invalid", "true")
    expect(document.querySelector('[data-step-view="blog-input"]')).not.toBeNull()
  })

  it("opens a resume dialog and restores the last running step from bootstrap", async () => {
    const resumedJob: ExportJobState = {
      ...completedJob,
      id: "job-resumed",
      status: "running",
      resumeAvailable: true,
      finishedAt: null,
      request: {
        ...completedJob.request,
        outputDir: testResumeOutputDir,
      },
      progress: {
        total: 12,
        completed: 5,
        failed: 1,
      },
    }

    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/export-defaults")) {
        return buildJsonResponse({
          profile: "gfm",
          options: defaultExportOptions(),
          lastOutputDir: testResumeOutputDir,
          resumedJob,
          resumeSummary: {
            status: "running",
            outputDir: testResumeOutputDir,
            totalPosts: 12,
            completedCount: 5,
            failedCount: 1,
            uploadCandidateCount: 0,
            uploadedCount: 0,
          },
          resumedScanResult: scanResult,
          frontmatterFieldOrder,
          frontmatterFieldMeta,
          optionDescriptions,
        })
      }

      if (url.endsWith("/api/upload-providers")) {
        return buildJsonResponse(uploadProviderCatalog)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("이전 작업을 다시 불러왔습니다.")).toBeInTheDocument()
    expect(
      within(dialog).getByText((_, element) => element?.textContent === "상태 running"),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        (_, element) => element?.textContent === `출력 경로 ${testResumeOutputDir}`,
      ),
    ).toBeInTheDocument()
    expect(document.querySelector('[data-step-view="running"]')).not.toBeNull()
    expect(within(dialog).queryByRole("button", { name: "닫기" })).toBeNull()
    await user.click(within(dialog).getByRole("button", { name: "불러오기" }))
    expect(screen.getByRole("button", { name: "남은 작업 계속" })).toBeInTheDocument()
  })

  it("resets the resumed output from the dialog", async () => {
    const resumedJob: ExportJobState = {
      ...completedJob,
      id: "job-reset",
      status: "running",
      resumeAvailable: true,
      finishedAt: null,
      request: {
        ...completedJob.request,
        outputDir: testResumeOutputDir,
      },
      progress: {
        total: 12,
        completed: 5,
        failed: 1,
      },
    }

    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/export-defaults")) {
        return buildJsonResponse({
          profile: "gfm",
          options: defaultExportOptions(),
          lastOutputDir: testResumeOutputDir,
          resumedJob,
          resumeSummary: {
            status: "running",
            outputDir: testResumeOutputDir,
            totalPosts: 12,
            completedCount: 5,
            failedCount: 1,
            uploadCandidateCount: 0,
            uploadedCount: 0,
          },
          resumedScanResult: scanResult,
          frontmatterFieldOrder,
          frontmatterFieldMeta,
          optionDescriptions,
        })
      }

      if (url.endsWith("/api/export-reset")) {
        expect(init?.method).toBe("POST")
        expect(init?.body).toBe(
          JSON.stringify({
            outputDir: testResumeOutputDir,
            jobId: "job-reset",
          }),
        )

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

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "작업 초기화" }))

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeNull()
      expect(document.querySelector('[data-step-view="blog-input"]')).not.toBeNull()
    })

    expect(screen.getByLabelText("블로그 ID 또는 URL")).toHaveValue("")
    expect(screen.queryByRole("button", { name: "남은 작업 계속" })).not.toBeInTheDocument()
  })

  it("asks whether to restore a resumable path before scanning categories", async () => {
    const resumedJob: ExportJobState = {
      ...runningJob,
      id: "job-existing-output",
      resumeAvailable: true,
      request: {
        ...runningJob.request,
        outputDir: testResumeOutputDir,
      },
    }

    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/export-resume/lookup")) {
        expect(init?.method).toBe("POST")
        expect(init?.body).toBe(JSON.stringify({ outputDir: testResumeOutputDir }))
        return buildJsonResponse({
          resumedJob,
          resumeSummary: {
            status: "running",
            outputDir: testResumeOutputDir,
            totalPosts: 5,
            completedCount: 2,
            failedCount: 0,
            uploadCandidateCount: 0,
            uploadedCount: 0,
          },
          resumedScanResult: scanResult,
        })
      }

      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/export-resume/restore")) {
        expect(init?.method).toBe("POST")
        expect(init?.body).toBe(JSON.stringify({ outputDir: testResumeOutputDir }))
        return buildJsonResponse({
          resumedJob,
          resumeSummary: {
            status: "running",
            outputDir: testResumeOutputDir,
            totalPosts: 5,
            completedCount: 2,
            failedCount: 0,
            uploadCandidateCount: 0,
            uploadedCount: 0,
          },
          resumedScanResult: scanResult,
        })
      }

      if (url.endsWith("/api/scan")) {
        throw new Error("scan should not start before the user chooses")
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "mym0404")
    await user.clear(screen.getByRole("textbox", { name: /출력 경로/ }))
    await user.type(screen.getByRole("textbox", { name: /출력 경로/ }), testResumeOutputDir)
    await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("진행 중인 작업이 있습니다.")).toBeInTheDocument()
    expect(within(dialog).queryByRole("button", { name: "닫기" })).toBeNull()

    await user.click(within(dialog).getByRole("button", { name: "불러오기" }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "남은 작업 계속" })).toBeInTheDocument()
    })
  })

  it("resets a resumable path and continues category scan from the first screen", async () => {
    const resumedJob: ExportJobState = {
      ...runningJob,
      id: "job-existing-output",
      resumeAvailable: true,
      request: {
        ...runningJob.request,
        outputDir: testResumeOutputDir,
      },
    }

    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/export-resume/lookup")) {
        return buildJsonResponse({
          resumedJob,
          resumeSummary: {
            status: "running",
            outputDir: testResumeOutputDir,
            totalPosts: 5,
            completedCount: 2,
            failedCount: 0,
            uploadCandidateCount: 0,
            uploadedCount: 0,
          },
          resumedScanResult: scanResult,
        })
      }

      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/export-reset")) {
        expect(init?.method).toBe("POST")
        expect(init?.body).toBe(
          JSON.stringify({
            outputDir: testResumeOutputDir,
            jobId: "job-existing-output",
          }),
        )

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

      if (url.endsWith("/api/scan")) {
        expect(init?.method).toBe("POST")
        return buildJsonResponse(scanResult)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "mym0404")
    await user.clear(screen.getByRole("textbox", { name: /출력 경로/ }))
    await user.type(screen.getByRole("textbox", { name: /출력 경로/ }), testResumeOutputDir)
    await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))

    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "작업 초기화" }))

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
    })
  })

  it("warns before leaving the page when the user has started entering values", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "mym0404")

    const event = new Event("beforeunload", { cancelable: true }) as BeforeUnloadEvent
    Object.defineProperty(event, "returnValue", {
      configurable: true,
      writable: true,
      value: undefined,
    })

    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(event.returnValue).toBe("")
  })
})
