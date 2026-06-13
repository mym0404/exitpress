import { useEffect } from "react"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"

export const useThemePreference = (themePreference: ThemePreference) => {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark", "light")
    root.classList.add(themePreference)
    root.style.colorScheme = themePreference

    window.requestAnimationFrame(() => {
      const appSurface = document.querySelector("[data-app-surface]")

      if (!appSurface) {
        return
      }

      const backgroundColor = window.getComputedStyle(appSurface).backgroundColor
      root.style.backgroundColor = backgroundColor
      document.body.style.backgroundColor = backgroundColor
    })
  }, [themePreference])
}
