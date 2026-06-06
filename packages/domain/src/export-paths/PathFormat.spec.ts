import { describe, expect, it } from "vitest"

import { formatTitleSegment, sanitizePathSegment, slugifyTitle } from "./PathFormat.js"

describe("path format", () => {
  it("sanitizes path segments and falls back for empty slugs", () => {
    expect(sanitizePathSegment("- invalid:/\\\\name?*  ")).toBe("invalid name")
    expect(sanitizePathSegment(":::")).toBe("untitled")
    expect(slugifyTitle("Hello   World")).toBe("hello-world")
    expect(slugifyTitle(":::")).toBe("untitled")
    expect(
      formatTitleSegment({
        value: "Hello   World",
        slugStyle: "snake",
        slugWhitespace: "underscore",
      }),
    ).toBe("hello_world")
    expect(
      formatTitleSegment({
        value: "Hello   World",
        slugStyle: "keep-title",
        slugWhitespace: "keep-space",
      }),
    ).toBe("Hello World")
  })
})
