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
import { createHttpExportJobRunner } from "../jobs/HttpExportJobRunner.js"
import { JobStore } from "../jobs/JobStore.js"
import { createApiRoutes } from "../routes/ApiRoutes.js"
import { openLocalPathWithSystem } from "../routes/LocalFileService.js"
import { createHttpServerState } from "../state/HttpServerState.js"
import { createBrowserAppResponder } from "../static/BrowserApp.js"
import { createHttpUploadJobRunner } from "../upload/HttpUploadJobRunner.js"
import { createImageUploadProviderSource } from "../upload/ImageUploadProviderSource.js"

import { sendJson } from "./HttpResponse.js"
import {
  defaultOutputDir,
  defaultScanCachePath,
  defaultSettingsPath,
  defaultThemePreference,
  legacyScanCachePath,
  legacySettingsPath,
} from "./ServerPaths.js"

export const createHttpServer = ({
  jobStore = new JobStore(),
  uploadPhaseRunner = runImageUploadPhase,
  postUploadRewriter = rewriteImageUploadPost,
  manifestSnapshotWriter = writeImageUploadManifestSnapshot,
  scanCachePath = defaultScanCachePath,
  settingsPath = defaultSettingsPath,
  uploadProviderSource = createImageUploadProviderSource(),
  openLocalPath = openLocalPathWithSystem,
}: {
  jobStore?: JobStore
  uploadPhaseRunner?: typeof runImageUploadPhase
  postUploadRewriter?: typeof rewriteImageUploadPost
  manifestSnapshotWriter?: typeof writeImageUploadManifestSnapshot
  scanCachePath?: string
  settingsPath?: string
  uploadProviderSource?: UploadProviderSource
  openLocalPath?: (targetPath: string) => Promise<void> | void
} = {}) => {
  let httpServer: NodeHttpServer
  const blockOutputDefinitions = new NaverBlog().getBlockOutputDefinitions()
  const state = createHttpServerState({
    jobStore,
    scanCachePath,
    legacyScanCachePath: scanCachePath === defaultScanCachePath ? legacyScanCachePath : undefined,
    settingsPath,
    legacySettingsPath: settingsPath === defaultSettingsPath ? legacySettingsPath : undefined,
    defaultOutputDir,
    defaultThemePreference,
    blockOutputDefinitions,
  })
  const exportJobRunner = createHttpExportJobRunner({
    jobStore,
    jobScanResults: state.jobScanResults,
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
    exportJobRunner,
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
