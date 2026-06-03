import { RiLoader4Line } from "@remixicon/react"

import { Card, CardContent } from "../components/ui/Card.js"

export const BootstrapLoadingOverlay = () => (
  <section
    className="fixed inset-0 z-50 grid place-items-center px-4 py-6"
    data-step-view="bootstrap-loading"
  >
    <div className="absolute inset-0 bg-background/78 backdrop-blur-[6px]" aria-hidden="true" />
    <Card variant="panel" className="relative w-full max-w-xl overflow-hidden">
      <CardContent className="grid gap-4 px-6 py-8 sm:px-8 sm:py-10">
        <div
          className="grid justify-items-center gap-4 text-center"
          role="status"
          aria-live="polite"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-full border border-border bg-secondary text-foreground shadow-[var(--panel-shadow-border)]">
            <RiLoader4Line className="size-5 motion-safe:animate-spin" aria-hidden="true" />
          </span>
          <div className="grid gap-1.5">
            <h1 className="text-xl font-semibold tracking-[-0.04em] text-foreground">
              작업 상태를 확인하는 중입니다.
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              이전 작업을 다시 불러올지, 새로 시작할지 확인하고 있습니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </section>
)
