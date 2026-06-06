export const allThemePreferences = ["dark", "light"] as const
// Persisted UI theme preference.
export type ThemePreference = (typeof allThemePreferences)[number]
