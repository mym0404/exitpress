import path from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const rootDir = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(rootDir, "packages/web/src"),
      "@exitpress/domain": path.join(rootDir, "packages/domain/src"),
      "@exitpress/engine": path.join(rootDir, "packages/engine/src"),
      "@exitpress/server": path.join(rootDir, "packages/server/src"),
      "@exitpress/web": path.join(rootDir, "packages/web/src"),
      "@tests": path.join(rootDir, "tests"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "packages/domain/src/**/*.ts",
        "packages/engine/src/**/*.ts",
        "packages/server/src/**/*.ts",
        "packages/web/src/config/RuntimeOutputWatchGlobs.ts",
        "packages/web/src/features/job-results/UseExportJob.ts",
        "packages/web/src/features/options/TemplatePropAutocomplete.ts",
        "packages/web/src/features/scan/CategorySelection.ts",
        "packages/web/src/features/storybook/StorybookCatalog.ts",
        "packages/web/src/lib/Api.ts",
        "packages/web/src/lib/AppRoutes.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "packages/**/schema/**",
        "packages/engine/src/shared/object/UnknownRecord.ts",
        "packages/engine/src/types/**",
        "packages/server/src/Server.ts",
        "packages/server/src/routes/RouteContext.ts",
        "packages/server/src/static/**",
        "packages/web/src/Main.tsx",
        "packages/web/src/app/**",
        "packages/web/src/components/ui/**",
        "packages/web/src/lib/Cn.ts",
        "tests/**",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 75,
        statements: 90,
      },
    },
  },
})
