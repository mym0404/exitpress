import { describe, expect, it } from "vitest"

import { ignoredRuntimeOutputGlobs } from "./RuntimeOutputWatchGlobs.js"

describe("vite config", () => {
  it("ignores runtime export directories in dev watch mode", () => {
    expect(ignoredRuntimeOutputGlobs).toEqual(
      expect.arrayContaining([
        "**/.cache/**",
        "**/output/**",
        "**/outputs/**",
        "**/tmp/**",
      ]),
    )
  })
})
