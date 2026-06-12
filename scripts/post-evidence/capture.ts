import { createHash } from "node:crypto"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import { extractSourceId, extractNaverBlogPostIdentity } from "@exitpress/blog-naver/NaverUrl.js"
import { parsePostHtmlWithBlockEvidence } from "@exitpress/blog-naver/parsing/naver-blog/core/PostParser.js"
import { createNaverBlogDefaultBlockTemplateMap } from "@exitpress/blog-naver/parsing/naver-blog/NaverBlog.js"
import { NaverBlog } from "@exitpress/blog-naver/parsing/naver-blog/NaverBlog.js"
import {
  cloneExportOptions,
  defaultExportOptions,
} from "@exitpress/domain/export-options/ExportOptions.js"
import { AssetStore } from "@exitpress/engine/exporting/assets/AssetStore.js"
import {
  buildMarkdownFilePath,
  getCategoryForPost,
} from "@exitpress/engine/exporting/paths/ExportPaths.js"
import {
  buildPostLinkTargets,
  createPostLinkResolver,
} from "@exitpress/engine/exporting/paths/PostLinkRewriter.js"
import { ensureDir, resolveRepoPath } from "@exitpress/engine/infra/node/FilePaths.js"
import { renderMarkdownPost } from "@exitpress/engine/markdown/util/renderMarkdownPost.js"
import { mapConcurrent } from "@exitpress/engine/shared/async/util/AsyncTasks.js"
import { toErrorMessage } from "@exitpress/engine/shared/error/util/toErrorMessage.js"
import { chromium } from "playwright"

import type { SinglePostFetcher } from "@exitpress/blog-naver/exporting/SinglePostExport.js"
import type { PostSummary, ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { UploadCandidateKind } from "@exitpress/domain/export-job/schema/UploadState.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { ParsedPost } from "@exitpress/domain/parser/schema/ParsedPost.js"
import type { Browser } from "playwright"

import type { EvidenceCase } from "./cases.js"
import type { EvidenceMarkdownSection } from "./evidence.js"
import type { EvidenceAssetProfile } from "./paths.js"

import { createSinglePostMetadataCachingFetcher } from "../single-post/MetadataCache.js"
import { readSinglePostOptions } from "../single-post/SinglePostOptions.js"

import { renderEvidenceMarkdownSections } from "./evidence.js"
import {
  createDefaultEvidenceOutputDir,
  resolveEvidenceOutputPaths,
  safeEvidencePathSegment,
  toMarkdownAssetPath,
} from "./paths.js"
import { captureBlogPost } from "./playwright.js"

// Evidence row produced for one captured blog post target.
export type EvidenceRowReport = {
  blogKey: string
  sourceInput: string
  sourceId: string
  postId: string
  target: EvidenceCase["target"]
  metadata: EvidenceCase["metadata"]
  sourceUrl: string
  blogCaptureAssetPath: string | null
  blogCapturePath: string | null
  markdown: string | null
  errors: string[]
}

// Full evidence capture report written beside generated Markdown sections.
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

  return cloneExportOptions(options)
}

const createRemoteAssetRecord = ({
  kind,
  sourceUrl,
}: {
  kind: UploadCandidateKind
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
  blockIndexes,
}: {
  parsedPost: ParsedPost
  blockIndexes: number[]
}): ParsedPost => ({
  tags: parsedPost.tags,
  blocks: parsedPost.blocks.filter((_block, index) => blockIndexes.includes(index)),
})

const selectTargetParsedPost = ({
  parsedPost,
  target,
}: {
  parsedPost: ParsedPost & {
    blockEvidence: Array<{
      path: string
      blockIndexes: number[]
    }>
  }
  target: EvidenceCase["target"]
}) => {
  if (target.kind === "post") {
    return parsedPost
  }

  const blockIndexes = [
    ...new Set(
      parsedPost.blockEvidence
        .filter(
          (evidence) =>
            evidence.path === target.path || evidence.path.startsWith(`${target.path}.`),
        )
        .flatMap((evidence) => evidence.blockIndexes),
    ),
  ].sort((left, right) => left - right)

  if (blockIndexes.length === 0) {
    throw new Error(`inspect path에 대응하는 parsed block이 없습니다: ${target.path}`)
  }

  return createFragmentParsedPost({
    parsedPost,
    blockIndexes,
  })
}

const createCaptureFilename = ({
  sourceId,
  postId,
  target,
  kind,
}: {
  sourceId: string
  postId: string
  target: EvidenceCase["target"]
  kind: string
}) => {
  const targetSegment =
    target.kind === "post" ? "post" : `path-${safeEvidencePathSegment(target.path)}`
  const evidenceId = createHash("sha256")
    .update([sourceId, postId, targetSegment, kind].join("\n"))
    .digest("hex")
    .slice(0, 12)

  return `evidence-${evidenceId}-${targetSegment}-${kind}.png`
}

