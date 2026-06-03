// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, beforeEach, expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"

import type { ScanResult } from "../../../src/domain/blog/Types.js"
import type { ExportJobState } from "../../../src/domain/export-job/Types.js"
import type { UploadProviderCatalogResponse } from "../../../src/domain/upload/UploadProviderTypes.js"

import {
  defaultExportOptions,
  frontmatterFieldMeta,
  frontmatterFieldOrder,
  optionDescriptions,
} from "../../../src/domain/export-options/ExportOptions.js"
import { NaverBlog } from "../../../src/parsing/naver-blog/NaverBlog.js"
import { App } from "../../../src/ui/app/App.js"
import { createTestPath } from "../test-paths.js"

export const testOutputDir = createTestPath("ui-app", "output")
export const testResumeOutputDir = createTestPath("ui-app", "resume-output")
const blockOutputDefinitions = new NaverBlog().getBlockOutputDefinitions()

export const buildJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  })

export const selectOption = async ({
  user,
  trigger,
  value,
}: {
  user: ReturnType<typeof userEvent.setup>
  trigger: HTMLElement
  value: string
}) => {
  await user.click(trigger)

  await waitFor(() => {
    expect(
      document.querySelector(`[data-slot="select-item"][data-value="${value}"]`),
    ).not.toBeNull()
  })

  await user.click(
    document.querySelector(`[data-slot="select-item"][data-value="${value}"]`) as HTMLElement,
  )
}

const buildPostSummary = (logNo: number, categoryId: number, categoryName: string) => ({
  blogId: "mym0404",
  logNo: String(logNo),
  title: `${categoryName} 글 ${logNo}`,
  publishedAt: `2026-04-${String((logNo % 28) + 1).padStart(2, "0")}T04:00:00.000Z`,
  categoryId,
  categoryName,
  source: `https://blog.naver.com/mym0404/${logNo}`,
  thumbnailUrl: null,
})

export const scanResult: ScanResult = {
  blogId: "mym0404",
  totalPostCount: 12,
  categories: [
    {
      id: 101,
      name: "NestJS",
      parentId: null,
      postCount: 5,
      isDivider: false,
      isOpen: true,
      path: ["NestJS"],
      depth: 1,
    },
    {
      id: 202,
      name: "React",
      parentId: null,
      postCount: 7,
      isDivider: false,
      isOpen: true,
      path: ["React"],
      depth: 1,
    },
  ],
  posts: [
    ...Array.from({ length: 5 }, (_, index) => buildPostSummary(index + 1, 101, "NestJS")),
    ...Array.from({ length: 7 }, (_, index) => buildPostSummary(index + 6, 202, "React")),
  ],
}

export const uploadProviderCatalog: UploadProviderCatalogResponse = {
  defaultProviderKey: "github",
  providers: [
    {
      key: "github",
      label: "GitHub",
      description: "리포지토리에 이미지를 커밋하고 URL로 사용합니다.",
      fields: [
        {
          key: "repo",
          label: "Repository",
          description: "업로드할 GitHub 저장소 경로입니다.",
          inputType: "text",
          required: true,
          defaultValue: null,
          placeholder: "owner/repo",
        },
        {
          key: "branch",
          label: "Branch",
          description: "업로드를 커밋할 브랜치 이름입니다.",
          inputType: "text",
          required: false,
          defaultValue: "main",
          placeholder: "",
        },
        {
          key: "path",
          label: "Path",
          description: "원격 저장소 안에서 파일을 둘 하위 경로입니다.",
          inputType: "text",
          required: false,
          defaultValue: null,
          placeholder: "images/posts",
        },
        {
          key: "token",
          label: "Token",
          description: "서비스 API 접근용 토큰을 입력합니다.",
          inputType: "password",
          required: true,
          defaultValue: null,
          placeholder: "ghp_xxx",
        },
        {
          key: "customUrl",
          label: "Custom URL",
          description: "최종 파일 URL을 직접 덮어쓸 때 사용합니다.",
          inputType: "text",
          required: false,
          defaultValue: null,
          placeholder: "",
        },
      ],
    },
    {
      key: "tcyun",
      label: "Tencent COS",
      description: "Tencent COS 버킷에 이미지를 업로드합니다.",
      fields: [
        {
          key: "appId",
          label: "App ID",
          description: "스토리지 서비스의 앱 ID를 입력합니다.",
          inputType: "text",
          required: true,
          defaultValue: null,
          placeholder: "",
        },
        {
          key: "permission",
          label: "Permission",
          description: "이미지 공개 범위 또는 접근 권한을 선택합니다.",
          inputType: "select",
          required: true,
          defaultValue: null,
          placeholder: "",
          options: [
            { label: "Public", value: 0 },
            { label: "Private", value: 1 },
          ],
        },
        {
          key: "port",
          label: "Port",
          description: "기본 포트 대신 사용할 포트 번호입니다.",
          inputType: "number",
          required: false,
          defaultValue: 36677,
          placeholder: "",
        },
        {
          key: "slim",
          label: "Slim",
          description: "COS 이미지 처리 압축 옵션을 함께 사용합니다.",
          inputType: "checkbox",
          required: false,
          defaultValue: false,
          placeholder: "압축 경로 사용",
        },
      ],
    },
  ],
}

