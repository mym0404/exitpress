// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import "@testing-library/jest-dom/vitest"

import {
  buildJsonResponse,
  completedJob,
  exportedOptions,
  getBootstrapResponse,
  moveToDiagnosticsStep,
  renderApp,
  runningJob,
  scanResult,
  testOutputDir,
  waitForAutosave,
} from "../../../tests/support/ui/AppSpecHarness.js"

describe("App workflow", () => {
  it("autosaves sanitized options and ignores blog, output, and category-only changes", async () => {
    const savedPayloads: Array<{
      options?: {
        scope?: {
          categoryIds?: number[]
        }
        structure?: {
          groupByCategory?: boolean
        }
      }
    }> = []

    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()

      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export-settings")) {
        savedPayloads.push(JSON.parse(String(init?.body ?? "{}")) as (typeof savedPayloads)[number])
        return new Response(null, {
          status: 204,
        })
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await waitForAutosave()
    expect(savedPayloads).toEqual([])

    await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "mym0404")
    await waitForAutosave()
    expect(savedPayloads).toEqual([])

    await user.clear(screen.getByRole("textbox", { name: /출력 경로/ }))
    await user.type(screen.getByRole("textbox", { name: /출력 경로/ }), "/tmp/custom-output")
    await waitForAutosave()
    expect(savedPayloads).toEqual([])

    await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
    })

    await waitForAutosave()
    expect(savedPayloads).toEqual([])

    await user.click(screen.getByRole("checkbox", { name: "전체 카테고리 선택" }))
    await user.click(screen.getByRole("checkbox", { name: /NestJS/ }))
    await waitForAutosave()
    expect(savedPayloads).toEqual([])

    await user.click(screen.getByRole("button", { name: "구조 설정" }))
    await user.click(screen.getByRole("checkbox", { name: /카테고리 폴더 유지/ }))

    await waitFor(() => {
      expect(savedPayloads).toHaveLength(1)
    })

    expect(savedPayloads[0]?.options?.scope?.categoryIds).toBeUndefined()
    expect(savedPayloads[0]?.options?.structure?.groupByCategory).toBe(false)
  })

  it("shows the output path input in the blog step and hides it in the structure step", async () => {
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

    expect(document.querySelector('[data-step-view="blog-input"] #outputDir')).not.toBeNull()

    await user.type(screen.getByLabelText("블로그 ID 또는 URL"), "mym0404")
    await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
    })

    await user.click(screen.getByRole("button", { name: "구조 설정" }))

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="structure-options"]')).not.toBeNull()
    })

    expect(document.querySelector('[data-step-view="structure-options"] #outputDir')).toBeNull()
  })

  it("restores the bootstrap output path when the field is left empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async (input) => {
        const url = typeof input === "string" ? input : input.toString()
        const bootstrapResponse = getBootstrapResponse(url)

        if (bootstrapResponse) {
          return bootstrapResponse
        }

        throw new Error(`unexpected fetch: ${url}`)
      }),
    )

    const user = renderApp()
    const outputDirInput = screen.getByRole("textbox", { name: /출력 경로/ })

    await user.clear(outputDirInput)
    fireEvent.blur(outputDirInput)

    expect(outputDirInput).toHaveValue(testOutputDir)
  })

  it("runs the main export flow in the wizard without preview or modal", async () => {
    const blockScanRequests: Array<{
      method: string | undefined
      payload: {
        blogIdOrUrl?: string
        scanResult?: unknown
        options?: {
          scope?: {
            categoryIds?: number[]
          }
        }
      }
    }> = []
    const expectedDetectedScanResult = {
      ...scanResult,
      detectedBlockTemplateKeys: ["naver-se4:image"],
      detectedBlockTemplateScopeSignature: JSON.stringify(exportedOptions.scope),
    }
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/scan-blocks/jobs")) {
        blockScanRequests.push({
          method: init?.method,
          payload: JSON.parse(
            String(init?.body ?? "{}"),
          ) as (typeof blockScanRequests)[number]["payload"],
        })
        return buildJsonResponse({ jobId: "block-scan-job" }, 202)
      }

      if (url.endsWith("/api/scan-blocks/jobs/block-scan-job")) {
        return buildJsonResponse({
          id: "block-scan-job",
          status: "completed",
          total: 5,
          completed: 5,
          failed: 0,
          detectedBlockTemplateKeys: ["naver-se4:image"],
          error: null,
        })
      }

      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        expect(init?.body).toBe(
          JSON.stringify({
            blogIdOrUrl: "mym0404",
            outputDir: testOutputDir,
            options: exportedOptions,
            scanResult: expectedDetectedScanResult,
          }),
        )
        return buildJsonResponse({ jobId: "job-1" }, init?.method === "POST" ? 202 : 200)
      }

      if (url.endsWith("/api/export/job-1")) {
        return buildJsonResponse(completedJob)
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

    expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
    expect(document.querySelector("#export-button")).toBeNull()

    await user.click(screen.getByRole("checkbox", { name: "전체 카테고리 선택" }))
    fireEvent.click(screen.getByRole("checkbox", { name: /NestJS/ }))
    await waitFor(() => {
      expect(document.querySelector("#selected-post-count")?.textContent).toContain(
        "대상 글 5개 / 전체 12개",
      )
      expect(document.querySelector("#summary")?.textContent).toContain("대상 글")
      expect(document.querySelector("#summary")?.textContent).toContain("5")
    })

    await user.click(screen.getByRole("button", { name: "구조 설정" }))
    expect(document.querySelector('[data-step-view="structure-options"]')).not.toBeNull()
    expect(blockScanRequests).toHaveLength(0)
    await user.click(screen.getByRole("button", { name: "Frontmatter 설정" }))
    expect(document.querySelector('[data-step-view="frontmatter-options"]')).not.toBeNull()
    expect(await screen.findByText("글 제목을 기록합니다.")).toBeInTheDocument()

    const titleAliasInput = screen.getByPlaceholderText("title")
    await user.clear(titleAliasInput)
    await user.type(titleAliasInput, "postTitle")

    await user.click(screen.getByRole("button", { name: "Assets 설정" }))
    expect(document.querySelector('[data-step-view="assets-options"]')).not.toBeNull()
    await user.click(screen.getByRole("button", { name: "Link 처리" }))
    expect(document.querySelector('[data-step-view="links-options"]')).not.toBeNull()
    await user.click(screen.getByRole("button", { name: "진단 설정" }))
    expect(document.querySelector('[data-step-view="diagnostics-options"]')).not.toBeNull()

    await user.click(screen.getByRole("button", { name: "내보내기" }))
    expect(document.querySelector('[data-step-view="block-scan"]')).not.toBeNull()
    expect(screen.getByText("Markdown 옵션 준비")).toBeInTheDocument()

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="markdown-review"]')).not.toBeNull()
    })
    expect(blockScanRequests).toHaveLength(1)
    expect(blockScanRequests[0]?.method).toBe("POST")
    expect(blockScanRequests[0]?.payload.blogIdOrUrl).toBe("mym0404")
    expect(blockScanRequests[0]?.payload.scanResult).toEqual(scanResult)
    expect(blockScanRequests[0]?.payload.options?.scope?.categoryIds).toEqual([101])
    expect(document.querySelector('[data-block-template-card="naver-se4:image"]')).not.toBeNull()
    expect(document.querySelector('[data-block-template-card="naver-se4:table"]')).toBeNull()

    await user.click(screen.getByRole("button", { name: "변환 시작" }))

    await waitFor(() => {
      expect(document.querySelector("#status-text")?.getAttribute("data-status")).toBe("completed")
      expect(document.querySelector('[data-step-view="result"]')).not.toBeNull()
      expect(document.querySelector("#summary")?.textContent).toContain("1")
    })

    expect(document.querySelector("#job-file-tree table")).not.toBeNull()
    expect(document.querySelector("[data-job-log-timestamp]")?.textContent).toBe(
      "2026-04-11T04:00:00.000Z",
    )
    expect(document.querySelector("[data-job-log-message]")?.textContent).toContain(
      "작업을 큐에 등록했습니다.",
    )
    expect(
      (document.querySelector('#logs [data-slot="scroll-area-viewport"]') as HTMLElement | null)
        ?.scrollTop,
    ).toBe(240)

    const errorFilterButton = document.querySelector(
      '[data-job-filter="failed"]',
    ) as HTMLButtonElement
    expect(errorFilterButton).not.toBeNull()
    await user.click(errorFilterButton)

    const allFilterButton = document.querySelector('[data-job-filter="all"]') as HTMLButtonElement
    expect(allFilterButton).not.toBeNull()
    await user.click(allFilterButton)
    const item = document.querySelector('[data-job-item-id="posts/NestJS/test.md"]') as HTMLElement
    expect(item).not.toBeNull()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it("starts export after block scan when no detected block output keys are available", async () => {
    let exportRequestCount = 0
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/scan-blocks/jobs")) {
        return buildJsonResponse({ jobId: "empty-block-scan-job" }, 202)
      }

      if (url.endsWith("/api/scan-blocks/jobs/empty-block-scan-job")) {
        return buildJsonResponse({
          id: "empty-block-scan-job",
          status: "completed",
          total: 5,
          completed: 5,
          failed: 0,
          detectedBlockTemplateKeys: [],
          error: null,
        })
      }

      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        exportRequestCount += 1
        return buildJsonResponse({ jobId: "job-empty" }, 202)
      }

      if (url.endsWith("/api/export/job-empty")) {
        return buildJsonResponse(completedJob)
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
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="structure-options"]')).not.toBeNull()
    })

    await user.click(screen.getByRole("button", { name: "Frontmatter 설정" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="frontmatter-options"]')).not.toBeNull()
    })

    await user.click(screen.getByRole("button", { name: "Assets 설정" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="assets-options"]')).not.toBeNull()
    })
    await user.click(screen.getByRole("button", { name: "Link 처리" }))
    await user.click(screen.getByRole("button", { name: "진단 설정" }))
    await user.click(screen.getByRole("button", { name: "내보내기" }))
    await waitFor(() => {
      expect(exportRequestCount).toBe(1)
    })
    expect(document.querySelector('[data-step-view="markdown-review"]')).toBeNull()
  })

  it("scrolls to the top when moving to the next setup step", async () => {
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
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
    })

    const scrollToSpy = vi.mocked(window.scrollTo)
    const scrollIntoViewSpy = vi.mocked(HTMLElement.prototype.scrollIntoView)

    scrollToSpy.mockClear()
    scrollIntoViewSpy.mockClear()

    await user.click(screen.getByRole("button", { name: "구조 설정" }))

    await waitFor(() => {
      expect(document.querySelector('[data-step-view="structure-options"]')).not.toBeNull()
    })

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "smooth",
    })
    expect(scrollIntoViewSpy).toHaveBeenCalled()
  })

  it("reuses cached categories by default and forces a fresh scan when requested", async () => {
    let scanRequestCount = 0
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : input.toString()
      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        scanRequestCount += 1
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

    expect(scanRequestCount).toBe(1)

    await user.click(screen.getByRole("button", { name: "이전" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="blog-input"]')).not.toBeNull()
    })
    expect(screen.getByRole("button", { name: "강제로 불러오기" })).toHaveAttribute(
      "title",
      "캐시 무효화",
    )

    await user.click(screen.getByRole("button", { name: "카테고리 불러오기" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
    })
    expect(scanRequestCount).toBe(1)

    await user.click(screen.getByRole("button", { name: "이전" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="blog-input"]')).not.toBeNull()
    })

    await user.click(screen.getByRole("button", { name: "강제로 불러오기" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="category-selection"]')).not.toBeNull()
    })
    expect(scanRequestCount).toBe(2)
  })

  it("hides setup panels while the export job is running", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()

      if (url.endsWith("/api/scan-blocks/jobs")) {
        return buildJsonResponse({ jobId: "block-scan-job" }, 202)
      }

      if (url.endsWith("/api/scan-blocks/jobs/block-scan-job")) {
        return buildJsonResponse({
          id: "block-scan-job",
          status: "completed",
          total: 5,
          completed: 5,
          failed: 0,
          detectedBlockTemplateKeys: ["naver-se4:image"],
          error: null,
        })
      }

      const bootstrapResponse = getBootstrapResponse(url)

      if (bootstrapResponse) {
        return bootstrapResponse
      }

      if (url.endsWith("/api/scan")) {
        return buildJsonResponse(scanResult)
      }

      if (url.endsWith("/api/export")) {
        return buildJsonResponse({ jobId: "job-1" }, init?.method === "POST" ? 202 : 200)
      }

      if (url.endsWith("/api/export/job-1")) {
        return buildJsonResponse(runningJob)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)

    const user = renderApp()

    await moveToDiagnosticsStep(user)
    await user.click(screen.getByRole("button", { name: "내보내기" }))
    await waitFor(() => {
      expect(document.querySelector('[data-step-view="markdown-review"]')).not.toBeNull()
    })
    await user.click(screen.getByRole("button", { name: "변환 시작" }))

    await waitFor(() => {
      expect(document.querySelector("#status-text")?.getAttribute("data-status")).toBe("running")
      expect(document.querySelector('[data-step-view="running"]')).not.toBeNull()
      expect(document.querySelector("#running-progress")).not.toBeNull()
      expect(document.querySelector("#running-progress")?.getAttribute("aria-valuenow")).toBe("40")
      expect(document.querySelector("#job-file-tree table")).not.toBeNull()
      expect(document.querySelector("#job-file-tree")?.textContent).toContain("NestJS")
      expect(document.querySelector("#job-file-tree")?.textContent).toContain("test.md")
      expect(document.querySelector("#job-file-tree")?.textContent).toContain("업로드 상태")
      expect(screen.queryByLabelText("블로그 ID 또는 URL")).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "카테고리 불러오기" })).not.toBeInTheDocument()
      expect(document.querySelector("#export-button")).toBeNull()
      expect(document.querySelector("#category-panel")).toBeNull()
      expect(document.querySelector("#export-panel")).toBeNull()
    })
  })
})
