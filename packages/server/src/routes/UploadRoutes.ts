import type { UploadProviderFields } from "@exitpress/domain/upload/schema/UploadProvider.js"

import type { ApiRouteContext, ApiRouteRequest } from "./ApiRouteContext.js"

import { parseJsonBody, sendJson } from "../http/HttpResponse.js"
import { normalizeUploaderConfig, sanitizeUploadError } from "../upload/HttpUploadConfig.js"
import { runUploadProviderTest } from "../upload/HttpUploadProviderTest.js"
import { createHttpUploadTestAsset } from "../upload/HttpUploadTestAsset.js"

import {
  rejectNonJson,
  rejectNonSameOrigin,
  sanitizeUploadProviderCatalogError,
} from "./RouteSupport.js"

const uploadProviderRequiredError = "providerKey와 providerFields는 필수입니다."
const uploadProviderValidationError = "업로드 provider 설정을 확인하지 못했습니다."

export const handleUploadRoutes =
  ({ uploadPhaseRunner, uploadProviderSource }: ApiRouteContext) =>
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

    if (method === "POST" && url.pathname === "/api/upload-providers/test") {
      if (rejectNonJson(request, response) || rejectNonSameOrigin(request, response)) {
        return true
      }

      const payload = await parseJsonBody<{
        providerKey?: unknown
        providerFields?: unknown
      }>(request)

      const providerKey = typeof payload.providerKey === "string" ? payload.providerKey.trim() : ""
      let providerFields: UploadProviderFields | null = null

      try {
        providerFields = providerKey
          ? await uploadProviderSource.normalizeProviderFields(providerKey, payload.providerFields)
          : null
      } catch {
        sendJson({ response, statusCode: 400, body: { error: uploadProviderValidationError } })
        return true
      }

      if (!providerKey || !providerFields) {
        sendJson({
          response,
          statusCode: 400,
          body: { error: uploadProviderRequiredError },
        })
        return true
      }

      const testAsset = await createHttpUploadTestAsset()
      let statusCode = 200
      let body: { uploadedUrl: string } | { error: string }

      try {
        const uploadedUrl = await runUploadProviderTest({
          uploadPhaseRunner,
          outputDir: testAsset.outputDir,
          candidate: testAsset.candidate,
          uploaderKey: providerKey,
          uploaderConfig: normalizeUploaderConfig({ uploaderKey: providerKey, providerFields }),
        })

        body = { uploadedUrl }
      } catch (error) {
        statusCode = 502
        body = { error: sanitizeUploadError({ error, providerFields }) }
      } finally {
        await testAsset.remove()
      }

      sendJson({ response, statusCode, body })
      return true
    }

    return false
  }
