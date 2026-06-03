import type { IncomingMessage, ServerResponse } from "node:http"

import type { NaverBlogFetcherCache } from "../../integrations/naver-blog/NaverBlogFetcher.js"
import type { BlockScanJobRunner } from "../jobs/BlockScanJobRunner.js"
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
  blockScanJobRunner: BlockScanJobRunner
  exportJobRunner: HttpExportJobRunner
  postHtmlCache: NaverBlogFetcherCache
  uploadJobRunner: HttpUploadJobRunner
  uploadProviderSource: UploadProviderSource
  openLocalPath: (targetPath: string) => Promise<void> | void
}
