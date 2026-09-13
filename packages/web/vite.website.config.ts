import { fileURLToPath } from "node:url"

import { defineConfig, mergeConfig } from "vite"

import baseConfig from "./vite.config.js"

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: fileURLToPath(new URL("./website", import.meta.url)),
    publicDir: fileURLToPath(new URL("./public", import.meta.url)),
    base: "/exitpress/",
    build: {
      outDir: fileURLToPath(new URL("../../dist/pages", import.meta.url)),
      emptyOutDir: true,
    },
  }),
)
