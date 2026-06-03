import type { IncomingMessage, ServerResponse } from "node:http"

import type { HttpExportJobRunner } from "../jobs/HttpExportJobRunner.js"
import type { JobStore } from "../jobs/JobStore.js"
import type { HttpServerState } from "../state/HttpServerState.js"
import type { HttpUploadJobRunner } from "../upload/HttpUploadJobRunner.js"
import type { UploadProviderSource } from "../upload/ImageUploadProviderSource.js"

export type ApiRouteRequest = {
  request: IncomingMessage
  response: ServerResponse
  method: string
  url: URL
}

export type ApiRouteContext = {
  jobStore: JobStore
  state: HttpServerState
  exportJobRunner: HttpExportJobRunner
  uploadJobRunner: HttpUploadJobRunner
  uploadProviderSource: UploadProviderSource
  openLocalPath: (targetPath: string) => Promise<void> | void
}
