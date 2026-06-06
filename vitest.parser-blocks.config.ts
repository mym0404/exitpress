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
    include: [
      "packages/engine/src/parsing/naver-blog/se2/**/*.spec.ts",
      "packages/engine/src/parsing/naver-blog/se3/**/*.spec.ts",
      "packages/engine/src/parsing/naver-blog/se4/**/*.spec.ts",
    ],
  },
})
