import { createServer } from "node:http"

import type { Server as NodeHttpServer } from "node:http"

import type { UploadProviderSource } from "../upload/ImageUploadProviderSource.js"

import { runImageUploadPhase } from "../../exporting/upload/ImageUploadPhase.js"
import {
  rewriteImageUploadPost,
  writeImageUploadManifestSnapshot,
} from "../../exporting/upload/ImageUploadRewriter.js"
import { NaverBlog } from "../../parsing/naver-blog/NaverBlog.js"
import { toErrorMessage } from "../../shared/error/ErrorUtils.js"
import { createBlockScanJobRunner } from "../jobs/BlockScanJobRunner.js"
import { BlockScanJobStore } from "../jobs/BlockScanJobStore.js"
import { createHttpExportJobRunner } from "../jobs/HttpExportJobRunner.js"
import { JobStore } from "../jobs/JobStore.js"
import { createApiRoutes } from "../routes/ApiRoutes.js"
import { openLocalPathWithSystem } from "../routes/LocalFileService.js"
import { createHttpServerState } from "../state/HttpServerState.js"
import { createPostHtmlCache } from "../state/PostHtmlCache.js"
import { createBrowserAppResponder } from "../static/BrowserApp.js"
import { createHttpUploadJobRunner } from "../upload/HttpUploadJobRunner.js"
import { createImageUploadProviderSource } from "../upload/ImageUploadProviderSource.js"

import { sendJson } from "./HttpResponse.js"
import {
  defaultOutputDir,
  defaultPostHtmlCacheDir,
  defaultScanCachePath,
  defaultSettingsPath,
  defaultThemePreference,
} from "./ServerPaths.js"

export const createHttpServer = ({
  jobStore = new JobStore(),
  uploadPhaseRunner = runImageUploadPhase,
  postUploadRewriter = rewriteImageUploadPost,
  manifestSnapshotWriter = writeImageUploadManifestSnapshot,
  scanCachePath = defaultScanCachePath,
  postHtmlCacheDir = defaultPostHtmlCacheDir,
  settingsPath = defaultSettingsPath,
  uploadProviderSource = createImageUploadProviderSource(),
  openLocalPath = openLocalPathWithSystem,
}: {
  jobStore?: JobStore
  uploadPhaseRunner?: typeof runImageUploadPhase
  postUploadRewriter?: typeof rewriteImageUploadPost
  manifestSnapshotWriter?: typeof writeImageUploadManifestSnapshot
  scanCachePath?: string
  postHtmlCacheDir?: string
  settingsPath?: string
  uploadProviderSource?: UploadProviderSource
  openLocalPath?: (targetPath: string) => Promise<void> | void
} = {}) => {
  let httpServer: NodeHttpServer
  const blockTemplateDefinitions = new NaverBlog().getBlockTemplateDefinitions()
  const state = createHttpServerState({
    jobStore,
    scanCachePath,
    settingsPath,
    defaultOutputDir,
    defaultThemePreference,
    blockTemplateDefinitions,
  })
  const postHtmlCache = createPostHtmlCache({
    cacheDir: postHtmlCacheDir,
  })
  const blockScanJobRunner = createBlockScanJobRunner({
    jobStore: new BlockScanJobStore(),
    blockTemplateDefinitions,
    postHtmlCache,
  })
  const exportJobRunner = createHttpExportJobRunner({
    jobStore,
    jobScanResults: state.jobScanResults,
    postHtmlCache,
  })
  const uploadJobRunner = createHttpUploadJobRunner({
    jobStore,
    uploadPhaseRunner,
    postUploadRewriter,
    manifestSnapshotWriter,
    flushManifestPersist: exportJobRunner.flushManifestPersist,
    scheduleJobManifestPersist: exportJobRunner.scheduleJobManifestPersist,
  })
  const browserApp = createBrowserAppResponder({
    httpServerRef: () => httpServer,
  })
  const apiRoutes = createApiRoutes({
    jobStore,
    state,
    blockScanJobRunner,
    exportJobRunner,
    postHtmlCache,
    uploadJobRunner,
    uploadProviderSource,
    openLocalPath,
  })

  httpServer = createServer(async (request, response) => {
    const method = request.method ?? "GET"
    const url = new URL(request.url ?? "/", "http://localhost")

    try {
      if (method === "GET" && !url.pathname.startsWith("/api/")) {
        await browserApp.sendBrowserApp({
          request,
          response,
          pathname: url.pathname,
        })
        return
      }

      if (
        await apiRoutes.handleRequest({
          request,
          response,
          method,
          url,
        })
      ) {
        return
      }

      sendJson({
        response,
        statusCode: 404,
        body: {
          error: "not found",
        },
      })
    } catch (error) {
      sendJson({
        response,
        statusCode: 500,
        body: {
          error: toErrorMessage(error),
        },
      })
    }
  })

  httpServer.once("close", () => {
    browserApp.close()
  })

  return httpServer
}
