import { NaverBlogFetcher } from "@exitpress/blog-naver/integrations/naver-blog/NaverBlogFetcher.js"
import { createHttpServer } from "@exitpress/server/http/HttpServer.js"

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const delayMs = Number(process.env.EXITPRESS_LIVE_FETCH_DELAY_MS ?? "0")
const delayedPostIds = new Set(
  (process.env.EXITPRESS_LIVE_FETCH_DELAY_LOGNOS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
)

if (delayedPostIds.size > 0 && delayMs > 0) {
  const originalFetchPostHtml = NaverBlogFetcher.prototype.fetchPostHtml

  NaverBlogFetcher.prototype.fetchPostHtml = async function patchedFetchPostHtml(postId: string) {
    const html = await originalFetchPostHtml.call(this, postId)

    if (delayedPostIds.has(postId)) {
      await wait(delayMs)
    }

    return html
  }
}

const server = createHttpServer({
  settingsPath: process.env.EXITPRESS_SETTINGS_PATH,
  scanCachePath: process.env.EXITPRESS_SCAN_CACHE_PATH,
  postHtmlCacheDir: process.env.EXITPRESS_POST_HTML_CACHE_DIR,
})

const shutdown = () => {
  server.close(() => {
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

server.listen(0, "127.0.0.1", () => {
  const address = server.address()

  if (!address || typeof address === "string") {
    console.error("READY_FAILED")
    process.exit(1)
    return
  }

  console.log(`READY ${address.port}`)
})
