import { access, readFile } from "node:fs/promises"

import { buildMarkdownViewerShareUrl } from "@exitpress/engine/exporting/post/MarkdownViewerShareUrl.js"

import type { ApiRouteContext, ApiRouteRequest } from "./ApiRouteContext.js"

import { isPlainObject, parseJsonBody, sendJson } from "../http/HttpResponse.js"

import { isPathInsideRoot, resolveLocalOutputTargetPath } from "./LocalFileService.js"
import { rejectNonJson, rejectNonSameOrigin } from "./RouteSupport.js"

const fileExists = async (filePath: string) => {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

const resolveLocalFilePayload = async ({
  request,
  response,
}: Pick<ApiRouteRequest, "request" | "response">) => {
  const payload = await parseJsonBody<{
    outputDir?: unknown
    outputPath?: unknown
  }>(request)

  if (
    !isPlainObject(payload) ||
    typeof payload.outputDir !== "string" ||
    !payload.outputDir.trim() ||
    typeof payload.outputPath !== "string" ||
    !payload.outputPath.trim()
  ) {
    sendJson({ response, statusCode: 400, body: { error: "outputDir와 outputPath는 필수입니다." } })
    return null
  }

  const resolved = resolveLocalOutputTargetPath({
    outputDir: payload.outputDir,
    outputPath: payload.outputPath,
  })

  if (!isPathInsideRoot({ rootPath: resolved.outputRoot, targetPath: resolved.targetPath })) {
    sendJson({ response, statusCode: 400, body: { error: "허용되지 않은 파일 경로입니다." } })
    return null
  }

  if (!(await fileExists(resolved.targetPath))) {
    sendJson({ response, statusCode: 404, body: { error: "파일을 찾을 수 없습니다." } })
    return null
  }

  return resolved.targetPath
}

export const handleLocalFileRoutes =
  ({ openLocalPath }: ApiRouteContext) =>
  async ({ request, response, method, url }: ApiRouteRequest) => {
    if (method !== "POST") {
      return false
    }

    if (url.pathname === "/api/local-file/open") {
      if (rejectNonJson(request, response) || rejectNonSameOrigin(request, response)) {
        return true
      }

      const targetPath = await resolveLocalFilePayload({ request, response })

      if (!targetPath) {
        return true
      }

      await openLocalPath(targetPath)
      response.writeHead(204)
      response.end()
      return true
    }

    if (url.pathname !== "/api/local-file/preview-link") {
      return false
    }

    if (rejectNonJson(request, response) || rejectNonSameOrigin(request, response)) {
      return true
    }

    const targetPath = await resolveLocalFilePayload({ request, response })

    if (!targetPath) {
      return true
    }

    const previewUrl = buildMarkdownViewerShareUrl(await readFile(targetPath, "utf8"))

    if (!previewUrl) {
      sendJson({ response, statusCode: 422, body: { error: "미리보기 링크를 만들 수 없습니다." } })
      return true
    }

    sendJson({ response, statusCode: 200, body: { previewUrl } })
    return true
  }
