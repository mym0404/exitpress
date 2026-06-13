import "@primer/primitives/dist/css/functional/themes/dark.css"
import "@primer/primitives/dist/css/functional/themes/light.css"
import { BaseStyles, Box, ThemeProvider } from "@primer/react"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"
import type { ReactNode } from "react"

import { getPrimerColorMode } from "./ThemeColorMode.js"

export const PrimerAppProvider = ({
  children,
  themePreference,
}: {
  children: ReactNode
  themePreference: ThemePreference
}) => (
  <ThemeProvider colorMode={getPrimerColorMode(themePreference)}>
    <BaseStyles>
      <Box data-app-surface sx={{ minHeight: "100dvh", bg: "canvas.default", color: "fg.default" }}>
        {children}
      </Box>
    </BaseStyles>
  </ThemeProvider>
)
