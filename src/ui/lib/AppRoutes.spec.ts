import { describe, expect, it } from "vitest"

import { createAppHref, getAppRoute, shouldShowStorybookBackLink } from "./AppRoutes.js"

describe("app routes", () => {
  it("keeps local storybook and export routes unchanged", () => {
    expect(getAppRoute({ pathname: "/storybook", basePath: "/" })).toBe("storybook")
    expect(getAppRoute({ pathname: "/", basePath: "/" })).toBe("export")
    expect(createAppHref({ pathname: "/storybook", basePath: "/" })).toBe("/storybook")
    expect(shouldShowStorybookBackLink("/")).toBe(true)
  })

  it("treats the GitHub Pages storybook base as the storybook route", () => {
    const basePath = "/goodbye-naver-blog/storybook/"

    expect(getAppRoute({ pathname: "/goodbye-naver-blog/storybook/", basePath })).toBe("storybook")
    expect(getAppRoute({ pathname: "/goodbye-naver-blog/storybook", basePath })).toBe("storybook")
    expect(createAppHref({ pathname: "/storybook", basePath })).toBe(
      "/goodbye-naver-blog/storybook/",
    )
    expect(shouldShowStorybookBackLink(basePath)).toBe(false)
  })
})
