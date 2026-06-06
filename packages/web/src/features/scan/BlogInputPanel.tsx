import { Alert } from "../../components/ui/Alert.js"
import { Card, CardContent } from "../../components/ui/Card.js"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../../components/ui/Field.js"
import { Input } from "../../components/ui/Input.js"
import { cn } from "../../lib/Cn.js"

const allScanStatusTones = ["default", "error"] as const
export type ScanStatusTone = (typeof allScanStatusTones)[number]

export const BlogInputPanel = ({
  blogIdOrUrl,
  outputDir,
  scanPending,
  scanStatus,
  scanStatusTone,
  onBlogIdOrUrlChange,
  onOutputDirChange,
  onOutputDirBlur,
}: {
  blogIdOrUrl: string
  outputDir: string
  scanPending: boolean
  scanStatus: string
  scanStatusTone: ScanStatusTone
  onBlogIdOrUrlChange: (value: string) => void
  onOutputDirChange: (value: string) => void
  onOutputDirBlur: () => void
}) => (
  <Card variant="panel" className="hero-panel overflow-hidden">
    <CardContent className="grid gap-4 p-5">
      <FieldGroup className="gap-3 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-start">
        <Field invalid={scanStatusTone === "error"} disabled={scanPending}>
          <FieldLabel htmlFor="blogIdOrUrl">블로그 ID 또는 URL</FieldLabel>
          <Input
            id="blogIdOrUrl"
            placeholder="mym0404 또는 https://blog.naver.com/..."
            disabled={scanPending}
            value={blogIdOrUrl}
            aria-invalid={scanStatusTone === "error" || undefined}
            className={
              scanStatusTone === "error"
                ? "border-[var(--destructive)] shadow-[var(--panel-shadow-border),0_0_0_1px_color-mix(in_srgb,var(--destructive)_18%,transparent)]"
                : undefined
            }
            onChange={(event) => onBlogIdOrUrlChange(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="outputDir">출력 경로</FieldLabel>
          <Input
            id="outputDir"
            value={outputDir}
            required
            onChange={(event) => onOutputDirChange(event.target.value)}
            onBlur={onOutputDirBlur}
          />
          <FieldDescription>결과를 저장할 위치입니다.</FieldDescription>
        </Field>
      </FieldGroup>
      <Alert
        id="scan-status"
        className={cn(
          "scan-status-note rounded-xl px-3 py-2.5",
          scanStatusTone === "error" &&
            "danger-copy border-[color-mix(in_srgb,var(--destructive)_28%,transparent)] bg-[var(--status-error-bg)]",
        )}
      >
        {scanStatus}
      </Alert>
    </CardContent>
  </Card>
)
