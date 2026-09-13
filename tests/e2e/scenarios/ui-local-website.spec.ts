import { createServer } from "node:http"
import path from "node:path"

import { sendFile } from "@exitpress/server/http/HttpResponse.js"
import { expect, test as base } from "@playwright/test"

const pagesBase = "/exitpress/"
const expectedCommands = [
  "git clone https://github.com/mym0404/exitpress.git",
  "cd exitpress",
  "mise trust",
  "mise install",
  "mise exec -- pnpm install",
  "mise exec -- pnpm start",
].join("\n")

const test = base.extend<{ websiteUrl: string }>({
  websiteUrl: async ({ page }, use) => {
    await page.route("**/api/**", (route) => route.abort())
    const root = path.resolve("dist/pages")
    const server = createServer(async (request, response) => {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname
      const relativePath = decodeURIComponent(pathname.slice(pagesBase.length))
      const filePath = path.resolve(root, relativePath, pathname.endsWith("/") ? "index.html" : "")

      if (!pathname.startsWith(pagesBase) || !filePath.startsWith(`${root}${path.sep}`)) {
        response.writeHead(404).end()
        return
      }

      try {
        await sendFile({ response, filePath })
      } catch {
        response.writeHead(404).end()
      }
    })
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const address = server.address()
    if (!address || typeof address === "string") {
      throw new Error("website server did not bind to a numeric port")
    }

    try {
      await use(`http://127.0.0.1:${address.port}${pagesBase}`)
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      )
    }
  },
})

test.describe("local website", () => {
  test("serves the built website and navigates to the existing parser demo", async ({
    page,
    websiteUrl,
  }) => {
    const errors: string[] = []
    const apiRequests: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url())
    })
    const response = await page.goto(websiteUrl)
    expect(response?.status()).toBe(200)
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://mym0404.github.io/exitpress/",
    )
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ExitPress")
    await page.locator("#demo").scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
            ),
          ),
      )
      .toBe(true)
    expect(errors).toEqual([])
    expect(apiRequests).toEqual([])
    await page.getByRole("link", { name: "Explore the parser demo" }).click()
    await expect(page).toHaveURL(`${websiteUrl}storybook/`)
    await expect(page.getByRole("heading", { name: "Storybook", exact: true })).toBeVisible()
  })

  test("copies the complete installation commands after jumping to setup", async ({
    page,
    context,
    websiteUrl,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto(websiteUrl)
    await page.getByRole("link", { name: "Get started", exact: true }).click()
    await expect(page).toHaveURL(`${websiteUrl}#setup`)
    await page.getByRole("button", { name: "Copy installation commands" }).click()
    await expect(page.getByText("Installation commands copied.", { exact: true })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expectedCommands)
  })

  test("keeps the commands selectable when clipboard access fails", async ({
    page,
    websiteUrl,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async () => {
            throw new Error("Clipboard denied")
          },
        },
      })
    })
    await page.goto(`${websiteUrl}#setup`)
    await page.getByRole("button", { name: "Copy installation commands" }).click()
    await expect(
      page.getByText("Copy failed. Select the commands above to copy them."),
    ).toBeVisible()
    await expect(page.getByLabel("Installation commands", { exact: true })).toHaveText(
      expectedCommands,
    )
  })

  test("stacks the product screenshot below the introduction on tablet screens", async ({
    page,
    websiteUrl,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(websiteUrl)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    const introduction = await page
      .locator('section[aria-labelledby="hero-title"] > div')
      .boundingBox()
    const image = await page.locator("main img").first().boundingBox()
    expect(introduction).not.toBeNull()
    expect(image).not.toBeNull()
    expect(image!.y).toBeGreaterThanOrEqual(introduction!.y + introduction!.height)
  })

  test("keeps navigation, screenshots, and setup accessible on a narrow screen", async ({
    page,
    websiteUrl,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(websiteUrl)
    await page.keyboard.press("Tab")
    await expect(page.getByRole("link", { name: "ExitPress home" })).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Setup" }),
    ).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(`${websiteUrl}#setup`)
    expect(
      await page.locator("body").evaluate((element) => element.scrollWidth <= window.innerWidth),
    ).toBe(true)
    expect(
      await page
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => image.getBoundingClientRect().right <= window.innerWidth),
        ),
    ).toBe(true)
    await expect(page.getByRole("button", { name: "Copy installation commands" })).toBeVisible()
    await expect(
      page
        .getByRole("navigation", { name: "Footer navigation" })
        .getByRole("link", { name: "MIT License" }),
    ).toBeVisible()
  })
})
