import type { ApiRouteContext, ApiRouteRequest } from "./ApiRouteContext.js"
import { handleExportRoutes } from "./ExportRoutes.js"
import { handleJobReadRoutes } from "./JobReadRoutes.js"
import { handleLocalFileRoutes } from "./LocalFileRoutes.js"
import { handleResumeRoutes } from "./ResumeRoutes.js"
import { handleSettingsRoutes } from "./SettingsRoutes.js"
import { handleUploadRoutes } from "./UploadRoutes.js"

export const createApiRoutes = (context: ApiRouteContext) => {
  const handlers = [
    handleSettingsRoutes(context),
    handleResumeRoutes(context),
    handleLocalFileRoutes(context),
    handleUploadRoutes(context),
    handleExportRoutes(context),
    handleJobReadRoutes(context),
  ]

  const handleRequest = async (requestContext: ApiRouteRequest) => {
    for (const handler of handlers) {
      if (await handler(requestContext)) {
        return true
      }
    }

    return false
  }

  return {
    handleRequest,
  }
}
