import { useEffect, useState } from "react"

import type { UploadProviderCatalogResponse } from "../../../server/Types.js"
import { fetchJson } from "../../lib/Api.js"

const emptyUploadProviders: UploadProviderCatalogResponse = {
  defaultProviderKey: null,
  providers: [],
}

const uploadProviderLoadErrorMessage = "업로드 설정을 불러오지 못했습니다."

export const useUploadProvidersCatalog = ({
  jobId,
  shouldLoad,
}: {
  jobId: string | undefined
  shouldLoad: boolean
}) => {
  const [uploadProviders, setUploadProviders] = useState(emptyUploadProviders)
  const [uploadProviderError, setUploadProviderError] = useState<string | null>(null)

  useEffect(() => {
    setUploadProviders(emptyUploadProviders)
    setUploadProviderError(null)
  }, [jobId])

  useEffect(() => {
    if (!shouldLoad || uploadProviders.providers.length > 0 || uploadProviderError) {
      return
    }

    let cancelled = false

    const loadCatalog = async () => {
      try {
        const nextCatalog = await fetchJson<UploadProviderCatalogResponse>("/api/upload-providers")

        if (cancelled) {
          return
        }

        setUploadProviders(nextCatalog)
        setUploadProviderError(null)
      } catch {
        if (cancelled) {
          return
        }

        setUploadProviders(emptyUploadProviders)
        setUploadProviderError(uploadProviderLoadErrorMessage)
      }
    }

    void loadCatalog()

    return () => {
      cancelled = true
    }
  }, [shouldLoad, uploadProviderError, uploadProviders.providers.length])

  return {
    uploadProviders,
    uploadProviderError,
  }
}
