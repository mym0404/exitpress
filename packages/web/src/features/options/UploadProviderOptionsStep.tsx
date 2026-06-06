import type { UploadProviderCatalogResponse } from "@exitpress/domain/upload/schema/UploadProvider.js"

import type { UploadProviderSettingsValue } from "../upload/UploadProviderSettingsForm.js"

import { Card, CardContent } from "../../components/ui/Card.js"
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
  <Card variant="panel" className="board-card overflow-hidden" id="upload-provider-panel">
    <CardContent className="panel-body grid gap-4 p-5">
      <div id="upload-provider-form" className="form-stack grid gap-5">
        {uploadProviderError ? (
          <p className="danger-copy text-sm leading-7">{uploadProviderError}</p>
        ) : null}
        {stepMessage ? <p className="danger-copy text-sm leading-7">{stepMessage}</p> : null}
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
      </div>
    </CardContent>
  </Card>
)
