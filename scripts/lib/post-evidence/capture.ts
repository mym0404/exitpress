import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { chromium, type Browser } from "playwright"

import { NaverBlog } from "../../../src/modules/blog/NaverBlog.js"
import { renderMarkdownPost } from "../../../src/modules/converter/MarkdownRenderer.js"
import { AssetStore } from "../../../src/modules/exporter/AssetStore.js"
import { buildMarkdownFilePath, getCategoryForPost } from "../../../src/modules/exporter/ExportPaths.js"
import type { SinglePostFetcher } from "../../../src/modules/exporter/SinglePostExport.js"
import { buildPostLinkTargets, createSameBlogPostLinkResolver } from "../../../src/modules/exporter/PostLinkRewriter.js"
import { NaverBlogFetcher } from "../../../src/modules/fetcher/NaverBlogFetcher.js"
import { parsePostHtmlWithBlockEvidence } from "../../../src/modules/parser/PostParser.js"
import { cloneExportOptions, defaultExportOptions } from "../../../src/modules/exporter/ExportOptions.js"
import type { AstBlock, ParsedPost } from "../../../src/modules/blocks/Types.js"
import type { ExportOptions } from "../../../src/modules/exporter/Types.js"
import type { PostSummary, ScanResult } from "../../../src/modules/blog/Types.js"
import { ensureDir, resolveRepoPath } from "../../../src/modules/common/FilePathUtils.js"
import { extractBlogId } from "../../../src/modules/common/NaverUrlUtils.js"
import { mapConcurrent } from "../../../src/modules/common/AsyncUtils.js"
import { toErrorMessage } from "../../../src/modules/common/ErrorUtils.js"
import { createSinglePostMetadataCachingFetcher } from "../single-post-metadata-cache.js"
import { readSinglePostOptions } from "../single-post-cli.js"
import type { EvidenceCase } from "./cases.js"
import { captureNaverPost } from "./playwright.js"
import {
  createDefaultEvidenceOutputDir,
  type EvidenceAssetProfile,
  resolveEvidenceOutputPaths,
  safeEvidencePathSegment,
  toMarkdownAssetPath,
} from "./paths.js"
import { renderEvidenceMarkdownSections, type EvidenceMarkdownSection } from "./evidence.js"

export type EvidenceRowReport = {
  blogId: string
  logNo: string
  target: EvidenceCase["target"]
  metadata: EvidenceCase["metadata"]
  sourceUrl: string
  naverCaptureAssetPath: string | null
  naverCapturePath: string | null
  markdown: string | null
  errors: string[]
}

export type PostEvidenceReport = {
  outputDir: string
  evidencePath: string
  reportPath: string
  assetDir: string
  errorCount: number
  rows: EvidenceRowReport[]
}

type BlogScan = ScanResult & {
  posts: PostSummary[]
}

const createDefaultEvidenceOptions = () => {
  const options = defaultExportOptions()

  options.assets.imageHandlingMode = "remote"
  options.assets.compressionEnabled = false
  options.assets.downloadImages = false
  options.assets.downloadThumbnails = false
  options.frontmatter.fields.exportedAt = false

  return options
}

const readEvidenceOptions = async (optionsPath: string | undefined) => {
  const options = optionsPath
    ? await readSinglePostOptions({
        optionsPath,
        readFile,
      })
    : createDefaultEvidenceOptions()

  return cloneExportOptions(options, {
    blockOutputDefinitions: new NaverBlog().getBlockOutputDefinitions(),
  })
}

const createRemoteAssetRecord = ({
  kind,
  sourceUrl,
}: {
  kind: "image" | "thumbnail"
  sourceUrl: string
}) => ({
  kind,
  sourceUrl,
  reference: sourceUrl,
  relativePath: null,
  storageMode: "remote" as const,
  uploadCandidate: null,
})

const createFragmentParsedPost = ({
  parsedPost,
  blocks,
}: {
  parsedPost: ParsedPost
  blocks: AstBlock[]
}): ParsedPost => ({
  tags: parsedPost.tags,
  blocks,
  videos: blocks
    .filter((block): block is Extract<AstBlock, { type: "video" }> => block.type === "video")
    .map((block) => block.video),
})

const selectTargetParsedPost = ({
  parsedPost,
  target,
}: {
  parsedPost: ParsedPost & {
    blockEvidence: Array<{
      path: string
      block: AstBlock
    }>
  }
  target: EvidenceCase["target"]
}) => {
  if (target.kind === "post") {
    return parsedPost
  }

  const blocks = parsedPost.blockEvidence
    .filter((evidence) => evidence.path === target.path || evidence.path.startsWith(`${target.path}.`))
    .map((evidence) => evidence.block)

  if (blocks.length === 0) {
    throw new Error(`inspect path에 대응하는 parsed block이 없습니다: ${target.path}`)
  }

  return createFragmentParsedPost({
    parsedPost,
    blocks,
  })
}

