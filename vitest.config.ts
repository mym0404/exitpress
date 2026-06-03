import path from "node:path"
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

const rootDir = fileURLToPath(new URL(".", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(rootDir, "src/ui"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "src/domain/**/*.ts",
        "src/exporting/**/*.ts",
        "src/infra/**/*.ts",
        "src/integrations/**/*.ts",
        "src/markdown/**/*.ts",
        "src/parsing/**/*.ts",
        "src/shared/**/*.ts",
        "src/server/**/*.ts",
        "src/ui/**/*.ts",
        "src/ui/**/*.tsx",
      ],
      exclude: ["src/ui/Main.tsx", "**/*.spec.ts", "**/*.spec.tsx", "tests/**"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 75,
        statements: 90,
      },
    },
  },
})
