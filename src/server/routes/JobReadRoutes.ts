import type { ApiRouteContext, ApiRouteRequest } from "./ApiRouteContext.js"
import { sendJson } from "../http/HttpResponse.js"

export const handleJobReadRoutes =
  ({ jobStore }: ApiRouteContext) =>
  async ({ response, method, url }: ApiRouteRequest) => {
    const statusMatch = url.pathname.match(/^\/api\/export\/([^/]+)$/)

    if (method === "GET" && statusMatch?.[1]) {
      const job = jobStore.get(statusMatch[1])

      if (!job) {
        sendJson({ response, statusCode: 404, body: { error: "job not found" } })
        return true
      }

      sendJson({ response, statusCode: 200, body: job })
      return true
    }

    const manifestMatch = url.pathname.match(/^\/api\/export\/([^/]+)\/manifest$/)

    if (method !== "GET" || !manifestMatch?.[1]) {
      return false
    }

    const job = jobStore.get(manifestMatch[1])

    if (!job?.manifest) {
      sendJson({ response, statusCode: 404, body: { error: "manifest not found" } })
      return true
    }

    sendJson({ response, statusCode: 200, body: job.manifest })
    return true
  }
