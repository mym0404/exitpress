import { access, readFile } from "node:fs/promises"
import path from "node:path"

import type { Server as HttpServer, IncomingMessage, ServerResponse } from "node:http"

import type { ViteDevServer } from "vite"

import { sendFile, sendText } from "../http/HttpResponse.js"
import { builtClientRoot, devIndexPath } from "../http/ServerPaths.js"

const fileExists = async (filePath: string) => {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export const createBrowserAppResponder = ({
  httpServerRef,
}: {
  httpServerRef: () => HttpServer
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  let viteDevServerPromise: Promise<ViteDevServer> | null = null

  const ensureViteDevServer = () => {
    if (!viteDevServerPromise) {
      viteDevServerPromise = import("vite").then(({ createServer: createViteServer }) =>
        createViteServer({
          appType: "custom",
          server: {
            middlewareMode: true,
            hmr: {
              server: httpServerRef(),
            },
          },
        }),
      )
    }

    return viteDevServerPromise
  }

  const sendBrowserApp = async ({
    request,
    response,
    pathname,
  }: {
    request: IncomingMessage
    response: ServerResponse
    pathname: string
  }) => {
    if (isDevelopment) {
      const viteDevServer = await ensureViteDevServer()

      await new Promise<void>((resolve, reject) => {
        viteDevServer.middlewares(request, response, (error?: Error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })

      if (response.writableEnded) {
        return
      }

      if (path.extname(pathname)) {
        sendText({
          response,
          statusCode: 404,
          body: `Not found: ${pathname}`,
        })
        return
      }

      const template = await readFile(devIndexPath, "utf8")
      const transformedIndex = await viteDevServer.transformIndexHtml(pathname, template)

      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
      })
      response.end(transformedIndex)
      return
    }

    const builtIndexPath = path.join(builtClientRoot, "index.html")

    if (!(await fileExists(builtIndexPath))) {
      sendText({
        response,
        statusCode: 503,
        body: "React client build is missing. Run `pnpm build:ui` before starting the server.",
      })
      return
    }

    const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "")
    const builtFilePath = path.join(builtClientRoot, requestedPath)

    if (
      (pathname === "/" || pathname.startsWith("/assets/") || path.extname(pathname)) &&
      (await fileExists(builtFilePath))
    ) {
      await sendFile({
        response,
        filePath: builtFilePath,
      })
      return
    }

    await sendFile({
      response,
      filePath: builtIndexPath,
    })
  }

  const close = () => {
    if (!viteDevServerPromise) {
      return
    }

    void viteDevServerPromise.then((viteDevServer) => viteDevServer.close()).catch(() => undefined)
  }

  return {
    close,
    sendBrowserApp,
  }
}