const renderEvidenceMarkdown = async ({
  sourceId,
  postId,
  outputDir,
  options,
  fetcher,
  scan,
  html,
  target,
}: {
  sourceId: string
  postId: string
  outputDir: string
  options: ExportOptions
  fetcher: SinglePostFetcher
  scan: BlogScan
  html: string
  target: EvidenceCase["target"]
}) => {
  const posts = scan.posts ?? []
  const post = posts.find((entry) => entry.postId === postId)

  if (!post) {
    throw new Error(`공개 글 메타데이터를 찾을 수 없습니다: ${sourceId}/${postId}`)
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
  const resolveLinkUrl = createPostLinkResolver({
    blogKey: "naver",
    sourceId,
    markdownFilePath,
    options,
    targets: postLinkTargets,
    resolveIdentity: (value) => {
      const identity = extractNaverBlogPostIdentity(value)
      return identity ? { blogKey: "naver", ...identity } : null
    },
  })
  const parsedPost = parsePostHtmlWithBlockEvidence({
    html,
    sourceUrl: post.source,
    options: {
      blockOutputs: options.blockOutputs,
      assets: options.assets,
      resolveLinkUrl,
    },
  })
  const targetParsedPost = selectTargetParsedPost({
    parsedPost,
    target,
  })
  const renderOptions = cloneExportOptions({
    ...options,
    frontmatter: {
      ...options.frontmatter,
      enabled: target.kind === "post" ? options.frontmatter.enabled : false,
    },
    assets: {
      ...options.assets,
      thumbnailSource: target.kind === "post" ? options.assets.thumbnailSource : "none",
    },
  })
  const assetStore = new AssetStore({
    outputDir,
    downloader: fetcher,
    options: renderOptions,
  })
  const rendered = await renderMarkdownPost({
    post,
    category,
    parsedPost: targetParsedPost,
    defaultBlockTemplates: createNaverBlogDefaultBlockTemplateMap(),
    markdownFilePath,
    options: renderOptions,
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
  readBlogScan: (sourceId: string) => Promise<BlogScan>
  readFetcher: (sourceId: string) => Promise<SinglePostFetcher>
}): Promise<EvidenceRowReport> => {
  if (evidenceCase.blogKey !== "naver") {
    throw new Error(`Unsupported blogKey for post evidence: ${evidenceCase.blogKey}`)
  }

  const sourceId = extractSourceId(evidenceCase.sourceId)
  const fetcher = await readFetcher(sourceId)
  const options = await readEvidenceOptions(evidenceCase.optionsPath)
  const html = await fetcher.fetchPostHtml(evidenceCase.postId)
  const errors: string[] = []
  let sourceUrl = `https://blog.naver.com/${sourceId}/${evidenceCase.postId}`
  let editorType: string | null = new NaverBlog().getEditorForHtml(html)?.type ?? null
  let markdown: string | null = null

  try {
    const rendered = await renderEvidenceMarkdown({
      sourceId,
      postId: evidenceCase.postId,
      outputDir,
      options,
      fetcher,
      scan: await readBlogScan(sourceId),
      html,
      target: evidenceCase.target,
    })

    editorType = rendered.editorType
    sourceUrl = rendered.sourceUrl
    markdown = rendered.markdown
  } catch (error) {
    errors.push(toErrorMessage(error))
  }

  const blogCapturePath = path.join(
    assetDir,
    createCaptureFilename({
      sourceId,
      postId: evidenceCase.postId,
      target: evidenceCase.target,
      kind: evidenceCase.blogKey,
    }),
  )

  try {
    await captureBlogPost({
      blogKey: evidenceCase.blogKey,
      browser,
      sourceId,
      postId: evidenceCase.postId,
      editorType,
      inspectPath:
        evidenceCase.target.kind === "inspect-path" ? evidenceCase.target.path : undefined,
      outputPath: blogCapturePath,
    })
  } catch (error) {
    errors.push(`source capture failed: ${toErrorMessage(error)}`)
  }

  const blogCaptureFailed = errors.some((error) => error.startsWith("source capture failed"))

  return {
    blogKey: evidenceCase.blogKey,
    sourceInput: evidenceCase.sourceInput,
    sourceId,
    postId: evidenceCase.postId,
    target: evidenceCase.target,
    metadata: evidenceCase.metadata,
    sourceUrl,
    blogCaptureAssetPath: blogCaptureFailed ? null : blogCapturePath,
    blogCapturePath: blogCaptureFailed
      ? null
      : toMarkdownAssetPath({
          markdownFilePath: evidencePath,
          assetPath: blogCapturePath,
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
    blogCapturePath: row.blogCaptureAssetPath
      ? toMarkdownAssetPath({
          markdownFilePath: evidencePath,
          assetPath: row.blogCaptureAssetPath,
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

  const resolvedOutputDir =
    outputDir ??
    createDefaultEvidenceOutputDir({
      sourceId: firstCase.sourceId,
      postId: firstCase.postId,
    })
  const paths = await resolveEvidenceOutputPaths({
    outputDir: resolvedOutputDir,
    assetProfile,
  })
  const ownedBrowser = browser ? null : await chromium.launch()
  const resolvedMetadataCachePath = metadataCachePath
    ? resolveRepoPath(metadataCachePath)
    : undefined
  const fetcherCache = new Map<string, Promise<SinglePostFetcher>>()
  const readFetcher = (sourceId: string) => {
    const cached = fetcherCache.get(sourceId)

    if (cached) {
      return cached
    }

    const fetcher = resolvedMetadataCachePath
      ? createSinglePostMetadataCachingFetcher({
          blogKey: "naver",
          sourceId,
          cachePath: resolvedMetadataCachePath,
          readFile,
          writeFile,
          createFetcher: ({ sourceId: fetcherSourceId }) =>
            new NaverBlogFetcher({
              sourceId: fetcherSourceId,
            }),
        })
      : Promise.resolve(
          new NaverBlogFetcher({
            sourceId: sourceId,
          }),
        )

    fetcherCache.set(sourceId, fetcher)
    return fetcher
  }
  const scanCache = new Map<string, Promise<BlogScan>>()
  const readBlogScan = (sourceId: string) => {
    const cached = scanCache.get(sourceId)

    if (cached) {
      return cached
    }

    const scan = readFetcher(sourceId).then(async (fetcher) => {
      const [scanResult, posts] = await Promise.all([fetcher.scanBlog(), fetcher.getAllPosts()])

      return {
        ...scanResult,
        posts,
      }
    })

    scanCache.set(sourceId, scan)
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
