import { defineConfig } from "vitest/config"
import path from "node:path"
import { fileURLToPath } from "node:url"

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
        "src/parsing/naver-blog/common/**/*.ts": { 100: true },
        "src/parsing/naver-blog/se2/**/*.ts": { 100: true },
        "src/parsing/naver-blog/se3/**/*.ts": { 100: true },
        "src/parsing/naver-blog/se4/**/*.ts": { 100: true },
      },
    },
  },
})
