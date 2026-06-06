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
        "packages/web/src/**/*.ts",
        "packages/web/src/**/*.tsx",
      ],
      exclude: ["packages/web/src/Main.tsx", "**/*.spec.ts", "**/*.spec.tsx", "tests/**"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 75,
        statements: 90,
      },
    },
  },
})
