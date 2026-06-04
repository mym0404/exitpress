import { RiGithubLine, RiGlobalLine, RiMoonClearLine, RiSunLine } from "@remixicon/react"

import type { ThemePreference } from "../../../../domain/preferences/ThemePreference.js"

import { Badge } from "../../../components/ui/Badge.js"
import { Card, CardContent } from "../../../components/ui/Card.js"
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/ToggleGroup.js"
import { getStatusPillClassName } from "../status/StatusPill.js"

const headerLinks = [
  {
    href: "https://github.com/mym0404/goodbye-naver-blog",
    Icon: RiGithubLine,
    label: "GitHub",
  },
  {
    href: "https://mjstudio.net",
    Icon: RiGlobalLine,
    label: "MJ Studio",
  },
]

export const WizardHeader = ({
  title,
  description,
  themePreference,
  headerStatus,
  summaryCards,
  onThemeChange,
}: {
  title: string
  description?: string
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
          {description ? (
            <p className="wizard-description max-w-3xl text-sm leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <div className="grid shrink-0 justify-items-end gap-2 self-start">
          <nav className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
            {headerLinks.map(({ href, Icon, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground focus-visible:shadow-[var(--focus-ring)]"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-3">
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
