import {
  DEFAULT_UPLOAD_PROVIDER_KEY,
  UPLOAD_PROVIDER_KEYS,
} from "@exitpress/domain/upload/UploadProviderKeys.js"
import { useEffect, useState } from "react"

import type {
  UploadProviderCatalogResponse,
  UploadProviderDefinition,
  UploadProviderFields,
} from "@exitpress/domain/upload/schema/UploadProvider.js"

import type { ProviderUiState } from "./UploadProviderFormRules.js"

import { buildInitialProviderUiState } from "./UploadProviderFormRules.js"

export const buildInitialProviderFields = (
  provider: UploadProviderDefinition | null,
): UploadProviderFields =>
  Object.fromEntries(
    (provider?.fields ?? []).map((field) => {
      if (field.inputType === "checkbox") {
        return [field.key, field.defaultValue === true]
      }

      if (
        field.inputType === "select" &&
        field.required &&
        (field.defaultValue === null || field.defaultValue === undefined)
      ) {
        return [field.key, String(field.options?.[0]?.value ?? "")]
      }

      if (field.defaultValue === null || field.defaultValue === undefined) {
        return [field.key, ""]
      }

      return [field.key, String(field.defaultValue)]
    }),
  )

const buildInitialProviderFieldMap = (catalog: UploadProviderCatalogResponse) => {
  const fieldsByProvider: Record<string, UploadProviderFields> = {}

  for (const provider of catalog.providers) {
    fieldsByProvider[provider.key] = buildInitialProviderFields(provider)
  }

  return fieldsByProvider
}

const buildInitialProviderUiStateMap = (catalog: UploadProviderCatalogResponse) => {
  const uiStateByProvider: Record<string, ProviderUiState> = {}

  for (const provider of catalog.providers) {
    uiStateByProvider[provider.key] = buildInitialProviderUiState()
  }

  return uiStateByProvider
}

const getPreferredDefaultProviderKey = (catalog: UploadProviderCatalogResponse) =>
  catalog.providers.find((provider) => provider.key === DEFAULT_UPLOAD_PROVIDER_KEY)?.key ??
  catalog.defaultProviderKey ??
  catalog.providers[0]?.key ??
  ""

export const buildGitHubJsDelivrCustomUrl = ({
  repo,
  branch,
}: {
  repo: string
  branch: string
}) => {
  const normalizedRepo = repo.trim().replace(/^\/+|\/+$/g, "")
  const normalizedBranch = branch.trim()

  if (!normalizedRepo) {
    return ""
  }

  return `https://cdn.jsdelivr.net/gh/${normalizedRepo}${normalizedBranch ? `@${normalizedBranch}` : ""}`
}

export const useUploadProviderForm = ({
  resetKey,
  uploadProviders,
}: {
  resetKey: string | undefined
  uploadProviders: UploadProviderCatalogResponse
}) => {
  const [providerKey, setProviderKey] = useState(() =>
    getPreferredDefaultProviderKey(uploadProviders),
  )
  const [providerFieldMap, setProviderFieldMap] = useState<Record<string, UploadProviderFields>>(
    () => buildInitialProviderFieldMap(uploadProviders),
  )
  const [providerUiStateMap, setProviderUiStateMap] = useState<Record<string, ProviderUiState>>(
    () => buildInitialProviderUiStateMap(uploadProviders),
  )

  useEffect(() => {
    if (!resetKey) {
      return
    }

    setProviderKey(getPreferredDefaultProviderKey(uploadProviders))
    setProviderFieldMap(buildInitialProviderFieldMap(uploadProviders))
    setProviderUiStateMap(buildInitialProviderUiStateMap(uploadProviders))
  }, [resetKey, uploadProviders])

  const activeProviderDefinition =
    uploadProviders.providers.find((provider) => provider.key === providerKey) ?? null
  const activeProviderFields =
    providerFieldMap[providerKey] ?? buildInitialProviderFields(activeProviderDefinition)
  const activeProviderUiState = providerUiStateMap[providerKey] ?? buildInitialProviderUiState()
  const githubUseJsDelivr = activeProviderUiState.githubUseJsDelivr
  const githubJsDelivrUrl = buildGitHubJsDelivrCustomUrl({
    repo: String(activeProviderFields.repo ?? ""),
    branch: String(activeProviderFields.branch ?? ""),
  })

  const updateProviderField = (key: string, value: UploadProviderFields[string]) => {
    setProviderFieldMap((current) => ({
      ...current,
      [providerKey]: {
        ...(current[providerKey] ?? buildInitialProviderFields(activeProviderDefinition)),
        [key]: value,
      },
    }))
  }

  const updateProviderUiState = (nextState: Partial<ProviderUiState>) => {
    setProviderUiStateMap((current) => ({
      ...current,
      [providerKey]: {
        ...activeProviderUiState,
        ...nextState,
      },
    }))
  }

  const selectProvider = (nextProviderKey: string) => {
    setProviderKey(nextProviderKey)
    setProviderFieldMap((current) =>
      current[nextProviderKey]
        ? current
        : {
            ...current,
            [nextProviderKey]: buildInitialProviderFields(
              uploadProviders.providers.find((provider) => provider.key === nextProviderKey) ??
                null,
            ),
          },
    )
    setProviderUiStateMap((current) =>
      current[nextProviderKey]
        ? current
        : {
            ...current,
            [nextProviderKey]: buildInitialProviderUiState(),
          },
    )
  }

  return {
    providerKey,
    providerFieldMap,
    providerUiStateMap,
    activeProviderDefinition,
    activeProviderFields,
    activeProviderUiState,
    githubUseJsDelivr,
    githubJsDelivrUrl,
    isGitHubProvider: providerKey === UPLOAD_PROVIDER_KEYS.GITHUB,
    selectProvider,
    updateProviderField,
    updateProviderUiState,
  }
}
