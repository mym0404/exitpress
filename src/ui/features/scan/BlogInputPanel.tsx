import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card.js"
import { Input } from "../../components/ui/Input.js"
import { cn } from "../../lib/Cn.js"

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
  scanStatusTone: "default" | "error"
  onBlogIdOrUrlChange: (value: string) => void
  onOutputDirChange: (value: string) => void
  onOutputDirBlur: () => void
}) => (
  <Card variant="panel" className="hero-panel overflow-hidden">
    <CardHeader className="panel-header gap-3 p-5">
      <div className="space-y-2">
        <CardTitle className="section-title text-2xl">블로그 ID 또는 URL</CardTitle>
        <CardDescription className="panel-description max-w-3xl text-sm leading-7">
          네이버 블로그 ID나 주소와 결과를 저장할 경로를 먼저 정합니다.
        </CardDescription>
      </div>
    </CardHeader>
    <CardContent className="grid gap-3 p-5">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-foreground">블로그 ID 또는 URL</span>
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
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-foreground">출력 경로</span>
        <Input
          id="outputDir"
          value={outputDir}
          required
          onChange={(event) => onOutputDirChange(event.target.value)}
          onBlur={onOutputDirBlur}
        />
        <small className="text-sm leading-6 text-muted-foreground">결과를 저장할 위치입니다.</small>
      </label>
      <p
        id="scan-status"
        className={cn(
          "scan-status-note text-sm leading-7",
          scanStatusTone === "error" && "danger-copy",
        )}
      >
        {scanStatus}
      </p>
    </CardContent>
  </Card>
)