export const exportedOptions = (() => {
  const options = defaultExportOptions()
  options.scope.categoryIds = [101]
  options.frontmatter.aliases.title = "postTitle"
  return options
})()

export const completedJob: ExportJobState = {
  id: "job-1",
  request: {
    blogIdOrUrl: "mym0404",
    outputDir: testOutputDir,
    profile: "gfm",
    options: exportedOptions,
  },
  status: "completed",
  logs: [
    {
      timestamp: "2026-04-11T04:00:00.000Z",
      message: "작업을 큐에 등록했습니다.",
    },
  ],
  createdAt: "2026-04-11T04:00:00.000Z",
  startedAt: "2026-04-11T04:00:00.000Z",
  finishedAt: "2026-04-11T04:00:01.000Z",
  progress: {
    total: 1,
    completed: 1,
    failed: 0,
  },
  upload: {
    status: "not-requested",
    eligiblePostCount: 0,
    candidateCount: 0,
    uploadedCount: 0,
    failedCount: 0,
    terminalReason: null,
  },
  items: [
    {
      id: "posts/NestJS/test.md",
      logNo: "1",
      title: "테스트 글",
      source: "https://blog.naver.com/mym0404/1",
      category: {
        id: 101,
        name: "NestJS",
        path: ["NestJS"],
      },
      status: "success",
      outputPath: "posts/NestJS/test.md",
      assetPaths: [],
      upload: {
        eligible: false,
        candidateCount: 0,
        uploadedCount: 0,
        failedCount: 0,
        candidates: [],
        uploadedUrls: [],
        rewriteStatus: "pending" as const,
        rewrittenAt: null,
      },
      error: null,
      updatedAt: "2026-04-11T04:00:01.000Z",
    },
  ],
  manifest: null,
  error: null,
}

export const runningJob: ExportJobState = {
  ...completedJob,
  status: "running",
  finishedAt: null,
  progress: {
    total: 5,
    completed: 2,
    failed: 0,
  },
  items: [
    completedJob.items[0]!,
    {
      ...completedJob.items[0]!,
      id: "posts/React/test-2.md",
      logNo: "2",
      title: "진행 중에 먼저 끝난 글",
      source: "https://blog.naver.com/mym0404/2",
      category: {
        id: 102,
        name: "React",
        path: ["React"],
      },
      outputPath: "posts/React/test-2.md",
      updatedAt: "2026-04-11T04:00:02.000Z",
    },
  ],
}

const uploadFlowOptions = (() => {
  const options = defaultExportOptions()
  options.scope.categoryIds = scanResult.categories.map((category) => category.id)
  options.assets.imageHandlingMode = "download-and-upload"
  return options
})()

const sharedPublicPath = "../../public/hash-shared-image.png"
const sharedLocalPath = "public/hash-shared-image.png"
const detailPublicPath = "../../public/hash-detail-image.png"
const detailLocalPath = "public/hash-detail-image.png"

const uploadItem: ExportJobState["items"][number] = {
  ...completedJob.items[0]!,
  id: "NestJS/2026-04-11-1/index.md",
  outputPath: "NestJS/2026-04-11-1/index.md",
  assetPaths: [sharedPublicPath, detailPublicPath],
  upload: {
    eligible: true,
    candidateCount: 2,
    uploadedCount: 0,
    failedCount: 0,
    candidates: [
      {
        kind: "thumbnail" as const,
        sourceUrl: "https://example.com/thumb.png",
        localPath: sharedLocalPath,
        markdownReference: sharedPublicPath,
      },
      {
        kind: "image" as const,
        sourceUrl: "https://example.com/detail.png",
        localPath: detailLocalPath,
        markdownReference: detailPublicPath,
      },
    ],
    uploadedUrls: [],
    rewriteStatus: "pending" as const,
    rewrittenAt: null,
  },
}

const uploadPendingItem = {
  ...uploadItem,
  id: "React/2026-04-12-2/index.md",
  title: "대기 중인 글",
  outputPath: "React/2026-04-12-2/index.md",
}

export const uploadReadyJob: ExportJobState = {
  ...completedJob,
  id: "job-upload",
  request: {
    ...completedJob.request,
    options: uploadFlowOptions,
  },
  status: "upload-ready",
  finishedAt: null,
  upload: {
    status: "upload-ready",
    eligiblePostCount: 2,
    candidateCount: 4,
    uploadedCount: 0,
    failedCount: 0,
    terminalReason: null,
  },
  items: [uploadItem, uploadPendingItem],
}

export const uploadingJob: ExportJobState = {
  ...uploadReadyJob,
  status: "uploading",
  upload: {
    ...uploadReadyJob.upload,
    status: "uploading",
    uploadedCount: 3,
  },
  items: [
    {
      ...uploadItem,
      upload: {
        ...uploadItem.upload,
        uploadedCount: 2,
      },
    },
    {
      ...uploadPendingItem,
      upload: {
        ...uploadPendingItem.upload,
        uploadedCount: 1,
      },
    },
  ],
}

