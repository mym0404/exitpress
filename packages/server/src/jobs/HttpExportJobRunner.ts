import { UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import { BlogExportWorkflow } from "@exitpress/engine/exporting/blog/BlogExportWorkflow.js"
import { runImageUploadPhase } from "@exitpress/engine/exporting/upload/ImageUploadPhase.js"
import {
  rewriteImageUploadPost,
  writeImageUploadManifestSnapshot,
} from "@exitpress/engine/exporting/upload/ImageUploadRewriter.js"
import {
  isAbortOperationError,
  throwIfAborted,
} from "@exitpress/engine/infra/runtime/AbortOperation.js"
import { runWithLogSink } from "@exitpress/engine/infra/runtime/Logger.js"
import { toErrorMessage } from "@exitpress/engine/shared/error/util/toErrorMessage.js"

import type { ScanResult } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportRequest } from "@exitpress/domain/export-job/schema/ExportRequest.js"
import type { BlogPostContentCache } from "@exitpress/engine/blog/Blog.js"
import type { BlogRegistry } from "@exitpress/engine/blog/BlogRegistry.js"

import type { JobStore } from "./JobStore.js"

import { normalizeUploaderConfig } from "../upload/HttpUploadConfig.js"
import { runUploadForJob } from "../upload/HttpUploadJob.js"

import { createCoalescedTaskRunner } from "./CoalescedTaskRunner.js"
import { buildResumableExportManifest, writeExportManifest } from "./ExportJobManifest.js"

// Runtime controller for export jobs and manifest persistence.
export type HttpExportJobRunner = ReturnType<typeof createHttpExportJobRunner>

// Starts and tracks export jobs while keeping resumable manifests up to date.
export const createHttpExportJobRunner = ({
  jobStore,
  blogRegistry,
  jobScanResults,
  postHtmlCache,
  uploadPhaseRunner = runImageUploadPhase,
  postUploadRewriter = rewriteImageUploadPost,
  manifestSnapshotWriter = writeImageUploadManifestSnapshot,
}: {
  jobStore: JobStore
  blogRegistry: BlogRegistry
  jobScanResults: Map<string, ScanResult | null>
  postHtmlCache?: BlogPostContentCache
  uploadPhaseRunner?: typeof runImageUploadPhase
  postUploadRewriter?: typeof rewriteImageUploadPost
  manifestSnapshotWriter?: typeof writeImageUploadManifestSnapshot
}) => {
  const activeJobTasks = new Map<
    string,
    {
      controller: AbortController
      promise: Promise<void>
    }
  >()

  const persistJobManifest = async (jobId: string) => {
    const job = jobStore.get(jobId)

    if (!job) {
      return
    }

    const manifest = buildResumableExportManifest({
      job,
      scanResult: jobScanResults.get(jobId) ?? null,
      sourceId: blogRegistry.require(job.request.blogKey).parseSource(job.request.sourceInput)
        .sourceId,
    })

    job.manifest = manifest

    await writeExportManifest({
      outputDir: job.request.outputDir,
      manifest,
    })
  }

  const manifestPersistRunner = createCoalescedTaskRunner({
    run: persistJobManifest,
  })

  const scheduleJobManifestPersist = (jobId: string) => {
    void manifestPersistRunner.schedule(jobId).catch((error) => {
      console.error(`failed to persist manifest for ${jobId}:`, error)
    })
  }

  const startTrackedJobTask = ({
    jobId,
    run,
  }: {
    jobId: string
    run: (signal: AbortSignal) => Promise<void>
  }) => {
    const controller = new AbortController()
    const promise = run(controller.signal).finally(() => {
      if (activeJobTasks.get(jobId)?.controller === controller) {
        activeJobTasks.delete(jobId)
      }
    })

    activeJobTasks.set(jobId, {
      controller,
      promise,
    })

    return promise
  }

  const abortActiveJobTask = async (jobId: string) => {
    const activeTask = activeJobTasks.get(jobId)

    if (!activeTask) {
      return
    }

    activeTask.controller.abort()

    try {
      await activeTask.promise
    } catch {}
  }

  const runExport = async ({
    jobId,
    request,
    cachedScanResult,
    resume,
    signal,
  }: {
    jobId: string
    request: ExportRequest
    cachedScanResult?: ScanResult | null
    resume?: boolean
    signal?: AbortSignal
  }) => {
    if (resume) {
      jobStore.resume(jobId)
    } else {
      jobStore.start(jobId)
    }
    await manifestPersistRunner.flush(jobId)

    try {
      const blog = blogRegistry.require(request.blogKey)
      const exporter = new BlogExportWorkflow({
        blog,
        request,
        cachedScanResult,
        resumeState: resume
          ? {
              items: jobStore.get(jobId)?.items ?? [],
              manifest: jobStore.get(jobId)?.manifest ?? null,
            }
          : null,
        writeManifestFile: false,
        abortSignal: signal,
        postContentCache: postHtmlCache,
        onProgress: (progress) => {
          jobStore.updateProgress(jobId, progress)
          scheduleJobManifestPersist(jobId)
        },
        onItem: (item) => {
          jobStore.appendItem(jobId, item)
          scheduleJobManifestPersist(jobId)
        },
      })
      const manifest = await runWithLogSink(
        (message) => {
          jobStore.appendLog(jobId, message)
          scheduleJobManifestPersist(jobId)
        },
        () => exporter.run(),
      )
      throwIfAborted(signal)

      jobStore.completeExport(jobId, manifest)
      const completedJob = jobStore.get(jobId)

      if (completedJob?.upload.status !== UPLOAD_STATUSES.UPLOAD_READY) {
        scheduleJobManifestPersist(jobId)
        await manifestPersistRunner.flush(jobId)
        return
      }

      if (!request.uploadProvider) {
        const message = "다운로드 후 업로드 설정이 없어 작업을 완료할 수 없습니다."

        jobStore.appendLog(jobId, message)
        jobStore.fail(jobId, message)
        await manifestPersistRunner.flush(jobId)
        return
      }

      await runUploadForJob({
        jobStore,
        uploadPhaseRunner,
        postUploadRewriter,
        manifestSnapshotWriter,
        flushManifestPersist: (nextJobId) => manifestPersistRunner.flush(nextJobId),
        scheduleJobManifestPersist,
        failJobOnError: true,
        jobId,
        uploaderKey: request.uploadProvider.providerKey,
        uploaderConfig: normalizeUploaderConfig({
          uploaderKey: request.uploadProvider.providerKey,
          providerFields: request.uploadProvider.providerFields,
        }),
        signal,
      })
    } catch (error) {
      const message = isAbortOperationError(error)
        ? "작업이 초기화되어 중단되었습니다."
        : toErrorMessage(error)
      jobStore.appendLog(jobId, message)
      jobStore.fail(jobId, message)
      await manifestPersistRunner.flush(jobId)
    }
  }

  return {
    abortActiveJobTask,
    flushManifestPersist: (jobId: string) => manifestPersistRunner.flush(jobId),
    runExport,
    scheduleJobManifestPersist,
    startTrackedJobTask,
  }
}
