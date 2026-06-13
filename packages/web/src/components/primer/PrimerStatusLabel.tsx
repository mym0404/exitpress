import { Label } from "@primer/react"

export const PrimerStatusLabel = ({ status, children }: { status: string; children: string }) => {
  const variant =
    status === "failed" || status === "error" || status === "upload-failed"
      ? "danger"
      : status === "running" || status === "queued" || status === "uploading"
        ? "accent"
        : status === "ready" || status === "completed" || status === "upload-completed"
          ? "success"
          : "secondary"

  return <Label variant={variant}>{children}</Label>
}
