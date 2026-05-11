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
    include: [
      "src/parsing/naver-blog/se2/**/*.spec.ts",
      "src/parsing/naver-blog/se3/**/*.spec.ts",
      "src/parsing/naver-blog/se4/**/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "src/parsing/naver-blog/se2/blocks/**/*.ts",
        "src/parsing/naver-blog/se3/blocks/**/*.ts",
        "src/parsing/naver-blog/se4/blocks/**/*.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
