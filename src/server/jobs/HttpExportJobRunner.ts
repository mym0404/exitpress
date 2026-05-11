import type { ScanResult } from "../../domain/blog/Types.js"
import type { ExportRequest } from "../../domain/export-job/Types.js"
import type { JobStore } from "./JobStore.js"
import { NaverBlogExporter } from "../../exporting/workflow/NaverBlogExporter.js"
import { isAbortOperationError, throwIfAborted } from "../../infra/runtime/AbortOperation.js"
import { runWithLogSink } from "../../infra/runtime/Logger.js"
import { toErrorMessage } from "../../shared/error/ErrorUtils.js"
import { createCoalescedTaskRunner } from "./CoalescedTaskRunner.js"
import { buildResumableExportManifest, writeExportManifest } from "./ExportJobManifest.js"

export type HttpExportJobRunner = ReturnType<typeof createHttpExportJobRunner>

export const createHttpExportJobRunner = ({
  jobStore,
  jobScanResults,
}: {
  jobStore: JobStore
  jobScanResults: Map<string, ScanResult | null>
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
      const exporter = new NaverBlogExporter({
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
      scheduleJobManifestPersist(jobId)
      await manifestPersistRunner.flush(jobId)
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
