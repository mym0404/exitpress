import { RiMoonClearLine, RiSunLine } from "@remixicon/react"
import type { ThemePreference } from "../../../../domain/preferences/ThemePreference.js"
import { Badge } from "../../../components/ui/Badge.js"
import { Card, CardContent } from "../../../components/ui/Card.js"
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/ToggleGroup.js"
import { getStatusPillClassName } from "../status/StatusPill.js"

export const WizardHeader = ({
  title,
  themePreference,
  headerStatus,
  summaryCards,
  onThemeChange,
}: {
  title: string
  themePreference: ThemePreference
  headerStatus: string
  summaryCards: Array<{ label: string; value: string }>
  onThemeChange: (value: ThemePreference) => void
}) => (
  <Card variant="panel" className="overflow-hidden">
    <CardContent className="grid gap-4 p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
        <div className="wizard-heading grid gap-1.5">
          <h1 className="wizard-title text-[clamp(1.7rem,2.5vw,2.4rem)] leading-[1.04]">{title}</h1>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 self-start">
          <ToggleGroup
            className="theme-toggle rounded-full p-1"
            aria-label="테마 선택"
            value={themePreference}
            onValueChange={(value) => {
              if (value === "dark" || value === "light") {
                onThemeChange(value)
              }
            }}
          >
            <ToggleGroupItem
              aria-label="다크"
              className="theme-toggle-item size-8 p-0"
              title="다크"
              value="dark"
            >
              <RiMoonClearLine data-theme-icon aria-hidden="true" />
              <span className="sr-only">다크</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label="라이트"
              className="theme-toggle-item size-8 p-0"
              title="라이트"
              value="light"
            >
              <RiSunLine data-theme-icon aria-hidden="true" />
              <span className="sr-only">라이트</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <Badge
            id="status-text"
            className={getStatusPillClassName(headerStatus)}
            data-status={headerStatus}
          >
            {headerStatus}
          </Badge>
        </div>
      </div>

      <div
        id="summary"
        className="wizard-summary-stats flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-2.5 text-sm text-muted-foreground"
        aria-live="polite"
      >
        {summaryCards.map((card) => (
          <span
            key={card.label}
            className="wizard-summary-metric inline-flex min-w-0 max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-0.5"
          >
            <span className="shrink-0 text-muted-foreground">{card.label}</span>
            <strong className="metric-value min-w-0 break-all font-semibold">{card.value}</strong>
          </span>
        ))}
      </div>
    </CardContent>
  </Card>
)
