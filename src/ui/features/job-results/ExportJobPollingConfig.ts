import type { ExportJobPollingConfig } from "../../../domain/export-job/Types.js"

const defaultJobPollingConfig: ExportJobPollingConfig = {
  defaultPollMs: 1000,
  fastPollMs: 250,
  uploadBurstPollMs: 200,
  uploadBurstAttempts: 12,
}

let activeJobPollingConfig = defaultJobPollingConfig

const normalizePositiveInteger = (value: unknown, fallback: number) => {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const getExportJobPollingConfig = () => activeJobPollingConfig

export const setExportJobPollingConfig = (config?: Partial<ExportJobPollingConfig>) => {
  if (!config) {
    activeJobPollingConfig = defaultJobPollingConfig
    return
  }

  activeJobPollingConfig = {
    defaultPollMs: normalizePositiveInteger(
      config.defaultPollMs,
      defaultJobPollingConfig.defaultPollMs,
    ),
    fastPollMs: normalizePositiveInteger(config.fastPollMs, defaultJobPollingConfig.fastPollMs),
    uploadBurstPollMs: normalizePositiveInteger(
      config.uploadBurstPollMs,
      defaultJobPollingConfig.uploadBurstPollMs,
    ),
    uploadBurstAttempts: normalizePositiveInteger(
      config.uploadBurstAttempts,
      defaultJobPollingConfig.uploadBurstAttempts,
    ),
  }
}
