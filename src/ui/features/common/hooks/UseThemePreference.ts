import { useEffect } from "react"
import type { ThemePreference } from "../../../../domain/preferences/ThemePreference.js"

export const useThemePreference = (themePreference: ThemePreference) => {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("dark", "light")
    root.classList.add(themePreference)
    root.style.colorScheme = themePreference
  }, [themePreference])
}
