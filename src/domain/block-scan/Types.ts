export type BlockScanJobStatus = "queued" | "running" | "completed" | "failed"

export type BlockScanJobState = {
  id: string
  status: BlockScanJobStatus
  total: number
  completed: number
  failed: number
  detectedBlockOutputKeys: string[]
  error: string | null
}
