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
    include: [
      "src/parsing/naver-blog/se2/**/*.spec.ts",
      "src/parsing/naver-blog/se3/**/*.spec.ts",
      "src/parsing/naver-blog/se4/**/*.spec.ts",
    ],
  },
})
