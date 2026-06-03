import type { EditorBlockOutputDefinition } from "../../domain/ast/Types.js"
import type { ScanResult } from "../../domain/blog/Types.js"
import type { ExportOptions } from "../../domain/export-options/Types.js"
import type { NaverBlogFetcherCache } from "../../integrations/naver-blog/NaverBlogFetcher.js"

import type { BlockScanJobStore } from "./BlockScanJobStore.js"

import {
  blockDetectionConcurrency,
  detectPostBlockOutputKeys,
} from "../../exporting/workflow/DetectedBlockOutputScanner.js"
import { filterPostsByScope } from "../../exporting/workflow/ExportScope.js"
import { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"
import { mapConcurrent } from "../../shared/async/AsyncUtils.js"
import { toErrorMessage } from "../../shared/error/ErrorUtils.js"

export type BlockScanJobRunner = ReturnType<typeof createBlockScanJobRunner>

const sortDetectedKeys = ({
  keys,
  blockOutputDefinitions,
}: {
  keys: string[]
  blockOutputDefinitions: EditorBlockOutputDefinition[]
}) => {
  const blockOutputKeyOrder = new Map(
    blockOutputDefinitions.map((definition, index) => [definition.key, index]),
  )

  return [...keys].sort(
    (left, right) =>
      (blockOutputKeyOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (blockOutputKeyOrder.get(right) ?? Number.MAX_SAFE_INTEGER) || left.localeCompare(right),
  )
}

export const createBlockScanJobRunner = ({
  jobStore,
  blockOutputDefinitions,
  postHtmlCache,
}: {
  jobStore: BlockScanJobStore
  blockOutputDefinitions: EditorBlockOutputDefinition[]
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
            const keys = detectPostBlockOutputKeys({
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
          keys: currentJob.detectedBlockOutputKeys,
          blockOutputDefinitions,
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
