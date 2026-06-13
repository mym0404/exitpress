import { filterPostsByScope } from "@exitpress/domain/export-scope/ExportScope.js"
import { mapConcurrent } from "@exitpress/engine/shared/async/util/AsyncTasks.js"
import { toErrorMessage } from "@exitpress/engine/shared/error/util/toErrorMessage.js"

import type { BlogPostRef, BlogSource } from "@exitpress/domain/blog/schema/Blog.js"
import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { BlogPostContentCache } from "@exitpress/engine/blog/Blog.js"
import type { BlogRegistry } from "@exitpress/engine/blog/BlogRegistry.js"

import type { BlockScanJobStore } from "./BlockScanJobStore.js"

// Runtime controller for parser block discovery jobs.
export type BlockScanJobRunner = ReturnType<typeof createBlockScanJobRunner>

const blockDetectionConcurrency = 3

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
  blogRegistry,
  blockTemplateDefinitions,
  postHtmlCache,
}: {
  jobStore: BlockScanJobStore
  blogRegistry: BlogRegistry
  blockTemplateDefinitions: BlockTemplateDefinition[]
  postHtmlCache: BlogPostContentCache
}) => {
  const startJob = ({
    source,
    scanResult,
    options,
  }: {
    source: BlogSource
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

      const blog = blogRegistry.require(scanResult.blogKey)

      await mapConcurrent({
        items: posts,
        concurrency: blockDetectionConcurrency,
        mapper: async (post) => {
          try {
            const blogPost: BlogPostRef = {
              blogKey: post.blogKey,
              sourceId: post.sourceId,
              postId: post.postId,
              title: post.title,
              sourceUrl: post.source,
              publishedAt: post.publishedAt,
              categoryId: post.categoryId,
              categoryName: post.categoryName,
              thumbnailUrl: post.thumbnailUrl ?? undefined,
            }
            const content = await blog.loadPostContent({
              source,
              post: blogPost,
              cache: postHtmlCache,
            })
            const parsed = blog.parseContent({
              source,
              post: blogPost,
              content,
              options,
            })
            const keys = parsed.blocks.map((block) => block.blockId)
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
