import { rm } from "node:fs/promises"

import { resolveRepoPath } from "@exitpress/engine/infra/node/FilePathUtils.js"

import type { ApiRouteContext, ApiRouteRequest } from "./ApiRouteContext.js"

import { isPlainObject, parseJsonBody, sendJson } from "../http/HttpResponse.js"

import { rejectNonJson } from "./RouteSupport.js"

const parseOutputDirPayload = async (request: ApiRouteRequest["request"]) => {
  const payload = await parseJsonBody<{
    outputDir?: unknown
    jobId?: unknown
  }>(request)

  if (
    !isPlainObject(payload) ||
    typeof payload.outputDir !== "string" ||
    !payload.outputDir.trim()
  ) {
    return null
  }

  return {
    outputDir: payload.outputDir,
    jobId: payload.jobId,
  }
}

export const handleResumeRoutes =
  ({ jobStore, state, exportJobRunner }: ApiRouteContext) =>
  async ({ request, response, method, url }: ApiRouteRequest) => {
    if (method !== "POST") {
      return false
    }

    if (url.pathname === "/api/export-reset") {
      if (rejectNonJson(request, response)) {
        return true
      }

      const payload = await parseOutputDirPayload(request)

      if (!payload) {
        sendJson({ response, statusCode: 400, body: { error: "outputDir는 필수입니다." } })
        return true
      }

      const outputDir = payload.outputDir.trim()
      const jobId =
        typeof payload.jobId === "string" && payload.jobId.trim() ? payload.jobId.trim() : null

      if (jobId) {
        await exportJobRunner.abortActiveJobTask(jobId)
      }

      await rm(resolveRepoPath(outputDir), { recursive: true, force: true })

      if (jobId) {
        jobStore.delete(jobId)
        state.jobScanResults.delete(jobId)
      }

      await state.writeLastOutputDir(state.defaultOutputDir)
      sendJson({ response, statusCode: 200, body: await state.buildBootstrapResponse() })
      return true
    }

    if (url.pathname === "/api/export-resume/lookup") {
      if (rejectNonJson(request, response)) {
        return true
      }

      const payload = await parseOutputDirPayload(request)

      if (!payload) {
        sendJson({ response, statusCode: 400, body: { error: "outputDir는 필수입니다." } })
        return true
      }

      sendJson({
        response,
        statusCode: 200,
        body: await state.buildResumeLookupResponse({ outputDir: payload.outputDir.trim() }),
      })
      return true
    }

    if (url.pathname !== "/api/export-resume/restore") {
      return false
    }

    if (rejectNonJson(request, response)) {
      return true
    }

    const payload = await parseOutputDirPayload(request)

    if (!payload) {
      sendJson({ response, statusCode: 400, body: { error: "outputDir는 필수입니다." } })
      return true
    }

    const resumed = await state.buildResumeLookupResponse({
      outputDir: payload.outputDir.trim(),
      persistLastOutputDir: true,
    })

    if (!resumed.resumedJob || !resumed.resumeSummary) {
      sendJson({
        response,
        statusCode: 404,
        body: { error: "불러올 수 있는 작업 상태를 찾지 못했습니다." },
      })
      return true
    }

    sendJson({ response, statusCode: 200, body: resumed })
    return true
  }
