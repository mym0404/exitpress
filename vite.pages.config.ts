import { defineConfig, mergeConfig } from "vite"

import baseConfig from "./vite.config.js"

export default mergeConfig(
  baseConfig,
  defineConfig({
    base: "/goodbye-naver-blog/storybook/",
    build: {
      outDir: "dist/pages/storybook",
      emptyOutDir: true,
    },
  }),
)
