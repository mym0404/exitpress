import type { RefObject } from "react"

import type { ExportJobState } from "../../../domain/export-job/Types.js"

import { CardDescription } from "../../components/ui/Card.js"
import { ScrollArea } from "../../components/ui/ScrollArea.js"
import { Separator } from "../../components/ui/Separator.js"

export const JobLogsPanel = ({
  job,
  logsScrollAreaRef,
}: {
  job: ExportJobState | null
  logsScrollAreaRef: RefObject<HTMLDivElement | null>
}) => (
  <section className="logs-panel subtle-panel grid gap-4 rounded-[1.5rem] p-4">
    <div className="logs-header grid gap-3">
      <div>
        <CardDescription className="results-description text-sm leading-7">
          작업 로그
        </CardDescription>
      </div>
    </div>
    <Separator />
    <ScrollArea
      id="logs"
      ref={logsScrollAreaRef}
      className="logs-scroll log-surface h-[min(28rem,56vh)] overflow-hidden rounded-[1.5rem]"
      aria-live="polite"
    >
      <div className="logs grid min-h-full gap-1.5 px-4 py-4 font-mono text-[0.88rem] text-foreground">
        {(job?.logs ?? []).map((entry, index) => (
          <div
            key={`${entry.timestamp}-${index}`}
            className="log-line grid gap-0.5 pb-1.5 last:border-b-0 last:pb-0"
            data-job-log-entry
          >
            <span className="log-meta text-[11px] leading-5" data-job-log-timestamp>
              {entry.timestamp}
            </span>
            <span
              className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground"
              data-job-log-message
            >
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  </section>
)
