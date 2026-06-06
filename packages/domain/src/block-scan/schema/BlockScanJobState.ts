export const allBlockScanJobStatuses = ["queued", "running", "completed", "failed"] as const

// Lifecycle status for parser block discovery jobs.
export type BlockScanJobStatus = (typeof allBlockScanJobStatuses)[number]

// Tracks parser block discovery progress for the setup wizard.
export type BlockScanJobState = {
  id: string
  status: BlockScanJobStatus
  total: number
  completed: number
  failed: number
  detectedBlockTemplateKeys: string[]
  error: string | null
}
