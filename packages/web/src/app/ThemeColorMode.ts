import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"

export const getPrimerColorMode = (themePreference: ThemePreference) =>
  themePreference === "light" ? "day" : "night"