const createCaptureFilename = ({
  blogId,
  logNo,
  target,
  kind,
}: {
  blogId: string
  logNo: string
  target: EvidenceCase["target"]
  kind: "naver"
}) => {
  const targetSegment =
    target.kind === "post" ? "post" : `path-${safeEvidencePathSegment(target.path)}`
  const evidenceId = createHash("sha256")
    .update([blogId, logNo, targetSegment, kind].join("\n"))
    .digest("hex")
    .slice(0, 12)

  return `evidence-${evidenceId}-${targetSegment}-${kind}.png`
}

const renderEvidenceMarkdown = async ({
  blogId,
  logNo,
  outputDir,
  options,
  fetcher,
  scan,
  html,
  target,
}: {
  blogId: string
  logNo: string
  outputDir: string
  options: ExportOptions
  fetcher: SinglePostFetcher
  scan: BlogScan
  html: string
  target: EvidenceCase["target"]
}) => {
  const posts = scan.posts ?? []
  const post = posts.find((entry) => entry.logNo === logNo)

  if (!post) {
    throw new Error(`공개 글 메타데이터를 찾을 수 없습니다: ${blogId}/${logNo}`)
  }

  const categoryMap = new Map(scan.categories.map((category) => [category.id, category]))
  const category = getCategoryForPost({
    categories: categoryMap,
    categoryId: post.categoryId,
    categoryName: post.categoryName,
  })
  const markdownFilePath = buildMarkdownFilePath({
    outputDir,
    post,
    category,
    options,
  })
  const postLinkTargets = buildPostLinkTargets({
    outputDir,
    posts,
    categories: scan.categories,
    options,
  })
  const resolveLinkUrl = createSameBlogPostLinkResolver({
    blogId,
    markdownFilePath,
    options,
    targets: postLinkTargets,
  })
  const parsedPost = parsePostHtmlWithBlockEvidence({
    html,
    sourceUrl: post.source,
    options: {
      blockOutputs: options.blockOutputs,
      resolveLinkUrl,
    },
  })
  const targetParsedPost = selectTargetParsedPost({
    parsedPost,
    target,
  })
  const renderOptions = cloneExportOptions(
    {
      ...options,
      frontmatter: {
        ...options.frontmatter,
        enabled: target.kind === "post" ? options.frontmatter.enabled : false,
      },
      assets: {
        ...options.assets,
        thumbnailSource: target.kind === "post" ? options.assets.thumbnailSource : "none",
      },
    },
    {
      blockOutputDefinitions: new NaverBlog().getBlockOutputDefinitions(),
    },
  )
  const assetStore = new AssetStore({
    outputDir,
    downloader: fetcher,
    options: renderOptions,
  })
  const rendered = await renderMarkdownPost({
    post,
    category,
    parsedPost: targetParsedPost,
    markdownFilePath,
    options: renderOptions,
    resolveLinkUrl,
    resolveAsset:
      renderOptions.assets.imageHandlingMode === "remote" ||
      (!renderOptions.assets.downloadImages && !renderOptions.assets.downloadThumbnails)
        ? async ({ kind, sourceUrl }) => createRemoteAssetRecord({ kind, sourceUrl })
        : async (input) => assetStore.saveAsset(input),
  })

  return {
    editorType: new NaverBlog().getEditorForHtml(html)?.type ?? null,
    sourceUrl: post.source,
    markdown: rendered.markdown,
  }
}

const captureCase = async ({
  browser,
  evidenceCase,
  outputDir,
  evidencePath,
  assetDir,
  readBlogScan,
  readFetcher,
}: {
  browser: Browser
  evidenceCase: EvidenceCase
  outputDir: string
  evidencePath: string
  assetDir: string
  readBlogScan: (blogId: string) => Promise<BlogScan>
  readFetcher: (blogId: string) => Promise<SinglePostFetcher>
}): Promise<EvidenceRowReport> => {
  const blogId = extractBlogId(evidenceCase.blogId)
  const fetcher = await readFetcher(blogId)
  const options = await readEvidenceOptions(evidenceCase.optionsPath)
  const html = await fetcher.fetchPostHtml(evidenceCase.logNo)
  const errors: string[] = []
  let sourceUrl = `https://blog.naver.com/${blogId}/${evidenceCase.logNo}`
  let editorType: string | null = new NaverBlog().getEditorForHtml(html)?.type ?? null
  let markdown: string | null = null

  try {
    const rendered = await renderEvidenceMarkdown({
      blogId,
      logNo: evidenceCase.logNo,
      outputDir,
      options,
      fetcher,
      scan: await readBlogScan(blogId),
      html,
      target: evidenceCase.target,
    })

    editorType = rendered.editorType
    sourceUrl = rendered.sourceUrl
    markdown = rendered.markdown
  } catch (error) {
    errors.push(toErrorMessage(error))
  }

  const naverCapturePath = path.join(
    assetDir,
    createCaptureFilename({
      blogId,
      logNo: evidenceCase.logNo,
      target: evidenceCase.target,
      kind: "naver",
    }),
  )

  try {
    await captureNaverPost({
      browser,
      blogId,
      logNo: evidenceCase.logNo,
      editorType,
      inspectPath: evidenceCase.target.kind === "inspect-path" ? evidenceCase.target.path : undefined,
      outputPath: naverCapturePath,
    })
  } catch (error) {
    errors.push(`Naver capture failed: ${toErrorMessage(error)}`)
  }

  const naverCaptureFailed = errors.some((error) => error.startsWith("Naver capture failed"))

  return {
    blogId,
    logNo: evidenceCase.logNo,
    target: evidenceCase.target,
    metadata: evidenceCase.metadata,
    sourceUrl,
    naverCaptureAssetPath: naverCaptureFailed ? null : naverCapturePath,
    naverCapturePath: naverCaptureFailed
      ? null
      : toMarkdownAssetPath({
          markdownFilePath: evidencePath,
          assetPath: naverCapturePath,
        }),
    markdown,
    errors,
  }
}

