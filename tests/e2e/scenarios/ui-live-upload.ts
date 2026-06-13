import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { createHttpServer } from "@exitpress/server/http/HttpServer.js"
import { config as loadDotEnv } from "dotenv"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportJobState } from "@exitpress/domain/export-job/schema/ExportJobState.js"
import type { PostManifestEntry } from "@exitpress/domain/export-job/schema/ExportManifest.js"
import type { Browser } from "playwright"

import { createTestTempDir } from "../../support/test-paths.js"

const sourceId = "mym0404"
const targetPostId = "222990202785"
const uploadRepo = "mym0404/ia2"
const uploadBranch = "main"
const uploadPath = `exitpress-live/${Date.now()}`
const responseTimeoutMs = 45_000
const observedUploadStateTimeoutMs = 25_000
const githubApiBaseUrl = "https://api.github.com"
const getCaptureDir = () => {
  return process.env.EXITPRESS_CAPTURE_DIR ?? null
}

type LiveUploadConfig = {
  token: string
  branch: string
}

type BranchResponse = {
  commit?: {
    sha?: string
  }
}

type CompareResponse = {
  files?: Array<{
    filename?: string
  }>
}

type TreeResponse = {
  tree?: Array<{
    path?: string
    type?: string
  }>
}

const resolveLiveUploadConfig = (): LiveUploadConfig => {
  loadDotEnv({ quiet: true })

  const token = process.env.EXITPRESS_UPLOAD_E2E_GITHUB_TOKEN?.trim()

  if (!token) {
    throw new Error("EXITPRESS_UPLOAD_E2E_GITHUB_TOKEN 이 필요합니다.")
  }

  return {
    token,
    branch: uploadBranch,
  }
}

const startServer = async (server: ReturnType<typeof createHttpServer>) => {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })

  const address = server.address()

  if (!address || typeof address === "string") {
    throw new Error("server did not bind to a numeric port")
  }

  return `http://127.0.0.1:${address.port}`
}

const chooseSelectOption = async ({
  page,
  trigger,
  value,
}: {
  page: import("playwright").Page
  trigger: string
  value: string
}) => {
  const target = page.locator(trigger).first()
  const tagName = await target.evaluate((element) => element.tagName.toLowerCase())

  if (tagName === "select") {
    await target.selectOption(value)
    return
  }

  const childSelect = target.locator("select")

  if ((await childSelect.count()) > 0) {
    await childSelect.selectOption(value)
    return
  }

  await target.click()
  await page.locator(`[data-slot="select-item"][data-value="${value}"]`).click()
}

const waitForStepView = async ({
  page,
  step,
}: {
  page: import("playwright").Page
  step: string
}) => {
  await page.waitForFunction(
    (nextStep) => document.querySelector(`[data-step-view="${nextStep}"]`) instanceof HTMLElement,
    step,
    { timeout: responseTimeoutMs },
  )
}

const waitForStatus = async ({
  page,
  status,
}: {
  page: import("playwright").Page
  status: ExportJobState["status"]
}) => {
  await page.waitForFunction(
    (expectedStatus) =>
      document.querySelector("#status-text")?.getAttribute("data-status") === expectedStatus,
    status,
    { timeout: responseTimeoutMs },
  )
}

const clickWizardButton = async ({
  page,
  label,
}: {
  page: import("playwright").Page
  label: string
}) => {
  await page.getByRole("button", { name: label }).click()
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`request failed: ${response.status} ${url}`)
  }

  return (await response.json()) as T
}

const fetchGitHubJson = async <T>({
  token,
  pathname,
}: {
  token: string
  pathname: string
}): Promise<T> => {
  const response = await fetch(`${githubApiBaseUrl}${pathname}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "user-agent": "exitpress-playwright-e2e",
      "x-github-api-version": "2022-11-28",
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${pathname}`)
  }

  return (await response.json()) as T
}

const getBranchHeadSha = async ({ token, branch }: LiveUploadConfig) => {
  const response = await fetchGitHubJson<BranchResponse>({
    token,
    pathname: `/repos/${uploadRepo}/branches/${encodeURIComponent(branch)}`,
  })
  const sha = response.commit?.sha?.trim()

  if (!sha) {
    throw new Error(`GitHub branch head SHA를 찾을 수 없습니다: ${branch}`)
  }

  return sha
}

