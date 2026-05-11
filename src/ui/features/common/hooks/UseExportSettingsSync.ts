import type { MutableRefObject } from "react"
import { useEffect } from "react"
import type { PartialExportOptions } from "../../../../domain/export-options/ExportOptions.js"
import type { ThemePreference } from "../../../../domain/preferences/ThemePreference.js"
import { postJsonNoContent } from "../../../lib/Api.js"
import { getPersistedUiStateSignature } from "../shell/WizardFlow.js"

const exportSettingsSaveDelayMs = 300

export const useExportSettingsSync = ({
  hasLoadedDefaultsRef,
  persistedUiStateSignature,
  persistedUiStateSignatureRef,
  latestPersistedOptionsRef,
  latestThemePreferenceRef,
}: {
  hasLoadedDefaultsRef: MutableRefObject<boolean>
  persistedUiStateSignature: string
  persistedUiStateSignatureRef: MutableRefObject<string | null>
  latestPersistedOptionsRef: MutableRefObject<PartialExportOptions>
  latestThemePreferenceRef: MutableRefObject<ThemePreference>
}) => {
  useEffect(() => {
    if (!hasLoadedDefaultsRef.current) {
      return
    }

    if (persistedUiStateSignature === persistedUiStateSignatureRef.current) {
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      const nextThemePreference = latestThemePreferenceRef.current
      const nextOptions = latestPersistedOptionsRef.current
      const nextPersistedSignature = getPersistedUiStateSignature({
        options: nextOptions,
        themePreference: nextThemePreference,
      })

      void postJsonNoContent("/api/export-settings", {
        options: nextOptions,
        themePreference: nextThemePreference,
      })
        .then(() => {
          if (cancelled) {
            return
          }

          persistedUiStateSignatureRef.current = nextPersistedSignature
        })
        .catch(() => {})
    }, exportSettingsSaveDelayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [
    hasLoadedDefaultsRef,
    latestPersistedOptionsRef,
    latestThemePreferenceRef,
    persistedUiStateSignature,
    persistedUiStateSignatureRef,
  ])
}
