import { vi } from "vitest"
import type { ScanResult } from "../../../src/domain/blog/Types.js"
import type { ExportJobState } from "../../../src/domain/export-job/Types.js"
import type {
  UploadProviderCatalogResponse,
  UploadProviderValue,
} from "../../../src/domain/upload/UploadProviderTypes.js"
import { NaverBlogFetcher } from "../../../src/integrations/naver-blog/NaverBlogFetcher.js"
import { createHttpServer } from "../../../src/server/http/HttpServer.js"
import { createTestPath } from "../test-paths.js"
import { rm } from "node:fs/promises"
import path from "node:path"

let testServerRootSequence = 0
const testServerRoots = new Set<string>()

export const uploadHtml = `
  <script>var data = { smartEditorVersion: 4 }</script>
  <div id="viewTypeSelector">
    <div class="se-component se-text">
      <script class="__se_module_data" data-module-v2='{"type":"v2_text"}'></script>
      <p class="se-text-paragraph">본문입니다.</p>
    </div>
    <div class="se-component se-image">
      <a class="se-module-image-link" data-linkdata='{"src":"https://example.com/image.png"}'>
        <img src="https://example.com/image.png" alt="diagram" />
      </a>
    </div>
  </div>
`

export const textOnlyHtml = `
  <script>var data = { smartEditorVersion: 4 }</script>
  <div id="viewTypeSelector">
    <div class="se-component se-text">
      <script class="__se_module_data" data-module-v2='{"type":"v2_text"}'></script>
      <p class="se-text-paragraph">텍스트만 있습니다.</p>
    </div>
  </div>
`

export const baseScanResult: ScanResult = {
  blogId: "mym0404",
  totalPostCount: 1,
  categories: [
    {
      id: 84,
      name: "PS 알고리즘, 팁",
      parentId: null,
      postCount: 1,
      isDivider: false,
      isOpen: true,
      path: ["PS 알고리즘, 팁"],
      depth: 0,
    },
  ],
}

export const createPosts = (thumbnailUrl: string | null) => [
  {
    blogId: "mym0404",
    logNo: "223034929697",
    title: "테스트 글",
    publishedAt: "2023-03-04T13:00:00+09:00",
    categoryId: 84,
    categoryName: "PS 알고리즘, 팁",
    source: "https://blog.naver.com/mym0404/223034929697",
    thumbnailUrl,
  },
]

export const createPost = ({
  logNo,
  title,
  thumbnailUrl,
}: {
  logNo: string
  title: string
  thumbnailUrl: string | null
}) => ({
  blogId: "mym0404",
  logNo,
  title,
  publishedAt: "2023-03-04T13:00:00+09:00",
  categoryId: 84,
  categoryName: "PS 알고리즘, 팁",
  source: `https://blog.naver.com/mym0404/${logNo}`,
  thumbnailUrl,
})

const nextPreviewSeed = (seed: number) => {
  let value = Math.imul(seed ^ (seed >>> 16), 2246822507) >>> 0
  value = Math.imul(value ^ (value >>> 13), 3266489909) >>> 0
  return (value ^ (value >>> 16)) >>> 0
}

export const createOversizedPreviewMarkdown = () => {
  let seed = 0x9e3779b9
  const lines = ["# oversized preview\n"]

  for (let index = 0; index < 1600; index++) {
    seed = nextPreviewSeed(seed + index + 1)
    const first = seed
    seed = nextPreviewSeed(seed)
    const second = seed
    const third = Math.imul(first, second) >>> 0

    lines.push(
      `- item ${index}: ${first.toString(36)} ${second.toString(36)} ${third.toString(36)}\n`,
    )
  }

  return lines.join("")
}

export const startServer = async (server: ReturnType<typeof createHttpServer>) => {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })

  const address = server.address()

  if (!address || typeof address === "string") {
    throw new Error("server did not bind to a numeric port")
  }

  return `http://127.0.0.1:${address.port}`
}

export const mockFetcher = ({
  html,
  thumbnailUrl,
}: {
  html: string
  thumbnailUrl: string | null
}) => {
  vi.spyOn(NaverBlogFetcher.prototype, "scanBlog").mockResolvedValue(baseScanResult)
  vi.spyOn(NaverBlogFetcher.prototype, "getAllPosts").mockResolvedValue(createPosts(thumbnailUrl))
  vi.spyOn(NaverBlogFetcher.prototype, "fetchPostHtml").mockResolvedValue(html)
  vi.spyOn(NaverBlogFetcher.prototype, "downloadBinary").mockResolvedValue()
  vi.spyOn(NaverBlogFetcher.prototype, "fetchBinary").mockResolvedValue({
    bytes: Buffer.from("image"),
    contentType: "image/png",
  })
}

