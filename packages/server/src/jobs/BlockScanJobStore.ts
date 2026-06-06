import { randomUUID } from "node:crypto"

import type { BlockScanJobState } from "@exitpress/domain/block-scan/schema/BlockScanJobState.js"

const cloneJob = (job: BlockScanJobState): BlockScanJobState => ({
  ...job,
  detectedBlockTemplateKeys: [...job.detectedBlockTemplateKeys],
})

export class BlockScanJobStore {
  readonly jobs = new Map<string, BlockScanJobState>()

  create({ total }: { total: number }) {
    const job: BlockScanJobState = {
      id: randomUUID(),
      status: "queued",
      total,
      completed: 0,
      failed: 0,
      detectedBlockTemplateKeys: [],
      error: null,
    }

    this.jobs.set(job.id, job)
    return cloneJob(job)
  }

  get(jobId: string) {
    const job = this.jobs.get(jobId)
    return job ? cloneJob(job) : null
  }

  start(jobId: string) {
    this.update(jobId, (job) => {
      job.status = "running"
    })
  }

  completePost(jobId: string, detectedBlockTemplateKeys: string[]) {
    this.update(jobId, (job) => {
      job.completed += 1
      job.detectedBlockTemplateKeys = Array.from(
        new Set([...job.detectedBlockTemplateKeys, ...detectedBlockTemplateKeys]),
      )
    })
  }

  failPost(jobId: string, error: string) {
    this.update(jobId, (job) => {
      job.failed += 1
      job.error = error
    })
  }

  complete(jobId: string, detectedBlockTemplateKeys: string[]) {
    this.update(jobId, (job) => {
      job.status = "completed"
      job.detectedBlockTemplateKeys = detectedBlockTemplateKeys
      job.error = null
    })
  }

  fail(jobId: string, error: string) {
    this.update(jobId, (job) => {
      job.status = "failed"
      job.error = error
    })
  }

  private update(jobId: string, updater: (job: BlockScanJobState) => void) {
    const job = this.jobs.get(jobId)

    if (!job) {
      return
    }

    updater(job)
  }
}