export const rewritePendingJob: ExportJobState = {
  ...uploadReadyJob,
  status: "uploading",
  upload: {
    ...uploadReadyJob.upload,
    status: "uploading",
    uploadedCount: 4,
  },
  items: [
    {
      ...uploadItem,
      upload: {
        ...uploadItem.upload,
        uploadedCount: 2,
      },
    },
    {
      ...uploadPendingItem,
      upload: {
        ...uploadPendingItem.upload,
        uploadedCount: 2,
      },
    },
  ],
}

export const uploadCompletedJob: ExportJobState = {
  ...uploadReadyJob,
  status: "upload-completed",
  finishedAt: "2026-04-11T04:00:03.000Z",
  upload: {
    ...uploadReadyJob.upload,
    status: "upload-completed",
    uploadedCount: 4,
  },
  items: [
    {
      ...uploadItem,
      assetPaths: ["https://cdn.example.com/shared.png", "https://cdn.example.com/detail.png"],
      upload: {
        ...uploadItem.upload,
        uploadedCount: 2,
        uploadedUrls: ["https://cdn.example.com/shared.png", "https://cdn.example.com/detail.png"],
        rewriteStatus: "completed",
        rewrittenAt: "2026-04-11T04:00:03.000Z",
      },
    },
    {
      ...uploadPendingItem,
      assetPaths: ["https://cdn.example.com/shared.png", "https://cdn.example.com/detail.png"],
      upload: {
        ...uploadPendingItem.upload,
        uploadedCount: 2,
        uploadedUrls: ["https://cdn.example.com/shared.png", "https://cdn.example.com/detail.png"],
        rewriteStatus: "completed",
        rewrittenAt: "2026-04-11T04:00:03.000Z",
      },
    },
  ],
}

export const uploadFailedJob: ExportJobState = {
  ...uploadReadyJob,
  status: "upload-failed",
  error: "Image upload failed.",
  upload: {
    ...uploadReadyJob.upload,
    status: "upload-failed",
    failedCount: 1,
    uploadedCount: 3,
  },
  items: [
    {
      ...uploadItem,
      upload: {
        ...uploadItem.upload,
        uploadedCount: 2,
      },
    },
    {
      ...uploadPendingItem,
      upload: {
        ...uploadPendingItem.upload,
        uploadedCount: 1,
      },
    },
  ],
}

export const skippedUploadJob: ExportJobState = {
  ...completedJob,
  id: "job-skipped",
  request: {
    ...completedJob.request,
    options: uploadFlowOptions,
  },
  upload: {
    status: "skipped",
    eligiblePostCount: 0,
    candidateCount: 0,
    uploadedCount: 0,
    failedCount: 0,
    terminalReason: null,
  },
}

export const waitForAutosave = () => new Promise((resolve) => setTimeout(resolve, 350))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(240)
  vi.stubGlobal("scrollTo", vi.fn())
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: vi.fn(() => false),
  })
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: vi.fn(),
  })
})

export const getBootstrapResponse = (url: string) => {
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
      blockOutputDefinitions,
    })
  }

  if (url.endsWith("/api/export-resume/lookup")) {
    return buildJsonResponse({
      resumedJob: null,
      resumeSummary: null,
      resumedScanResult: null,
    })
  }

  if (url.endsWith("/api/scan-blocks/jobs")) {
    return buildJsonResponse({ jobId: "block-scan-job" }, 202)
  }

  if (url.endsWith("/api/scan-blocks/jobs/block-scan-job")) {
    return buildJsonResponse({
      id: "block-scan-job",
      status: "completed",
      total: 1,
      completed: 1,
      failed: 0,
      detectedBlockOutputKeys: ["naver-se4:image"],
      error: null,
    })
  }

  if (url.endsWith("/api/upload-providers")) {
    return buildJsonResponse(uploadProviderCatalog)
  }

  return null
}

export const renderApp = () => {
  const user = userEvent.setup()
  render(<App />)
  return user
}

export const moveToDiagnosticsStep = async (user: ReturnType<typeof userEvent.setup>) => {
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
  await waitFor(() => {
    expect(document.querySelector('[data-step-view="links-options"]')).not.toBeNull()
  })
  await user.click(screen.getByRole("button", { name: "진단 설정" }))
  await waitFor(() => {
    expect(document.querySelector('[data-step-view="diagnostics-options"]')).not.toBeNull()
  })
}

export const startExportFromDiagnosticsStep = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "내보내기" }))
  await waitFor(() => {
    expect(document.querySelector('[data-step-view="markdown-review"]')).not.toBeNull()
  })
  await user.click(screen.getByRole("button", { name: "변환 시작" }))
}

export { defaultExportOptions, frontmatterFieldMeta, frontmatterFieldOrder, optionDescriptions }
