import { createHash } from "node:crypto"
import * as fs from "node:fs/promises"
import { readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { defaultExportOptions } from "../../../src/domain/export-options/ExportOptions.js"
import { rewriteUploadedAssets } from "../../../src/exporting/upload/ImageUploadRewriter.js"
import { NaverBlogExporter } from "../../../src/exporting/workflow/NaverBlogExporter.js"
import { runWithLogSink } from "../../../src/infra/runtime/Logger.js"
import { NaverBlogFetcher } from "../../../src/integrations/naver-blog/NaverBlogFetcher.js"
import { createTestTempDir } from "../test-paths.js"

export const scanResult = {
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

export const posts = [
  {
    blogId: "mym0404",
    logNo: "223034929697",
    title: "테스트 글",
    publishedAt: "2023-03-04T13:00:00+09:00",
    categoryId: 84,
    categoryName: "PS 알고리즘, 팁",
    source: "https://blog.naver.com/mym0404/223034929697",
    thumbnailUrl: "https://example.com/thumb.png",
  },
]

export const parallelPosts = [
  posts[0],
  {
    ...posts[0],
    logNo: "223034929698",
    title: "두번째 글",
    source: "https://blog.naver.com/mym0404/223034929698",
  },
]

export const postHtml = `
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
      <p class="se-image-caption">caption</p>
    </div>
  </div>
`

export const unsupportedSe3Html = `
  <div id="viewTypeSelector">
    <div class="se_component_wrap sect_dsc">
      <div class="se_component se_text">
        <div class="se_textarea">본문 시작입니다.</div>
      </div>
      <div class="se_component se_horizontalLine default">
        <div class="se_horizontalLineView">
          <div class="se_hr"><hr></div>
        </div>
      </div>
      <div class="se_component se_unknown default">
        <div class="se_unknown_view">지원하지 않는 블록입니다.</div>
      </div>
      <div class="se_component se_oglink og_bSize ">
        <div class="se_viewArea se_og_wrap">
          <a class="se_og_box" href="https://blog.naver.com/is02019/221072284462" target="_blank">
            <div class="se_og_thumb">
              <img src="https://dthumb-phinf.pstatic.net/sample.jpg?type=ff500_300" alt="">
            </div>
            <div class="se_og_txt">
              <div class="se_og_tit">비타는 삶이다</div>
              <div class="se_og_desc">PS Vita 리뷰</div>
              <div class="se_og_cp">blog.naver.com</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
`

const sharedAssetHash = createHash("sha256").update("image").digest("hex")
export const sharedPublicPath = `../../public/${sharedAssetHash}.png`
export const sharedLocalPath = `public/${sharedAssetHash}.png`

export const createUploadReadyFixture = ({ outputDir }: { outputDir: string }) => {
  const outputPath = "PS-알고리즘-팁/2023-03-04-테스트-글/index.md"
  const markdown = `---
title: 테스트 글
thumbnail: ${sharedPublicPath}
assetPaths:
  - ${sharedPublicPath}
---

![diagram](${sharedPublicPath})
`

  return {
    markdown,
    markdownPath: path.join(outputDir, outputPath),
    manifest: {
      blogId: "mym0404",
      profile: "gfm" as const,
      options: defaultExportOptions(),
      selectedCategoryIds: [],
      startedAt: "2026-04-17T04:00:00.000Z",
      finishedAt: "2026-04-17T04:00:01.000Z",
      totalPosts: 1,
      successCount: 1,
      failureCount: 0,
      upload: {
        status: "upload-ready" as const,
        eligiblePostCount: 1,
        candidateCount: 1,
        uploadedCount: 0,
        failedCount: 0,
        terminalReason: null,
      },
      categories: scanResult.categories,
      posts: [
        {
          logNo: posts[0].logNo,
          title: posts[0].title,
          source: posts[0].source,
          category: {
            id: scanResult.categories[0]!.id,
            name: scanResult.categories[0]!.name,
            path: scanResult.categories[0]!.path,
          },
          status: "success" as const,
          outputPath,
          assetPaths: [sharedPublicPath],
          upload: {
            eligible: true,
            candidateCount: 1,
            uploadedCount: 0,
            failedCount: 0,
            candidates: [
              {
                kind: "thumbnail" as const,
                sourceUrl: "https://example.com/thumb.png",
                localPath: sharedLocalPath,
                markdownReference: sharedPublicPath,
              },
            ],
            uploadedUrls: [],
            rewriteStatus: "pending" as const,
            rewrittenAt: null,
          },
          error: null,
        },
      ],
    },
  }
}

export const createHtmlFragmentUploadReadyFixture = ({ outputDir }: { outputDir: string }) => {
  const outputPath = "PS-알고리즘-팁/2023-03-04-테스트-글/index.md"
  const markdown = `<a data-naver-block="se3-oglink" data-size="og_bSize" href="https://blog.naver.com/is02019/221072284462">
  <img src="${sharedPublicPath}" alt="">
  <strong>비타는 삶이다</strong>
</a>
`

  return {
    markdown,
    markdownPath: path.join(outputDir, outputPath),
    manifest: {
      blogId: "mym0404",
      profile: "gfm" as const,
      options: defaultExportOptions(),
      selectedCategoryIds: [],
      startedAt: "2026-04-17T04:00:00.000Z",
      finishedAt: "2026-04-17T04:00:01.000Z",
      totalPosts: 1,
      successCount: 1,
      failureCount: 0,
      upload: {
        status: "upload-ready" as const,
        eligiblePostCount: 1,
        candidateCount: 1,
        uploadedCount: 0,
        failedCount: 0,
        terminalReason: null,
      },
      categories: scanResult.categories,
      posts: [
        {
          logNo: posts[0].logNo,
          title: posts[0].title,
          source: posts[0].source,
          category: {
            id: scanResult.categories[0]!.id,
            name: scanResult.categories[0]!.name,
            path: scanResult.categories[0]!.path,
          },
          status: "success" as const,
          outputPath,
          assetPaths: [sharedPublicPath],
          upload: {
            eligible: true,
            candidateCount: 1,
            uploadedCount: 0,
            failedCount: 0,
            candidates: [
              {
                kind: "image" as const,
                sourceUrl: "https://dthumb-phinf.pstatic.net/sample.jpg?type=ff500_300",
                localPath: sharedLocalPath,
                markdownReference: sharedPublicPath,
              },
            ],
            uploadedUrls: [],
            rewriteStatus: "pending" as const,
            rewrittenAt: null,
          },
          error: null,
        },
      ],
    },
  }
}

export {
  createTestTempDir,
  defaultExportOptions,
  fs,
  NaverBlogExporter,
  NaverBlogFetcher,
  path,
  readFile,
  rewriteUploadedAssets,
  rm,
  runWithLogSink,
  writeFile,
}
