import path from "node:path"

import { DEFAULT_UPLOAD_PROVIDER_KEY } from "@exitpress/domain/upload/UploadProviderKeys.js"
import { ensureDir, getProjectTempPath } from "@exitpress/engine/infra/node/FilePathUtils.js"

import type {
  UploadProviderCatalogResponse,
  UploadProviderDefinition,
  UploadProviderFieldDefinition,
} from "@exitpress/domain/upload/UploadProviderTypes.js"

import type { RuntimePluginField } from "./ImageUploadFieldDefinition.js"

import {
  getProviderDescription,
  normalizeFieldDefinition,
  normalizeProviderLabel,
} from "./ImageUploadFieldDefinition.js"

type RuntimeCatalogLike = {
  helper: {
    uploader: {
      getIdList: () => string[]
      get: (id: string) =>
        | {
            name?: string
            config?: (ctx: RuntimeCatalogLike) => RuntimePluginField[]
          }
        | undefined
    }
  }
}

export const createCatalogFromRuntime = (
  runtimeCatalog: RuntimeCatalogLike,
): UploadProviderCatalogResponse => {
  const providers = runtimeCatalog.helper.uploader.getIdList().map((key) => {
    const uploader = runtimeCatalog.helper.uploader.get(key)
    const label = normalizeProviderLabel(key, uploader?.name)
    const rawFields = uploader?.config?.(runtimeCatalog) ?? []
    const fields = rawFields
      .map((field) =>
        normalizeFieldDefinition({
          providerKey: key,
          field,
        }),
      )
      .filter((field): field is UploadProviderFieldDefinition => field !== null)

    return {
      key,
      label,
      description: getProviderDescription({
        key,
        label,
      }),
      fields,
    } satisfies UploadProviderDefinition
  })

  const defaultProviderKey =
    providers.find((provider) => provider.key === DEFAULT_UPLOAD_PROVIDER_KEY)?.key ??
    providers[0]?.key ??
    null

  return {
    defaultProviderKey,
    providers,
  }
}

export const createRuntimeInstance = async () => {
  const { PicGo } = await import("piclist")
  const runtimeConfigPath = getProjectTempPath("image-upload", "picgo-provider-config.json")

  await ensureDir(path.dirname(runtimeConfigPath))

  return PicGo.create(runtimeConfigPath)
}
