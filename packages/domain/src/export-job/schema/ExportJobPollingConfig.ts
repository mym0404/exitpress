// Client polling cadence for export and upload phases.
export type ExportJobPollingConfig = {
  defaultPollMs: number
  fastPollMs: number
  uploadBurstPollMs: number
  uploadBurstAttempts: number
}
