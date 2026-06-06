import { JOB_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import { UPLOAD_PROVIDER_KEYS } from "@exitpress/domain/upload/UploadProviderKeys.js"

import type { ExportJobState } from "@exitpress/domain/export-job/Types.js"
import type {
  UploadProviderCatalogResponse,
  UploadProviderFields,
} from "@exitpress/domain/upload/UploadProviderTypes.js"

import type { JobResultsMode } from "./JobResultsHelpers.js"

import { Button } from "../../components/ui/Button.js"
import { CardDescription } from "../../components/ui/Card.js"
import { Checkbox } from "../../components/ui/Checkbox.js"
import { Input } from "../../components/ui/Input.js"
import { Progress } from "../../components/ui/Progress.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select.js"
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/ToggleGroup.js"

import { CompactMetrics } from "./CompactMetrics.js"
import { panelCopy, toProgressValue } from "./JobResultsHelpers.js"
import { UploadGithubOptions } from "./UploadGithubOptions.js"
import {
  getUploadProviderFieldRule,
  hasMissingRequiredUploadProviderField,
  trimProviderFieldsForSubmit,
} from "./UploadProviderFormRules.js"
import { useUploadProviderForm } from "./UseUploadProviderForm.js"

const EMPTY_SELECT_VALUE = "__none__"

export const UploadPanel = ({
  mode,
  job,
  showUploadForm,
  uploadSubmitting,
  uploadProviders,
  uploadProviderError,
  onUploadStart,
}: {
  mode: JobResultsMode
  job: ExportJobState | null
  showUploadForm: boolean
  uploadSubmitting: boolean
  uploadProviders: UploadProviderCatalogResponse
  uploadProviderError: string | null
  onUploadStart: (input: {
    providerKey: string
    providerFields: UploadProviderFields
  }) => Promise<void> | void
}) => {
  const {
    providerKey,
    activeProviderDefinition,
    activeProviderFields,
    activeProviderUiState,
    githubUseJsDelivr,
    githubJsDelivrUrl,
    selectProvider,
    updateProviderField,
    updateProviderUiState,
  } = useUploadProviderForm({
    jobId: job?.id,
    uploadProviders,
  })
  const uploadProgressValue = toProgressValue(
    job?.upload.uploadedCount ?? 0,
    job?.upload.candidateCount ?? 0,
  )

  return (
    <section className="upload-panel subtle-panel grid gap-4 rounded-[1.5rem] p-4">
      <div className="grid gap-3 lg:flex lg:items-start lg:justify-between">
        {panelCopy[mode].description ? (
          <div>
            <CardDescription className="text-sm leading-7 text-muted-foreground">
              {panelCopy[mode].description}
            </CardDescription>
          </div>
        ) : null}
        <CompactMetrics
          items={[
            { label: "대상 글", value: String(job?.upload.eligiblePostCount ?? 0) },
            { label: "대상 자산", value: String(job?.upload.candidateCount ?? 0) },
            { label: "업로드 완료", value: String(job?.upload.uploadedCount ?? 0) },
            { label: "실패", value: String(job?.upload.failedCount ?? 0) },
          ]}
          className="field-card rounded-2xl px-4 py-3 lg:max-w-[32rem] lg:justify-end"
        />
      </div>

      <div className="field-card grid gap-2 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <strong className="text-sm font-semibold text-foreground">업로드 진행률</strong>
          <span className="text-sm text-muted-foreground">
            {job?.upload.uploadedCount ?? 0} / {job?.upload.candidateCount ?? 0}
          </span>
        </div>
        <Progress
          id="upload-progress"
          value={uploadProgressValue}
          indicatorClassName="bg-[var(--status-ready-fg)]"
        />
      </div>

      {showUploadForm ? (
        uploadProviderError ? (
          <p className="danger-copy text-sm leading-7">{uploadProviderError}</p>
        ) : uploadProviders.providers.length === 0 || !activeProviderDefinition ? (
          <p className="text-sm leading-7 text-muted-foreground">
            업로드 설정을 불러오지 못했습니다.
          </p>
        ) : (
          <form
            id="upload-form"
            className="field-card grid gap-4 rounded-[1.5rem] p-4"
            onSubmit={async (event) => {
              event.preventDefault()
              const normalizedProviderFields = trimProviderFieldsForSubmit({
                provider: activeProviderDefinition,
                providerFields: activeProviderFields,
                providerUiState: activeProviderUiState,
              })

              await onUploadStart({
                providerKey,
                providerFields: {
                  ...normalizedProviderFields,
                  ...(providerKey === UPLOAD_PROVIDER_KEYS.GITHUB && githubUseJsDelivr
                    ? {
                        customUrl: githubJsDelivrUrl,
                      }
                    : {}),
                },
              })
            }}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)] xl:items-start">
              <div className="grid gap-2">
                <label
                  htmlFor="upload-providerKey"
                  className="text-sm font-semibold text-foreground"
                >
                  Provider
                </label>
                <Select value={providerKey} onValueChange={selectProvider}>
                  <SelectTrigger
                    id="upload-providerKey"
                    data-value={providerKey}
                    aria-describedby="upload-providerKey-description"
                  >
                    <SelectValue placeholder="Provider 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {uploadProviders.providers.map((provider) => (
                        <SelectItem key={provider.key} value={provider.key}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p
                  id="upload-providerKey-description"
                  className="text-sm leading-6 text-muted-foreground"
                >
                  {activeProviderDefinition.description}
                </p>
              </div>
              <div className="grid items-start gap-3 sm:grid-cols-2">
                {providerKey === UPLOAD_PROVIDER_KEYS.ALIST ? (
                  <div className="subtle-panel grid gap-2 rounded-2xl px-4 py-3 sm:col-span-2">
                    <span className="text-sm font-semibold text-foreground">Authentication</span>
                    <span className="text-sm leading-6 text-muted-foreground">
                      AList는 Token 또는 계정 인증 중 하나만 사용합니다.
                    </span>
                    <ToggleGroup
                      type="single"
                      value={activeProviderUiState.alistAuthMode}
                      aria-label="Authentication 방식"
                      className="justify-start"
                      onValueChange={(nextMode) => {
                        if (!nextMode) {
                          return
                        }

                        updateProviderUiState({
                          alistAuthMode: nextMode as typeof activeProviderUiState.alistAuthMode,
                        })
                      }}
                    >
                      <ToggleGroupItem
                        value="token"
                        className="theme-toggle-item min-w-[6rem]"
                        aria-label="Token"
                      >
                        Token
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="account"
                        className="theme-toggle-item min-w-[10rem]"
                        aria-label="Username + Password"
                      >
                        Username + Password
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                ) : null}
                {activeProviderDefinition.fields.map((field) => {
                  const fieldInputId = `upload-providerField-${field.key}`
                  const fieldDescriptionId = `${fieldInputId}-description`
                  const fieldDisabledReasonId = `${fieldInputId}-disabled-reason`
                  const rule = getUploadProviderFieldRule({
                    providerKey,
                    field,
                    providerFields: activeProviderFields,
                    providerUiState: activeProviderUiState,
                  })
                  const fieldDescribedBy = rule.disabledReason
                    ? `${fieldDescriptionId} ${fieldDisabledReasonId}`
                    : fieldDescriptionId

                  if (field.inputType === "checkbox") {
                    return (
                      <div
                        key={`${providerKey}:${field.key}`}
                        className={`subtle-panel flex items-center gap-3 rounded-2xl px-4 py-3 sm:col-span-2 ${rule.disabled ? "opacity-70" : ""}`}
                      >
                        <Checkbox
                          id={fieldInputId}
                          checked={activeProviderFields[field.key] === true}
                          disabled={rule.disabled}
                          className="shrink-0"
                          aria-describedby={fieldDescribedBy}
                          onCheckedChange={(next) => updateProviderField(field.key, next === true)}
                        />
                        <span className="grid gap-1">
                          <label
                            htmlFor={fieldInputId}
                            className="text-sm font-semibold text-foreground"
                          >
                            {field.label}
                          </label>
                          <span
                            id={fieldDescriptionId}
                            className="text-sm leading-6 text-muted-foreground"
                          >
                            {rule.description}
                          </span>
                          {rule.disabledReason ? (
                            <span
                              id={fieldDisabledReasonId}
                              className="notice-copy text-sm leading-6"
                            >
                              {rule.disabledReason}
                            </span>
                          ) : field.placeholder ? (
                            <span className="text-sm leading-6 text-muted-foreground">
                              {field.placeholder}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    )
                  }

                  if (field.inputType === "select") {
                    return (
                      <div
                        key={`${providerKey}:${field.key}`}
                        className="grid content-start gap-2 self-start"
                      >
                        <label
                          htmlFor={fieldInputId}
                          className="text-sm font-semibold text-foreground"
                        >
                          {field.label}
                        </label>
                        <span
                          id={fieldDescriptionId}
                          className="text-sm leading-6 text-muted-foreground"
                        >
                          {rule.description}
                        </span>
                        <Select
                          value={
                            !field.required && String(activeProviderFields[field.key] ?? "") === ""
                              ? EMPTY_SELECT_VALUE
                              : String(activeProviderFields[field.key] ?? "")
                          }
                          disabled={rule.disabled}
                          onValueChange={(nextValue) =>
                            updateProviderField(
                              field.key,
                              nextValue === EMPTY_SELECT_VALUE ? "" : nextValue,
                            )
                          }
                        >
                          <SelectTrigger
                            id={fieldInputId}
                            data-value={String(activeProviderFields[field.key] ?? "")}
                            aria-describedby={fieldDescribedBy}
                          >
                            <SelectValue
                              placeholder={!field.required ? "선택 안 함" : "항목 선택"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {!field.required ? (
                                <SelectItem value={EMPTY_SELECT_VALUE}>선택 안 함</SelectItem>
                              ) : null}
                              {(field.options ?? []).map((option) => (
                                <SelectItem
                                  key={`${field.key}:${option.value}`}
                                  value={String(option.value)}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {rule.disabledReason ? (
                          <span
                            id={fieldDisabledReasonId}
                            className="notice-copy text-sm leading-6"
                          >
                            {rule.disabledReason}
                          </span>
                        ) : null}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={`${providerKey}:${field.key}`}
                      className="grid content-start gap-2 self-start"
                    >
                      <label
                        htmlFor={fieldInputId}
                        className="text-sm font-semibold text-foreground"
                      >
                        {field.label}
                      </label>
                      <span
                        id={fieldDescriptionId}
                        className="text-sm leading-6 text-muted-foreground"
                      >
                        {rule.description}
                      </span>
                      <Input
                        id={fieldInputId}
                        type={field.inputType}
                        value={String(activeProviderFields[field.key] ?? "")}
                        disabled={rule.disabled}
                        aria-describedby={fieldDescribedBy}
                        onChange={(event) => updateProviderField(field.key, event.target.value)}
                        placeholder={field.placeholder}
                      />
                      {rule.disabledReason ? (
                        <span id={fieldDisabledReasonId} className="notice-copy text-sm leading-6">
                          {rule.disabledReason}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
            <UploadGithubOptions
              providerKey={providerKey}
              githubUseJsDelivr={githubUseJsDelivr}
              githubJsDelivrUrl={githubJsDelivrUrl}
              updateProviderUiState={updateProviderUiState}
            />
            <div className="flex justify-end">
              <Button
                id="upload-submit"
                type="submit"
                className="w-full rounded-xl sm:w-auto"
                disabled={
                  uploadSubmitting ||
                  hasMissingRequiredUploadProviderField({
                    provider: activeProviderDefinition,
                    providerFields: activeProviderFields,
                    providerUiState: activeProviderUiState,
                  })
                }
              >
                {uploadSubmitting
                  ? "업로드 시작 중..."
                  : job?.status === JOB_STATUSES.UPLOADING && job.resumeAvailable
                    ? "남은 업로드 계속"
                    : "업로드 시작"}
              </Button>
            </div>
          </form>
        )
      ) : null}

      {job?.upload.status === "skipped" ? (
        <p className="text-sm leading-7 text-muted-foreground">
          업로드할 로컬 이미지가 없어 내보내기만 완료되었습니다.
        </p>
      ) : null}

      {job?.status === JOB_STATUSES.UPLOAD_FAILED && job.error ? (
        <p className="danger-copy text-sm leading-7">{job.error}</p>
      ) : null}
    </section>
  )
}
