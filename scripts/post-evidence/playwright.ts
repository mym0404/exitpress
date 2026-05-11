import type { Browser, ElementHandle, Page } from "playwright"

const mobileViewport = {
  width: 390,
  height: 844,
}

const userAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

export const createEvidenceBrowserContext = async (browser: Browser) =>
  browser.newContext({
    viewport: mobileViewport,
    userAgent,
  })

const naverMobilePostUrl = ({ blogId, logNo }: { blogId: string; logNo: string }) =>
  `https://m.blog.naver.com/PostView.naver?blogId=${encodeURIComponent(blogId)}&logNo=${encodeURIComponent(logNo)}`

const postBodySelectors = (editorType: string | null) => {
  if (editorType === "naver-se4") {
    return ["#viewTypeSelector .se-main-container", "#viewTypeSelector"]
  }

  if (editorType === "naver-se3") {
    return ["#viewTypeSelector .se_component_wrap.sect_dsc", "#viewTypeSelector"]
  }

  return ["#viewTypeSelector"]
}

const findFirstElement = async ({ page, selectors }: { page: Page; selectors: string[] }) => {
  for (const selector of selectors) {
    const element = await page.$(selector)

    if (element) {
      return element
    }
  }

  return null
}

const captureElementNode = async ({
  element,
  outputPath,
}: {
  element: ElementHandle
  outputPath: string
}) => {
  await element.evaluate((node) => {
    if (!(node instanceof Element)) {
      return
    }

    for (const element of Array.from(document.body.querySelectorAll("*"))) {
      if (!(element instanceof HTMLElement)) {
        continue
      }

      if (node.contains(element) || element.contains(node)) {
        continue
      }

      const position = window.getComputedStyle(element).position

      if (position === "fixed" || position === "sticky") {
        element.style.setProperty("visibility", "hidden", "important")
      }
    }

    node.scrollIntoView({
      block: "center",
      inline: "nearest",
    })
  })
  await element.screenshot({ path: outputPath })
}

export const captureNaverPost = async ({
  browser,
  blogId,
  logNo,
  editorType,
  inspectPath,
  outputPath,
}: {
  browser: Browser
  blogId: string
  logNo: string
  editorType: string | null
  inspectPath?: string
  outputPath: string
}) => {
  const context = await createEvidenceBrowserContext(browser)
  const page = await context.newPage()

  try {
    await page.goto(naverMobilePostUrl({ blogId, logNo }), {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    })
    await page.locator("#viewTypeSelector").first().waitFor({
      state: "attached",
      timeout: 15_000,
    })

    if (!inspectPath) {
      const element = await findFirstElement({
        page,
        selectors: postBodySelectors(editorType),
      })

      if (!element) {
        throw new Error("post body element not found")
      }

      await captureElementNode({
        element,
        outputPath,
      })
      return
    }

    const handle = await page.evaluateHandle(
      ({ path, type }) => {
        const roots =
          type === "naver-se4"
            ? Array.from(document.querySelectorAll("#viewTypeSelector .se-component"))
            : type === "naver-se3"
              ? Array.from(
                  document.querySelectorAll(
                    "#viewTypeSelector .se_component_wrap.sect_dsc .se_component",
                  ),
                )
              : Array.from(document.querySelector("#viewTypeSelector")?.childNodes ?? [])
        const indexes = path.split(".").map((part) => Number(part))
        let node: Node | undefined = roots[indexes[0] ?? -1]

        for (const index of indexes.slice(1)) {
          node = node?.childNodes[index]
        }

        if (!node) {
          return null
        }

        return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
      },
      {
        path: inspectPath,
        type: editorType,
      },
    )
    const element = handle.asElement()

    if (!element) {
      throw new Error(`inspect path element not found: ${inspectPath}`)
    }

    await captureElementNode({
      element,
      outputPath,
    })
  } finally {
    await context.close()
  }
}
