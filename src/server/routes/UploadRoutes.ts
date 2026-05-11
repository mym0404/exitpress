import type { ApiRouteContext, ApiRouteRequest } from "./ApiRouteContext.js"
import { isUploadActionableJob, JOB_STATUSES } from "../../domain/export-job/ExportJobState.js"
import { parseJsonBody, sendJson } from "../http/HttpResponse.js"
import { normalizeUploaderConfig } from "../upload/HttpUploadConfig.js"
import {
  rejectNonJson,
  rejectNonSameOrigin,
  sanitizeUploadProviderCatalogError,
} from "./RouteSupport.js"

export const handleUploadRoutes =
  ({ jobStore, exportJobRunner, uploadJobRunner, uploadProviderSource }: ApiRouteContext) =>
  async ({ request, response, method, url }: ApiRouteRequest) => {
    if (method === "GET" && url.pathname === "/api/upload-providers") {
      try {
        sendJson({ response, statusCode: 200, body: await uploadProviderSource.getCatalog() })
      } catch (error) {
        sendJson({
          response,
          statusCode: 503,
          body: { error: sanitizeUploadProviderCatalogError(error) },
        })
      }
      return true
    }

    const uploadMatch = url.pathname.match(/^\/api\/export\/([^/]+)\/upload$/)

    if (method !== "POST" || !uploadMatch?.[1]) {
      return false
    }

    if (rejectNonJson(request, response) || rejectNonSameOrigin(request, response)) {
      return true
    }

    const job = jobStore.get(uploadMatch[1])

    if (!job?.manifest) {
      sendJson({ response, statusCode: 404, body: { error: "job not found" } })
      return true
    }

    if (!isUploadActionableJob(job)) {
      sendJson({
        response,
        statusCode: 409,
        body: { error: "업로드 가능한 상태의 작업이 아닙니다." },
      })
      return true
    }

    if (
      job.request.options.assets.imageHandlingMode !== "download-and-upload" ||
      job.upload.candidateCount === 0
    ) {
      sendJson({ response, statusCode: 409, body: { error: "업로드 대상이 없는 작업입니다." } })
      return true
    }

    const payload = await parseJsonBody<{
      providerKey?: string
      providerFields?: unknown
    }>(request)

    const providerKey = payload.providerKey?.trim()
    const providerFields = providerKey
      ? await uploadProviderSource.normalizeProviderFields(providerKey, payload.providerFields)
      : null

    if (!providerKey || !providerFields) {
      sendJson({
        response,
        statusCode: 400,
        body: { error: "providerKey와 providerFields는 필수입니다." },
      })
      return true
    }

    void exportJobRunner.startTrackedJobTask({
      jobId: job.id,
      run: (signal) =>
        uploadJobRunner.runUploadForJob({
          jobId: job.id,
          uploaderKey: providerKey,
          uploaderConfig: normalizeUploaderConfig({ uploaderKey: providerKey, providerFields }),
          signal,
        }),
    })

    sendJson({ response, statusCode: 202, body: { jobId: job.id, status: JOB_STATUSES.UPLOADING } })
    return true
  }
