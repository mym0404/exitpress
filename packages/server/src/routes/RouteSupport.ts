import { toErrorMessage } from "@exitpress/engine/shared/error/ErrorUtils.js"

import type { IncomingMessage, ServerResponse } from "node:http"

import { hasJsonContentType, sendJson } from "../http/HttpResponse.js"

import { isSameOriginUploadRequest } from "./LocalFileService.js"

export const rejectNonJson = (request: IncomingMessage, response: ServerResponse) => {
  if (hasJsonContentType(request)) {
    return false
  }

  sendJson({
    response,
    statusCode: 415,
    body: {
      error: "application/json 요청만 허용합니다.",
    },
  })
  return true
}

export const rejectNonSameOrigin = (request: IncomingMessage, response: ServerResponse) => {
  if (isSameOriginUploadRequest(request)) {
    return false
  }

  sendJson({
    response,
    statusCode: 403,
    body: {
      error: "same-origin XHR 요청만 허용합니다.",
    },
  })
  return true
}

export const sanitizeUploadProviderCatalogError = (error: unknown) => {
  const rawMessage = toErrorMessage(error).replace(/\s+/g, " ").trim()

  if (!rawMessage) {
    return "업로드 설정을 불러오지 못했습니다."
  }

  return "업로드 설정을 불러오지 못했습니다."
}
