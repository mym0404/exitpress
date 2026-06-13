import { Box, Flash } from "@primer/react"

import type { UploadProviderCatalogResponse } from "@exitpress/domain/upload/schema/UploadProvider.js"

import type { UploadProviderSettingsValue } from "../upload/UploadProviderSettingsForm.js"

import { UploadProviderSettingsForm } from "../upload/UploadProviderSettingsForm.js"

export const UploadProviderOptionsStep = ({
  uploadProviders,
  uploadProviderError,
  stepMessage,
  testUploadSubmitting,
  testUploadResult,
  testUploadError,
  onChange,
  onReadyChange,
  onTestUpload,
}: {
  uploadProviders: UploadProviderCatalogResponse
  uploadProviderError: string | null
  stepMessage: string | null
  testUploadSubmitting: boolean
  testUploadResult: string | null
  testUploadError: string | null
  onChange: (value: UploadProviderSettingsValue) => void
  onReadyChange: (ready: boolean) => void
  onTestUpload: (value: UploadProviderSettingsValue) => Promise<void> | void
}) => (
  <Box id="upload-provider-panel">
    <Box id="upload-provider-form" sx={{ display: "grid", gap: 4 }}>
      {uploadProviderError ? <Flash variant="danger">{uploadProviderError}</Flash> : null}
      {stepMessage ? <Flash variant="danger">{stepMessage}</Flash> : null}
      <UploadProviderSettingsForm
        resetKey={uploadProviders.defaultProviderKey ?? undefined}
        uploadProviders={uploadProviders}
        testUploadSubmitting={testUploadSubmitting}
        testUploadResult={testUploadResult}
        testUploadError={testUploadError}
        onChange={onChange}
        onReadyChange={onReadyChange}
        onTestUpload={onTestUpload}
      />
    </Box>
  </Box>
)
