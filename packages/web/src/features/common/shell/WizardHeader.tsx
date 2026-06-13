import {
  BookIcon,
  ChevronLeftIcon,
  GlobeIcon,
  MarkGithubIcon,
  MoonIcon,
  SunIcon,
} from "@primer/octicons-react"
import { Box, Heading, IconButton, Link, SegmentedControl, Text } from "@primer/react"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"

import { PrimerStatusLabel } from "../../../components/primer/PrimerStatusLabel.js"
import { createAppHref } from "../../../lib/AppRoutes.js"
import { getStatusPillLabel } from "../status/StatusPill.js"

const headerLinks = [
  {
    pathname: "/storybook",
    Icon: BookIcon,
    label: "Storybook",
  },
  {
    href: "https://github.com/mym0404/exitpress",
    Icon: MarkGithubIcon,
    label: "GitHub",
    external: true,
  },
  {
    href: "https://mjstudio.net",
    Icon: GlobeIcon,
    label: "MJ Studio",
    external: true,
  },
]

const themeOptions: ThemePreference[] = ["dark", "light"]

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
  <Box
    sx={{
      display: "grid",
      gap: 3,
      px: [3, 4],
      py: [3, 4],
      border: "1px solid",
      borderColor: "border.default",
      borderRadius: 2,
      bg: "canvas.subtle",
    }}
  >
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: ["1fr", "minmax(0, 1fr) auto"],
        gap: 3,
        alignItems: "start",
      }}
    >
      <Box sx={{ display: "grid", gap: 2, minWidth: 0 }}>
        <Box sx={{ display: "flex", minWidth: 0, flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          {backLink ? (
            <IconButton
              aria-label={backLink.label}
              icon={ChevronLeftIcon}
              title={backLink.label}
              onClick={() => {
                window.location.href = backLink.href
              }}
            />
          ) : null}
          <Heading sx={{ fontSize: [4, 5], lineHeight: 1.1, minWidth: 0 }}>{title}</Heading>
        </Box>
        {description ? (
          <Text
            sx={{
              display: "block",
              maxWidth: "768px",
              m: 0,
              color: "fg.muted",
              fontSize: 1,
              lineHeight: 1.7,
            }}
          >
            {description}
          </Text>
        ) : null}
      </Box>

      <Box sx={{ display: "grid", justifyItems: ["start", "end"], gap: 2 }}>
        <Box
          as="nav"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: ["flex-start", "flex-end"],
            gap: 2,
            fontSize: 0,
            fontWeight: "semibold",
          }}
        >
          {headerLinks.map(({ href, pathname, Icon, external, label }) => (
            <Link
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
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                color: "fg.muted",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
          <SegmentedControl
            aria-label="테마 선택"
            size="small"
            onChange={(selectedIndex) => {
              const nextTheme = themeOptions[selectedIndex]

              if (nextTheme) {
                onThemeChange(nextTheme)
              }
            }}
          >
            <SegmentedControl.IconButton
              aria-label="다크"
              icon={MoonIcon}
              selected={themePreference === "dark"}
            />
            <SegmentedControl.IconButton
              aria-label="라이트"
              icon={SunIcon}
              selected={themePreference === "light"}
            />
          </SegmentedControl>
          <Box id="status-text" data-status={headerStatus}>
            <PrimerStatusLabel status={headerStatus}>
              {getStatusPillLabel(headerStatus)}
            </PrimerStatusLabel>
          </Box>
        </Box>
      </Box>
    </Box>

    <Box
      id="summary"
      aria-live="polite"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        pt: 3,
        borderTop: "1px solid",
        borderColor: "border.default",
        color: "fg.muted",
        fontSize: 1,
      }}
    >
      {summaryCards.map((card) => (
        <Box
          as="span"
          key={card.label}
          sx={{
            display: "inline-flex",
            minWidth: 0,
            maxWidth: "100%",
            flexWrap: "wrap",
            alignItems: "baseline",
            columnGap: 1,
          }}
        >
          <Text sx={{ flexShrink: 0, color: "fg.muted" }}>{card.label}</Text>
          <Box as="strong" sx={{ minWidth: 0, overflowWrap: "anywhere", fontWeight: "semibold" }}>
            {card.value}
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
)
