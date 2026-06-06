type BlockScanJobStatus = "queued" | "running" | "completed" | "failed"

export type BlockScanJobState = {
  id: string
  status: BlockScanJobStatus
  total: number
  completed: number
  failed: number
  detectedBlockTemplateKeys: string[]
  error: string | null
}
