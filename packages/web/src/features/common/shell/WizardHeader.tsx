import {
  RiArrowLeftLine,
  RiBookOpenLine,
  RiGithubLine,
  RiGlobalLine,
  RiMoonClearLine,
  RiSunLine,
} from "@remixicon/react"

import type { ThemePreference } from "@exitpress/domain/preferences/ThemePreference.js"

import { Badge } from "../../../components/ui/Badge.js"
import { Button } from "../../../components/ui/Button.js"
import { Card, CardContent } from "../../../components/ui/Card.js"
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/ToggleGroup.js"
import { createAppHref } from "../../../lib/AppRoutes.js"
import { getStatusPillClassName, getStatusPillLabel } from "../status/StatusPill.js"

const headerLinks = [
  {
    pathname: "/storybook",
    Icon: RiBookOpenLine,
    label: "Storybook",
  },
  {
    href: "https://github.com/mym0404/exitpress",
    Icon: RiGithubLine,
    label: "GitHub",
    external: true,
  },
  {
    href: "https://mjstudio.net",
    Icon: RiGlobalLine,
    label: "MJ Studio",
    external: true,
  },
]

export const WizardHeader = ({
  title,
  description,
  themePreference,
  headerStatus,
  summaryCards,
  backLink,
  onThemeChange,
}: {
  title: string
  description?: string
  themePreference: ThemePreference
  headerStatus: string
  summaryCards: Array<{ label: string; value: string }>
  backLink?: {
    href: string
    label: string
  }
  onThemeChange: (value: ThemePreference) => void
}) => (
  <Card variant="panel" className="overflow-hidden">
    <CardContent className="grid gap-4 p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
        <div className="wizard-heading grid gap-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {backLink ? (
              <Button asChild variant="secondary" size="icon" className="shrink-0">
                <a href={backLink.href} aria-label={backLink.label} title={backLink.label}>
                  <RiArrowLeftLine className="size-4" aria-hidden="true" />
                  <span className="sr-only">{backLink.label}</span>
                </a>
              </Button>
            ) : null}
            <h1 className="wizard-title text-[clamp(1.7rem,2.5vw,2.4rem)] leading-[1.04]">
              {title}
            </h1>
          </div>
          {description ? (
            <p className="wizard-description max-w-3xl text-sm leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <div className="grid shrink-0 justify-items-end gap-2 self-start">
          <nav className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
            {headerLinks.map(({ href, pathname, Icon, external, label }) => (
              <a
                key={href ?? pathname}
                href={
                  pathname
                    ? createAppHref({
                        pathname,
                        basePath: import.meta.env.BASE_URL,
                      })
                    : href
                }
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground focus-visible:shadow-[var(--focus-ring)]"
              >
                {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
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
              {getStatusPillLabel(headerStatus)}
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