export const createEvidenceMarkdownSections = ({
  rows,
  evidencePath,
}: {
  rows: EvidenceRowReport[]
  evidencePath: string
}): EvidenceMarkdownSection[] =>
  rows.map((row) => ({
    metadata: row.metadata,
    sourceUrl: row.sourceUrl,
    naverCapturePath: row.naverCaptureAssetPath
      ? toMarkdownAssetPath({
          markdownFilePath: evidencePath,
          assetPath: row.naverCaptureAssetPath,
        })
      : null,
    markdown: row.markdown,
  }))

export const capturePostEvidence = async ({
  cases,
  outputDir,
  assetProfile = "tmp",
  browser,
  metadataCachePath,
}: {
  cases: EvidenceCase[]
  outputDir?: string
  assetProfile?: EvidenceAssetProfile
  browser?: Browser
  metadataCachePath?: string
}): Promise<PostEvidenceReport> => {
  const firstCase = cases[0]

  if (!firstCase) {
    throw new Error("capture evidence case가 없습니다.")
  }

  const resolvedOutputDir = outputDir ?? createDefaultEvidenceOutputDir({
    blogId: firstCase.blogId,
    logNo: firstCase.logNo,
  })
  const paths = await resolveEvidenceOutputPaths({
    outputDir: resolvedOutputDir,
    assetProfile,
  })
  const ownedBrowser = browser ? null : await chromium.launch()
  const resolvedMetadataCachePath = metadataCachePath ? resolveRepoPath(metadataCachePath) : undefined
  const fetcherCache = new Map<string, Promise<SinglePostFetcher>>()
  const readFetcher = (blogId: string) => {
    const cached = fetcherCache.get(blogId)

    if (cached) {
      return cached
    }

    const fetcher = resolvedMetadataCachePath
      ? createSinglePostMetadataCachingFetcher({
          blogId,
          cachePath: resolvedMetadataCachePath,
          readFile,
          writeFile,
        })
      : Promise.resolve(new NaverBlogFetcher({ blogId }))

    fetcherCache.set(blogId, fetcher)
    return fetcher
  }
  const scanCache = new Map<string, Promise<BlogScan>>()
  const readBlogScan = (blogId: string) => {
    const cached = scanCache.get(blogId)

    if (cached) {
      return cached
    }

    const scan = readFetcher(blogId).then(async (fetcher) => {
      const [scanResult, posts] = await Promise.all([
        fetcher.scanBlog(),
        fetcher.getAllPosts(),
      ])

      return {
        ...scanResult,
        posts,
      }
    })

    scanCache.set(blogId, scan)
    return scan
  }

  try {
    const activeBrowser = browser ?? ownedBrowser

    if (!activeBrowser) {
      throw new Error("Playwright browser를 시작하지 못했습니다.")
    }

    const rows = await mapConcurrent({
      items: cases,
      concurrency: 2,
      mapper: async (evidenceCase) =>
        captureCase({
          browser: activeBrowser,
          evidenceCase,
          outputDir: paths.outputDir,
          evidencePath: paths.evidencePath,
          assetDir: paths.assetDir,
          readBlogScan,
          readFetcher,
        }),
    })
    const evidenceSections = createEvidenceMarkdownSections({
      rows,
      evidencePath: paths.evidencePath,
    })
    const errorCount = rows.reduce((count, row) => count + row.errors.length, 0)

    await ensureDir(path.dirname(paths.evidencePath))
    await writeFile(paths.evidencePath, renderEvidenceMarkdownSections(evidenceSections), "utf8")

    const report = {
      outputDir: paths.outputDir,
      evidencePath: paths.evidencePath,
      reportPath: paths.reportPath,
      assetDir: paths.assetDir,
      errorCount,
      rows,
    } satisfies PostEvidenceReport

    await writeFile(paths.reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")

    return report
  } finally {
    await ownedBrowser?.close()
  }
}