const waitForBranchHeadChange = async ({
  beforeSha,
  config,
}: {
  beforeSha: string
  config: LiveUploadConfig
}) => {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const nextSha = await getBranchHeadSha(config)

    if (nextSha !== beforeSha) {
      return nextSha
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000))
  }

  return null
}

const getChangedFilesBetween = async ({
  token,
  beforeSha,
  afterSha,
}: {
  token: string
  beforeSha: string
  afterSha: string
}) => {
  const response = await fetchGitHubJson<CompareResponse>({
    token,
    pathname: `/repos/${uploadRepo}/compare/${beforeSha}...${afterSha}`,
  })

  return (response.files ?? [])
    .map((file) => file.filename?.trim())
    .filter((filename): filename is string => Boolean(filename))
}

const assertRepoContainsFiles = async ({
  token,
  branch,
  fileNames,
}: {
  token: string
  branch: string
  fileNames: string[]
}) => {
  const response = await fetchGitHubJson<TreeResponse>({
    token,
    pathname: `/repos/${uploadRepo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  })
  const treePaths = new Set(
    (response.tree ?? [])
      .filter((entry) => entry.type === "blob")
      .map((entry) => entry.path?.trim())
      .filter((entry): entry is string => Boolean(entry)),
  )

  for (const fileName of fileNames) {
    if (
      !Array.from(treePaths).some(
        (treePath) => treePath === fileName || treePath.endsWith(`/${fileName}`),
      )
    ) {
      throw new Error(`GitHub repo root did not contain uploaded file: ${fileName}`)
    }
  }
}

const assertImageVisible = async ({
  context,
  imageUrl,
}: {
  context: import("playwright").BrowserContext
  imageUrl: string
}) => {
  const page = await context.newPage()

  try {
    await page.setContent('<img id="uploaded-image" alt="uploaded image" />')
    await page.locator("#uploaded-image").evaluate((element, nextUrl) => {
      if (!(element instanceof HTMLImageElement)) {
        throw new Error("uploaded-image element is not an image")
      }

      element.src = nextUrl
    }, imageUrl)

    await page.waitForFunction(
      () => {
        const image = document.querySelector("#uploaded-image")

        return (
          image instanceof HTMLImageElement &&
          image.complete &&
          image.naturalWidth > 0 &&
          image.naturalHeight > 0
        )
      },
      undefined,
      { timeout: responseTimeoutMs },
    )
  } finally {
    await page.close()
  }
}

const saveCapture = async ({
  page,
  captureDir,
  fileName,
}: {
  page: import("playwright").Page
  captureDir: string | null
  fileName: string
}) => {
  if (!captureDir) {
    return null
  }

  await mkdir(captureDir, {
    recursive: true,
  })

  const filePath = path.join(captureDir, fileName)
  await page.screenshot({
    path: filePath,
    fullPage: true,
  })

  return filePath
}

const saveJsonCapture = async ({
  captureDir,
  fileName,
  payload,
}: {
  captureDir: string | null
  fileName: string
  payload: unknown
}) => {
  if (!captureDir) {
    return null
  }

  await mkdir(captureDir, {
    recursive: true,
  })

  const filePath = path.join(captureDir, fileName)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  return filePath
}

const logLiveUpload = (message: string, payload?: unknown) => {
  if (payload === undefined) {
    console.log(`live upload: ${message}`)
    return
  }

  console.log(`live upload: ${message} ${JSON.stringify(payload)}`)
}

const readUiUploadState = async ({ page }: { page: import("playwright").Page }) =>
  page.evaluate(() => {
    const progressValue = Number(
      document.querySelector("#upload-progress")?.getAttribute("aria-valuenow") ?? "0",
    )
    const statusPanelText =
      document.querySelector("#status-panel")?.textContent?.replace(/\s+/g, " ").trim() ?? ""
    const progressMatch = /(\d+)\s*\/\s*(\d+)/.exec(statusPanelText)
    const completed = Number(progressMatch?.[1] ?? "0")
    const total = Number(progressMatch?.[2] ?? "0")
    const uploadProgress =
      progressValue > 0 ? progressValue : total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      statusText: document.querySelector("#status-text")?.getAttribute("data-status"),
      uploadProgress,
      partialRowCount: document.querySelectorAll('[data-upload-row-status="partial"]').length,
      completeRowCount: document.querySelectorAll('[data-upload-row-status="complete"]').length,
      uploadFormVisible: Boolean(document.querySelector("#upload-providerKey")),
      rewritePendingCopy: statusPanelText.includes(
        "자산 업로드는 끝났고 결과 파일에 URL을 반영하는 중입니다.",
      ),
    }
  })

const waitForObservedUploadState = async ({
  page,
  baseUrl,
  jobId,
  label,
  timeoutMs,
  accept,
}: {
  page: import("playwright").Page
  baseUrl: string
  jobId: string
  label: string
  timeoutMs: number
  accept: (snapshot: {
    job: ExportJobState
    ui: Awaited<ReturnType<typeof readUiUploadState>>
  }) => Promise<boolean> | boolean
}) => {
  const startTime = Date.now()
  let lastSnapshot: {
    job: ExportJobState
    ui: Awaited<ReturnType<typeof readUiUploadState>>
  } | null = null

  while (Date.now() - startTime < timeoutMs) {
    const job = await fetchJson<ExportJobState>(`${baseUrl}/api/export/${jobId}`)
    const ui = await readUiUploadState({
      page,
    })
    lastSnapshot = {
      job,
      ui,
    }

    if (await accept({ job, ui })) {
      logLiveUpload(`${label} observed`, {
        jobStatus: job.status,
        uploadStatus: job.upload.status,
        uploadedCount: job.upload.uploadedCount,
        candidateCount: job.upload.candidateCount,
        ui,
      })
      return { job, ui }
    }

    await page.waitForTimeout(1_000)
  }

  throw new Error(
    `expected live upload ${label} state was not observed before timeout: ${JSON.stringify(lastSnapshot)}`,
  )
}

export const runUiLiveUpload = async ({ browser }: { browser: Browser }) => {
  const config = resolveLiveUploadConfig()
  const tempRoot = await createTestTempDir("exitpress-live-upload-harness-")
  const server = createHttpServer({
    settingsPath: path.join(tempRoot, "export-ui-settings.json"),
    scanCachePath: path.join(tempRoot, "scan-cache.json"),
    postHtmlCacheDir: path.join(tempRoot, "post-html"),
  })
  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 1200,
    },
  })
  const page = await context.newPage()
  const outputDir = path.join(tempRoot, "output")
  const captureDir = getCaptureDir()
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  let manualUploadPostCount = 0
  const liveEvidence: {
    branch: string
    beforeSha?: string
    partial?: Record<string, unknown>
    rewritePending?: Record<string, unknown>
    final?: Record<string, unknown>
  } = {
    branch: config.branch,
  }
  let baseUrl = ""

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text())
    }
  })
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
  })
  page.on("request", (request) => {
    const url = new URL(request.url())

    if (request.method() === "POST" && /\/api\/export\/[^/]+\/upload$/.test(url.pathname)) {
      manualUploadPostCount += 1
    }
  })

  try {
    baseUrl = await startServer(server)
    logLiveUpload("server ready")
    await page.goto(baseUrl)
    await waitForStepView({
      page,
      step: "blog-input",
    })

    await page.fill("#sourceInput", sourceId)
    await page.fill("#outputDir", outputDir)

    const scanResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === `${baseUrl}/api/scan` && response.request().method() === "POST",
      { timeout: responseTimeoutMs },
    )

    await clickWizardButton({
      page,
      label: "카테고리 불러오기",
    })
    const scanResponse = await scanResponsePromise
    const scanResult = (await scanResponse.json()) as ScanResult
    const scanPosts = scanResult.posts ?? []
    logLiveUpload("scan completed", {
      postCount: scanPosts.length,
    })

    await waitForStepView({
      page,
      step: "category-selection",
    })

    const targetPost = scanPosts.find((post) => post.postId === targetPostId)

    if (!targetPost) {
      throw new Error(`target post metadata not found: ${sourceId}/${targetPostId}`)
    }

    const targetCategory = scanResult.categories.find(
      (category) => category.id === targetPost.categoryId,
    )

    if (!targetCategory) {
      throw new Error(`target category metadata not found: ${targetPost.categoryId}`)
    }

    const scopedDate = targetPost.publishedAt.slice(0, 10)
    const scopedPosts = scanPosts.filter(
      (post) =>
        post.categoryId === targetPost.categoryId && post.publishedAt.startsWith(scopedDate),
    )

    if (scopedPosts.length !== 1) {
      throw new Error(
        `live upload scope drifted: expected exactly one post for category ${targetPost.categoryId} on ${scopedDate}, got ${scopedPosts.length}`,
      )
    }

    await chooseSelectOption({
      page,
      trigger: "#scope-categoryMode",
      value: "exact-selected",
    })
    await page.fill("#scope-dateFrom", scopedDate)
    await page.fill("#scope-dateTo", scopedDate)
    await page.click('[data-category-bulk-selection="true"]')
    await page.locator(`tr[data-category-id="${targetCategory.id}"] [role="checkbox"]`).click()
    await page.waitForFunction(
      () =>
        document.querySelector("#selected-post-count")?.textContent?.includes("대상 글 1개") ??
        false,
      undefined,
      { timeout: responseTimeoutMs },
    )

    await clickWizardButton({
      page,
      label: "구조 설정",
    })
    await waitForStepView({
      page,
      step: "structure-options",
    })

    for (const nextStep of ["frontmatter-options", "assets-options"] as const) {
      await clickWizardButton({
        page,
        label: nextStep === "frontmatter-options" ? "Frontmatter 설정" : "자산 설정",
      })
      await waitForStepView({
        page,
        step: nextStep,
      })
    }

    await chooseSelectOption({
      page,
      trigger: "#assets-imageHandlingMode",
      value: "download-and-upload",
    })

    await clickWizardButton({
      page,
      label: "다음",
    })
    await waitForStepView({
      page,
      step: "upload-provider-options",
    })

    await page.fill("#upload-providerField-repo", uploadRepo)
    await page.fill("#upload-providerField-branch", config.branch)
    await page.fill("#upload-providerField-path", uploadPath)
    await page.fill("#upload-providerField-token", config.token)

    const testUploadRequestPromise = page.waitForRequest(
      (request) =>
        request.url() === `${baseUrl}/api/upload-providers/test` && request.method() === "POST",
      { timeout: responseTimeoutMs },
    )
    const testUploadResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === `${baseUrl}/api/upload-providers/test` &&
        response.request().method() === "POST",
      { timeout: responseTimeoutMs },
    )

    await page.getByRole("button", { name: "테스트 업로드" }).click()
    const testUploadRequest = await testUploadRequestPromise
    const testUploadResponse = await testUploadResponsePromise
    const testUploadPayload = testUploadRequest.postDataJSON() as {
      providerKey: string
      providerFields: Record<string, string>
    }

    if (testUploadResponse.status() !== 200) {
      throw new Error(`test upload request failed: ${testUploadResponse.status()}`)
    }

    if (
      testUploadPayload.providerKey !== "github" ||
      testUploadPayload.providerFields.repo !== uploadRepo ||
      testUploadPayload.providerFields.branch !== config.branch ||
      testUploadPayload.providerFields.path !== uploadPath ||
      testUploadPayload.providerFields.token !== config.token
    ) {
      throw new Error("browser test upload payload did not match the expected GitHub config")
    }

    const testUploadBody = (await testUploadResponse.json()) as {
      uploadedUrl?: string
    }

    if (!testUploadBody.uploadedUrl?.startsWith("http")) {
      throw new Error("test upload response did not include an uploaded URL")
    }

    await page.waitForSelector(`text=${testUploadBody.uploadedUrl}`)
    logLiveUpload("test upload completed")

    const branchHeadBeforeUpload = await getBranchHeadSha(config)
    liveEvidence.beforeSha = branchHeadBeforeUpload
    logLiveUpload("branch head captured", {
      branch: config.branch,
      beforeSha: branchHeadBeforeUpload,
    })

    await clickWizardButton({
      page,
      label: "링크 처리",
    })
    await waitForStepView({
      page,
      step: "links-options",
    })
    await clickWizardButton({
      page,
      label: "진단 설정",
    })
    await waitForStepView({
      page,
      step: "diagnostics-options",
    })

    const exportRequestPromise = page.waitForRequest(
      (request) => request.url() === `${baseUrl}/api/export` && request.method() === "POST",
      { timeout: responseTimeoutMs },
    )
    const exportResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === `${baseUrl}/api/export` && response.request().method() === "POST",
      { timeout: responseTimeoutMs },
    )

    await clickWizardButton({
      page,
      label: "내보내기",
    })
    await page.waitForFunction(
      () => {
        const step = document.querySelector("[data-step-view]")?.getAttribute("data-step-view")
        return step === "markdown-review" || step === "running"
      },
      undefined,
      { timeout: responseTimeoutMs },
    )

    if ((await page.locator('[data-step-view="markdown-review"]').count()) > 0) {
      await clickWizardButton({
        page,
        label: "변환 시작",
      })
    }

    const exportRequest = await exportRequestPromise
    const exportResponse = await exportResponsePromise
    const exportPayload = exportRequest.postDataJSON() as {
      sourceInput: string
      outputDir: string
      options: {
        scope: {
          categoryMode: string
          categoryIds: number[]
          dateFrom: string | null
          dateTo: string | null
        }
        assets: {
          imageHandlingMode: string
        }
      }
      uploadProvider?: {
        providerKey: string
        providerFields: Record<string, string>
      }
    }

    if (exportResponse.status() !== 202) {
      throw new Error(`export request failed: ${exportResponse.status()}`)
    }

    const exportUploadProvider = exportPayload.uploadProvider
    const exportUploadProviderFields = exportUploadProvider?.providerFields

    if (
      exportPayload.sourceInput !== sourceId ||
      exportPayload.outputDir !== outputDir ||
      exportPayload.options.scope.categoryMode !== "exact-selected" ||
      exportPayload.options.scope.dateFrom !== scopedDate ||
      exportPayload.options.scope.dateTo !== scopedDate ||
      exportPayload.options.scope.categoryIds.length !== 1 ||
      exportPayload.options.scope.categoryIds[0] !== targetCategory.id ||
      exportPayload.options.assets.imageHandlingMode !== "download-and-upload" ||
      !exportUploadProvider ||
      !exportUploadProviderFields ||
      exportUploadProvider.providerKey !== "github" ||
      exportUploadProviderFields.repo !== uploadRepo ||
      exportUploadProviderFields.branch !== config.branch ||
      exportUploadProviderFields.path !== uploadPath ||
      exportUploadProviderFields.token !== config.token
    ) {
      throw new Error("browser export payload did not match the expected scoped upload request")
    }

    const exportBody = (await exportResponse.json()) as {
      jobId?: string
    }
    const jobId = exportBody.jobId?.trim()

    if (!jobId) {
      throw new Error("export response did not return a jobId")
    }
    logLiveUpload("export accepted", {
      jobId,
    })

    await page.waitForFunction(
      () => {
        const status = document.querySelector("#status-text")?.getAttribute("data-status")

        return status === "uploading" || status === "upload-completed"
      },
      undefined,
      { timeout: responseTimeoutMs },
    )

    const partialState = await waitForObservedUploadState({
      page,
      baseUrl,
      jobId,
      label: "partial progress",
      timeoutMs: observedUploadStateTimeoutMs,
      accept: async ({ job, ui }) => {
        const uploadObserved =
          job.upload.uploadedCount > 0 &&
          (job.status === "uploading" || job.status === "upload-completed") &&
          (ui.statusText === "uploading" || ui.statusText === "upload-completed")

        if (!uploadObserved) {
          return false
        }

        const currentHead = await getBranchHeadSha(config)

        if (currentHead === branchHeadBeforeUpload) {
          return false
        }

        const changedFiles = await getChangedFilesBetween({
          token: config.token,
          beforeSha: branchHeadBeforeUpload,
          afterSha: currentHead,
        })

        return (
          changedFiles.some((filename) => /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(filename)) &&
          ui.uploadProgress > 0 &&
          !ui.uploadFormVisible &&
          (ui.partialRowCount > 0 || ui.completeRowCount > 0)
        )
      },
    })
    const partialSha = await getBranchHeadSha(config)
    const partialChangedFiles = await getChangedFilesBetween({
      token: config.token,
      beforeSha: branchHeadBeforeUpload,
      afterSha: partialSha,
    })
    const partialScreenshot = await saveCapture({
      page,
      captureDir,
      fileName: "live-upload-partial-progress.png",
    })

    liveEvidence.partial = {
      jobStatus: partialState.job.status,
      uploadedCount: partialState.job.upload.uploadedCount,
      candidateCount: partialState.job.upload.candidateCount,
      uiStatus: partialState.ui.statusText,
      uiUploadProgress: partialState.ui.uploadProgress,
      partialRowCount: partialState.ui.partialRowCount,
      completeRowCount: partialState.ui.completeRowCount,
      branch: config.branch,
      headSha: partialSha,
      changedFiles: partialChangedFiles,
      screenshot: partialScreenshot,
    }

    const rewritePendingState = await waitForObservedUploadState({
      page,
      baseUrl,
      jobId,
      label: "rewrite pending",
      timeoutMs: observedUploadStateTimeoutMs,
      accept: ({ job, ui }) => {
        const rewritePendingObserved =
          job.status === "uploading" &&
          job.upload.uploadedCount === job.upload.candidateCount &&
          ui.statusText === "uploading" &&
          ui.uploadProgress === 100 &&
          ui.rewritePendingCopy &&
          !ui.uploadFormVisible

        if (rewritePendingObserved) {
          return true
        }

        return (
          job.status === "upload-completed" &&
          job.upload.uploadedCount === job.upload.candidateCount &&
          ui.statusText === "upload-completed" &&
          ui.uploadProgress === 100 &&
          ui.completeRowCount > 0 &&
          !ui.uploadFormVisible
        )
      },
    })
    const rewritePendingScreenshot = await saveCapture({
      page,
      captureDir,
      fileName: "live-upload-rewrite-pending.png",
    })

    liveEvidence.rewritePending = {
      jobStatus: rewritePendingState.job.status,
      uploadedCount: rewritePendingState.job.upload.uploadedCount,
      candidateCount: rewritePendingState.job.upload.candidateCount,
      uiStatus: rewritePendingState.ui.statusText,
      uiUploadProgress: rewritePendingState.ui.uploadProgress,
      rewritePendingCopy: rewritePendingState.ui.rewritePendingCopy,
      screenshot: rewritePendingScreenshot,
    }

    await waitForStatus({
      page,
      status: "upload-completed",
    })
    logLiveUpload("upload completed")

    const completedJob = await fetchJson<ExportJobState>(`${baseUrl}/api/export/${jobId}`)
    const manifest = await fetchJson<{
      upload: {
        status: string
        uploadedCount: number
        candidateCount: number
      }
      posts: PostManifestEntry[]
    }>(`${baseUrl}/api/export/${jobId}/manifest`)
    const completedPost = manifest.posts.find((post) => post.postId === targetPostId)
    const completedItem = completedJob.items.find((item) => item.postId === targetPostId)

    if (completedJob.upload.status !== "upload-completed") {
      throw new Error(`job did not reach upload-completed: ${completedJob.upload.status}`)
    }

    if (manifest.upload.status !== "upload-completed") {
      throw new Error(`manifest did not reach upload-completed: ${manifest.upload.status}`)
    }

    if (manifest.upload.uploadedCount !== manifest.upload.candidateCount) {
      throw new Error("manifest uploadedCount and candidateCount diverged")
    }

    if (!completedPost || completedPost.assetPaths.length === 0) {
      throw new Error("completed manifest did not contain uploaded asset URLs")
    }

    if (!completedItem?.outputPath || completedItem.upload.candidates.length === 0) {
      throw new Error("completed job did not expose the target markdown path and upload candidates")
    }

    for (const assetPath of completedPost.assetPaths) {
      const uploadedUrl = new URL(assetPath)

      if (!["http:", "https:"].includes(uploadedUrl.protocol)) {
        throw new Error(`uploaded asset is not an http(s) URL: ${assetPath}`)
      }

      if (!assetPath.includes("ia2")) {
        throw new Error(`uploaded asset URL does not point at ${uploadRepo}: ${assetPath}`)
      }

      if (!uploadedUrl.pathname.includes(uploadPath)) {
        throw new Error(
          `uploaded asset URL did not preserve the requested GitHub path: ${assetPath}`,
        )
      }
    }

    const markdownPath = path.join(outputDir, completedItem.outputPath)
    const markdownAfterUpload = await readFile(markdownPath, "utf8")

    for (const candidate of completedItem.upload.candidates) {
      if (markdownAfterUpload.includes(candidate.markdownReference)) {
        throw new Error(
          `markdown still contains pre-upload reference: ${candidate.markdownReference}`,
        )
      }
    }

    for (const assetPath of completedPost.assetPaths) {
      if (!markdownAfterUpload.includes(assetPath)) {
        throw new Error(`markdown did not contain uploaded URL: ${assetPath}`)
      }
    }

    const completedJobJson = JSON.stringify(completedJob)
    const manifestJson = JSON.stringify(manifest)

    if (completedJobJson.includes(config.token) || manifestJson.includes(config.token)) {
      throw new Error("upload token leaked into job polling payload or manifest")
    }

    const uploadedFileNames = completedPost.assetPaths.map((assetPath) => {
      const uploadedUrl = new URL(assetPath)
      const fileName = decodeURIComponent(
        uploadedUrl.pathname.split("/").filter(Boolean).at(-1) ?? "",
      )

      if (!fileName) {
        throw new Error(`uploaded asset URL did not include a file name: ${assetPath}`)
      }

      return decodeURIComponent(`${uploadPath}/${fileName}`)
    })

    await assertRepoContainsFiles({
      token: config.token,
      branch: config.branch,
      fileNames: uploadedFileNames,
    })

    const branchHeadAfterUpload = await waitForBranchHeadChange({
      beforeSha: branchHeadBeforeUpload,
      config,
    })

    if (branchHeadAfterUpload) {
      const changedFiles = await getChangedFilesBetween({
        token: config.token,
        beforeSha: branchHeadBeforeUpload,
        afterSha: branchHeadAfterUpload,
      })

      if (
        !changedFiles.some((filename) => /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(filename))
      ) {
        throw new Error("GitHub compare result did not include uploaded image files")
      }
    }

    const finalScreenshot = await saveCapture({
      page,
      captureDir,
      fileName: "live-upload-completed.png",
    })

    liveEvidence.final = {
      jobStatus: completedJob.status,
      uploadStatus: completedJob.upload.status,
      uploadedCount: completedJob.upload.uploadedCount,
      candidateCount: completedJob.upload.candidateCount,
      branch: config.branch,
      headSha: branchHeadAfterUpload,
      screenshot: finalScreenshot,
      uploadedFiles: uploadedFileNames,
    }

    await saveJsonCapture({
      captureDir,
      fileName: "live-upload-evidence.json",
      payload: liveEvidence,
    })

    await assertImageVisible({
      context,
      imageUrl: completedPost.assetPaths[0]!,
    })

    if (manualUploadPostCount !== 0) {
      throw new Error("normal live upload flow sent a manual upload POST")
    }

    if (consoleErrors.length > 0) {
      throw new Error(`browser console error: ${consoleErrors[0]}`)
    }

    if (pageErrors.length > 0) {
      throw new Error(`browser page error: ${pageErrors[0]}`)
    }

    console.log(JSON.stringify(liveEvidence, null, 2))
  } finally {
    await context.close()
    await rm(outputDir, {
      recursive: true,
      force: true,
    })
    await rm(tempRoot, {
      recursive: true,
      force: true,
    })
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }
}
