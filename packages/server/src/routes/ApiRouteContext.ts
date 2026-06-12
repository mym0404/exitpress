import type { IncomingMessage, ServerResponse } from "node:http"

import type { BlogPostContentCache } from "@exitpress/engine/blog/Blog.js"
import type { BlogRegistry } from "@exitpress/engine/blog/BlogRegistry.js"
import type { runImageUploadPhase } from "@exitpress/engine/exporting/upload/ImageUploadPhase.js"

import type { BlockScanJobRunner } from "../jobs/BlockScanJobRunner.js"
import type { HttpExportJobRunner } from "../jobs/HttpExportJobRunner.js"
import type { JobStore } from "../jobs/JobStore.js"
import type { HttpServerState } from "../state/HttpServerState.js"
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
  blogRegistry: BlogRegistry
  blockScanJobRunner: BlockScanJobRunner
  exportJobRunner: HttpExportJobRunner
  postHtmlCache: BlogPostContentCache
  uploadPhaseRunner: typeof runImageUploadPhase
  uploadProviderSource: UploadProviderSource
  openLocalPath: (targetPath: string) => Promise<void> | void
}
