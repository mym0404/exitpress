import path from "node:path"
import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { ignoredRuntimeOutputGlobs } from "./src/config/RuntimeOutputWatchGlobs.js"

const packageDir = fileURLToPath(new URL(".", import.meta.url))
const repoRootDir = fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig({
  root: packageDir,
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ignoredRuntimeOutputGlobs,
    },
  },
  resolve: {
    alias: {
      "@": path.join(packageDir, "src"),
      "@exitpress/domain": path.join(repoRootDir, "packages/domain/src"),
      "@exitpress/web": path.join(packageDir, "src"),
    },
  },
  build: {
    outDir: path.join(repoRootDir, "dist/client"),
    emptyOutDir: false,
    chunkSizeWarningLimit: 900,
  },
})