export const waitForJob = async ({
  baseUrl,
  jobId,
  accept,
}: {
  baseUrl: string
  jobId: string
  accept: (job: ExportJobState) => boolean
}) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/export/${jobId}`)
    const job = (await response.json()) as ExportJobState

    if (accept(job)) {
      return job
    }

    await new Promise((resolve) => setTimeout(resolve, 25))
  }

  throw new Error(`timed out waiting for job ${jobId}`)
}

const uploadProviderCatalog: UploadProviderCatalogResponse = {
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
          placeholder: "",
        },
        {
          key: "token",
          label: "Token",
          description: "서비스 API 접근용 토큰을 입력합니다.",
          inputType: "password",
          required: true,
          defaultValue: null,
          placeholder: "",
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
          key: "secretId",
          label: "Secret ID",
          description: "서비스에서 발급한 secret ID를 입력합니다.",
          inputType: "text",
          required: true,
          defaultValue: null,
          placeholder: "",
        },
        {
          key: "port",
          label: "Port",
          description: "기본 포트 대신 사용할 포트 번호입니다.",
          inputType: "number",
          required: false,
          defaultValue: 0,
          placeholder: "",
        },
        {
          key: "permission",
          label: "Permission",
          description: "이미지 공개 범위 또는 접근 권한을 선택합니다.",
          inputType: "select",
          required: true,
          defaultValue: 0,
          placeholder: "",
          options: [
            { label: "Public", value: 0 },
            { label: "Private", value: 1 },
          ],
        },
        {
          key: "slim",
          label: "Slim",
          description: "COS 이미지 처리 압축 옵션을 함께 사용합니다.",
          inputType: "checkbox",
          required: false,
          defaultValue: false,
          placeholder: "",
        },
      ],
    },
  ],
}

const normalizeUploadProviderFields = (providerKey: string, input: unknown) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null
  }

  const provider = uploadProviderCatalog.providers.find((item) => item.key === providerKey)

  if (!provider) {
    return null
  }

  const values = input as Record<string, unknown>
  const entries: Array<readonly [string, UploadProviderValue]> = []

  for (const field of provider.fields) {
    const rawValue = values[field.key]

    if (rawValue === undefined || rawValue === null) {
      continue
    }

    if (field.inputType === "checkbox") {
      if (typeof rawValue === "boolean") {
        entries.push([field.key, rawValue] as const)
        continue
      }

      if (typeof rawValue === "string") {
        const normalized = rawValue.trim().toLowerCase()

        if (normalized === "true" || normalized === "1" || normalized === "on") {
          entries.push([field.key, true] as const)
          continue
        }

        if (normalized === "false" || normalized === "0" || normalized === "off") {
          entries.push([field.key, false] as const)
          continue
        }
      }

      continue
    }

    if (field.inputType === "number") {
      if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
        entries.push([field.key, rawValue] as const)
        continue
      }

      if (typeof rawValue === "string" && rawValue.trim()) {
        const parsed = Number(rawValue.trim())

        if (Number.isFinite(parsed)) {
          entries.push([field.key, parsed] as const)
        }
      }

      continue
    }

    if (field.inputType === "select") {
      const option = field.options?.find((item) => String(item.value) === String(rawValue))

      if (option) {
        entries.push([field.key, option.value] as const)
      }

      continue
    }

    if (typeof rawValue !== "string" || !rawValue.trim()) {
      continue
    }

    entries.push([field.key, rawValue.trim()] as const)
  }

  return entries.length > 0 ? Object.fromEntries(entries) : null
}

const createUploadProviderSourceStub = () => ({
  getCatalog: vi.fn(async () => uploadProviderCatalog),
  normalizeProviderFields: vi.fn(async (providerKey: string, value: unknown) =>
    normalizeUploadProviderFields(providerKey, value),
  ),
})

export const createTestHttpServer = (
  options: NonNullable<Parameters<typeof createHttpServer>[0]> = {},
) => {
  testServerRootSequence += 1
  const serverRoot = createTestPath("http-server", `server-${testServerRootSequence}`)

  testServerRoots.add(serverRoot)

  return createHttpServer({
    settingsPath: options.settingsPath ?? path.join(serverRoot, "export-ui-settings.json"),
    scanCachePath: options.scanCachePath ?? path.join(serverRoot, "scan-cache.json"),
    uploadProviderSource: createUploadProviderSourceStub(),
    ...options,
  })
}

export const createUploadPayload = (
  providerFields: Record<string, UploadProviderValue>,
  providerKey = "github",
) => ({
  providerKey,
  providerFields,
})

export const cleanupTestServerRoots = async () => {
  await Promise.all(
    Array.from(testServerRoots, async (serverRoot) => {
      await rm(serverRoot, { recursive: true, force: true })
    }),
  )
  testServerRoots.clear()
}
