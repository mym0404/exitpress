import type { ScanResult } from "../../domain/blog/Types.js"
import type { ExportRequest } from "../../domain/export-job/Types.js"
import type { PartialExportOptions } from "../../domain/export-options/ExportOptions.js"

import type { ApiRouteContext, ApiRouteRequest } from "./ApiRouteContext.js"

import { extractBlogId } from "../../domain/blog/NaverUrl.js"
import { JOB_STATUSES } from "../../domain/export-job/ExportJobState.js"
import { recreateDir, resolveRepoPath } from "../../infra/node/FilePathUtils.js"
import { NaverBlogFetcher } from "../../integrations/naver-blog/NaverBlogFetcher.js"
import { toErrorMessage } from "../../shared/error/ErrorUtils.js"
import { readBody, sendJson } from "../http/HttpResponse.js"

const parseJsonPayload = async <T>(request: ApiRouteRequest["request"]) => {
  return JSON.parse(await readBody(request)) as T
}

export const handleExportRoutes =
  ({ jobStore, state, blockScanJobRunner, exportJobRunner }: ApiRouteContext) =>
  async ({ request, response, method, url }: ApiRouteRequest) => {
    if (method === "POST" && url.pathname === "/api/scan") {
      const payload = await parseJsonPayload<{ blogIdOrUrl?: string; forceRefresh?: boolean }>(
        request,
      )

      if (!payload.blogIdOrUrl?.trim()) {
        sendJson({ response, statusCode: 400, body: { error: "blogIdOrUrl는 필수입니다." } })
        return true
      }

      const blogId = extractBlogId(payload.blogIdOrUrl)
      const cachedScans = await state.ensureScanCache()

      if (!payload.forceRefresh && cachedScans[blogId]) {
        sendJson({ response, statusCode: 200, body: cachedScans[blogId] })
        return true
      }

      const scanResult = await new NaverBlogFetcher({ blogId }).scanBlog({ includePosts: true })
      await state.updateScanCache({ blogId, scanResult })
      sendJson({ response, statusCode: 200, body: scanResult })
      return true
    }

    if (method === "POST" && url.pathname === "/api/scan-blocks/jobs") {
      const payload = await parseJsonPayload<{
        blogIdOrUrl?: string
        scanResult?: ScanResult
        options?: PartialExportOptions
      }>(request)

      if (!payload.blogIdOrUrl?.trim() || !payload.scanResult?.posts) {
        sendJson({
          response,
          statusCode: 400,
          body: { error: "blogIdOrUrl와 scanResult.posts는 필수입니다." },
        })
        return true
      }

      const blogId = extractBlogId(payload.blogIdOrUrl)

      if (payload.scanResult.blogId !== blogId) {
        sendJson({
          response,
          statusCode: 400,
          body: { error: "scanResult.blogId가 요청 블로그와 일치하지 않습니다." },
        })
        return true
      }

      let options: ReturnType<typeof state.cloneOptions>

      try {
        options = state.cloneOptions(payload.options)
      } catch (error) {
        sendJson({ response, statusCode: 400, body: { error: toErrorMessage(error) } })
        return true
      }

      const job = blockScanJobRunner.startJob({
        scanResult: payload.scanResult as ScanResult & {
          posts: NonNullable<ScanResult["posts"]>
        },
        options,
      })

      sendJson({
        response,
        statusCode: 202,
        body: {
          jobId: job.id,
        },
      })
      return true
    }

    const scanJobMatch = url.pathname.match(/^\/api\/scan-blocks\/jobs\/([^/]+)$/)

    if (method === "GET" && scanJobMatch?.[1]) {
      const job = blockScanJobRunner.getJob(scanJobMatch[1])

      if (!job) {
        sendJson({ response, statusCode: 404, body: { error: "job not found" } })
        return true
      }

      sendJson({ response, statusCode: 200, body: job })
      return true
    }

    if (method === "POST" && url.pathname === "/api/export") {
      const payload = await parseJsonPayload<{
        blogIdOrUrl?: string
        outputDir?: string
        options?: PartialExportOptions
        scanResult?: ScanResult
      }>(request)

      if (!payload.blogIdOrUrl?.trim() || !payload.outputDir?.trim()) {
        sendJson({
          response,
          statusCode: 400,
          body: { error: "blogIdOrUrl와 outputDir는 필수입니다." },
        })
        return true
      }

      let exportRequest: ExportRequest

      try {
        exportRequest = {
          blogIdOrUrl: payload.blogIdOrUrl.trim(),
          outputDir: payload.outputDir.trim(),
          profile: "gfm",
          options: state.cloneOptions(payload.options),
        }
      } catch (error) {
        sendJson({ response, statusCode: 400, body: { error: toErrorMessage(error) } })
        return true
      }

      await recreateDir(resolveRepoPath(exportRequest.outputDir))
      await state.writeLastOutputDir(exportRequest.outputDir)

      const job = jobStore.create(exportRequest)
      state.jobScanResults.set(job.id, payload.scanResult ?? null)
      jobStore.appendLog(job.id, "작업을 큐에 등록했습니다.")

      void exportJobRunner.startTrackedJobTask({
        jobId: job.id,
        run: (signal) =>
          exportJobRunner.runExport({
            jobId: job.id,
            request: exportRequest,
            cachedScanResult: payload.scanResult ?? null,
            signal,
          }),
      })

      sendJson({ response, statusCode: 202, body: { jobId: job.id } })
      return true
    }

    const resumeMatch = url.pathname.match(/^\/api\/export\/([^/]+)\/resume$/)

    if (method !== "POST" || !resumeMatch?.[1]) {
      return false
    }

    const job = jobStore.get(resumeMatch[1])

    if (!job) {
      sendJson({ response, statusCode: 404, body: { error: "job not found" } })
      return true
    }

    if (job.status !== JOB_STATUSES.RUNNING || !job.resumeAvailable) {
      sendJson({
        response,
        statusCode: 409,
        body: { error: "재개 가능한 export 작업이 아닙니다." },
      })
      return true
    }

    void exportJobRunner.startTrackedJobTask({
      jobId: job.id,
      run: (signal) =>
        exportJobRunner.runExport({
          jobId: job.id,
          request: job.request,
          cachedScanResult: state.jobScanResults.get(job.id) ?? null,
          resume: true,
          signal,
        }),
    })

    sendJson({ response, statusCode: 202, body: { jobId: job.id, status: JOB_STATUSES.RUNNING } })
    return true
  }
