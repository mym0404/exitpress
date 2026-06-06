import { filterPostsByScope } from "@exitpress/domain/export-scope/ExportScope.js"
import {
  blockDetectionConcurrency,
  detectPostBlockTemplateKeys,
} from "@exitpress/engine/exporting/workflow/DetectedBlockTemplateScanner.js"
import { NaverBlogFetcher } from "@exitpress/engine/integrations/naver-blog/NaverBlogFetcher.js"
import { mapConcurrent } from "@exitpress/engine/shared/async/util/AsyncTasks.js"
import { toErrorMessage } from "@exitpress/engine/shared/error/util/toErrorMessage.js"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { NaverBlogFetcherCache } from "@exitpress/engine/integrations/naver-blog/NaverBlogFetcher.js"

import type { BlockScanJobStore } from "./BlockScanJobStore.js"

// Runtime controller for parser block discovery jobs.
export type BlockScanJobRunner = ReturnType<typeof createBlockScanJobRunner>

const sortDetectedKeys = ({
  keys,
  blockTemplateDefinitions,
}: {
  keys: string[]
  blockTemplateDefinitions: BlockTemplateDefinition[]
}) => {
  const blockTemplateKeyOrder = new Map(
    blockTemplateDefinitions.map((definition, index) => [definition.key, index]),
  )

  return [...keys].sort(
    (left, right) =>
      (blockTemplateKeyOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (blockTemplateKeyOrder.get(right) ?? Number.MAX_SAFE_INTEGER) || left.localeCompare(right),
  )
}

// Scans selected posts to detect which block template options are needed.
export const createBlockScanJobRunner = ({
  jobStore,
  blockTemplateDefinitions,
  postHtmlCache,
}: {
  jobStore: BlockScanJobStore
  blockTemplateDefinitions: BlockTemplateDefinition[]
  postHtmlCache: NaverBlogFetcherCache
}) => {
  const startJob = ({
    scanResult,
    options,
  }: {
    scanResult: ScanResult & { posts: NonNullable<ScanResult["posts"]> }
    options: ExportOptions
  }) => {
    const posts = filterPostsByScope({
      posts: scanResult.posts,
      categories: scanResult.categories,
      options,
    })
    const job = jobStore.create({
      total: posts.length,
    })

    void (async () => {
      jobStore.start(job.id)

      const fetcher = new NaverBlogFetcher({
        blogId: scanResult.blogId,
        cache: postHtmlCache,
      })

      await mapConcurrent({
        items: posts,
        concurrency: blockDetectionConcurrency,
        mapper: async (post) => {
          try {
            const html = await fetcher.fetchPostHtml(post.logNo)
            const keys = detectPostBlockTemplateKeys({
              html,
              sourceUrl: post.source,
              options,
            })
            jobStore.completePost(job.id, keys)
          } catch (error) {
            jobStore.failPost(job.id, toErrorMessage(error))
          }
        },
      })

      const currentJob = jobStore.get(job.id)

      if (!currentJob) {
        return
      }

      if (currentJob.total > 0 && currentJob.completed === 0) {
        jobStore.fail(job.id, currentJob.error ?? "Markdown 블록 확인에 실패했습니다.")
        return
      }

      jobStore.complete(
        job.id,
        sortDetectedKeys({
          keys: currentJob.detectedBlockTemplateKeys,
          blockTemplateDefinitions,
        }),
      )
    })().catch((error) => {
      jobStore.fail(job.id, toErrorMessage(error))
    })

    return job
  }

  return {
    getJob: (jobId: string) => jobStore.get(jobId),
    startJob,
  }
}
