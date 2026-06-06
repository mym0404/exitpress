import type {
  UploadProviderCatalogResponse,
  UploadProviderFields,
} from "@exitpress/domain/upload/UploadProviderTypes.js"

import { createCatalogFromRuntime, createRuntimeInstance } from "./ImageUploadRuntimeCatalog.js"
import { normalizeProviderFieldsFromCatalog } from "./UploadProviderFieldNormalization.js"

export type UploadProviderSource = {
  getCatalog: () => Promise<UploadProviderCatalogResponse>
  normalizeProviderFields: (
    providerKey: string,
    value: unknown,
  ) => Promise<UploadProviderFields | null>
}

export const createImageUploadProviderSource = (): UploadProviderSource => {
  let catalogPromise: Promise<UploadProviderCatalogResponse> | null = null

  const getCatalog = async () => {
    if (!catalogPromise) {
      catalogPromise = (async () => {
        const runtimeCatalog = await createRuntimeInstance()
        return createCatalogFromRuntime(runtimeCatalog)
      })()
    }

    return catalogPromise
  }

  const normalizeProviderFields = async (providerKey: string, value: unknown) => {
    return normalizeProviderFieldsFromCatalog({
      catalog: await getCatalog(),
      providerKey,
      value,
    })
  }

  return {
    getCatalog,
    normalizeProviderFields,
  }
}
