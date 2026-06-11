import { UPLOAD_PROVIDER_KEYS } from "@exitpress/domain/upload/UploadProviderKeys.js"
import { useEffect } from "react"

import type {
  UploadProviderCatalogResponse,
  UploadProviderFields,
} from "@exitpress/domain/upload/schema/UploadProvider.js"

import type { AlistAuthMode } from "./UploadProviderFormRules.js"

import { Button } from "../../components/ui/Button.js"
import { Checkbox } from "../../components/ui/Checkbox.js"
import { Input } from "../../components/ui/Input.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select.js"
import { ToggleGroup, ToggleGroupItem } from "../../components/ui/ToggleGroup.js"

import { UploadGithubOptions } from "./UploadGithubOptions.js"
import {
  allAlistAuthModes,
  buildInitialProviderUiState,
  getUploadProviderFieldRule,
  hasMissingRequiredUploadProviderField,
  trimProviderFieldsForSubmit,
} from "./UploadProviderFormRules.js"
import {
  buildGitHubJsDelivrCustomUrl,
  buildInitialProviderFields,
  useUploadProviderForm,
} from "./UseUploadProviderForm.js"

const EMPTY_SELECT_VALUE = "__none__"

const isAlistAuthMode = (value: string): value is AlistAuthMode =>
  allAlistAuthModes.some((mode) => mode === value)

export type UploadProviderSettingsValue = {
  providerKey: string
  providerFields: UploadProviderFields
}

const resultToText = (value: unknown) => {
  if (typeof value === "string") {
    return value
  }

  if (value === null || value === undefined) {
    return ""
  }

  return JSON.stringify(value)
}

export const UploadProviderSettingsForm = ({
  resetKey,
  uploadProviders,
  testUploadSubmitting,
  testUploadResult,
  testUploadError,
  onChange,
  onReadyChange,
  onTestUpload,
}: {
  resetKey: string | undefined
  uploadProviders: UploadProviderCatalogResponse
  testUploadSubmitting: boolean
  testUploadResult: unknown
  testUploadError: string | null
  onChange: (value: UploadProviderSettingsValue) => void
  onReadyChange?: (ready: boolean) => void
  onTestUpload: (value: UploadProviderSettingsValue) => Promise<void> | void
}) => {
  const {
    providerKey,
    providerFieldMap,
    providerUiStateMap,
    activeProviderDefinition,
    activeProviderFields,
    activeProviderUiState,
    githubUseJsDelivr,
    githubJsDelivrUrl,
    selectProvider,
    updateProviderField,
    updateProviderUiState,
  } = useUploadProviderForm({
    resetKey,
    uploadProviders,
  })

  const buildValue = ({
    nextProviderKey = providerKey,
    nextProviderFields = activeProviderFields,
    nextProviderUiState,
  }: {
    nextProviderKey?: string
    nextProviderFields?: UploadProviderFields
    nextProviderUiState?: typeof activeProviderUiState
  } = {}): UploadProviderSettingsValue => {
    const provider = uploadProviders.providers.find((item) => item.key === nextProviderKey) ?? null
    const providerUiState =
      nextProviderUiState ??
      (nextProviderKey === providerKey
        ? activeProviderUiState
        : (providerUiStateMap[nextProviderKey] ?? buildInitialProviderUiState()))
    const normalizedProviderFields = trimProviderFieldsForSubmit({
      provider,
      providerFields: nextProviderFields,
      providerUiState,
    })
    const nextGithubJsDelivrUrl = buildGitHubJsDelivrCustomUrl({
      repo: String(nextProviderFields.repo ?? ""),
      branch: String(nextProviderFields.branch ?? ""),
    })

    return {
      providerKey: nextProviderKey,
      providerFields: {
        ...normalizedProviderFields,
        ...(nextProviderKey === UPLOAD_PROVIDER_KEYS.GITHUB && providerUiState.githubUseJsDelivr
          ? {
              customUrl: nextGithubJsDelivrUrl,
            }
          : {}),
      },
    }
  }

  const providerSettingsReady = activeProviderDefinition
    ? !hasMissingRequiredUploadProviderField({
        provider: activeProviderDefinition,
        providerFields: activeProviderFields,
        providerUiState: activeProviderUiState,
      })
    : false

  useEffect(() => {
    onReadyChange?.(providerSettingsReady)
  }, [onReadyChange, providerSettingsReady])

  if (uploadProviders.providers.length === 0 || !activeProviderDefinition) {
    return (
      <p className="text-sm leading-7 text-muted-foreground">업로드 설정을 불러오지 못했습니다.</p>
    )
  }

  const testUploadDisabled = testUploadSubmitting || !providerSettingsReady

  return (
    <form
      className="field-card grid gap-4 rounded-[1.5rem] p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onTestUpload(buildValue())
      }}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)] xl:items-start">
        <div className="grid gap-2">
          <label htmlFor="upload-providerKey" className="text-sm font-semibold text-foreground">
            Provider
          </label>
          <Select
            value={providerKey}
            onValueChange={(nextProviderKey) => {
              const nextProvider =
                uploadProviders.providers.find((provider) => provider.key === nextProviderKey) ??
                null
              const nextProviderFields =
                providerFieldMap[nextProviderKey] ?? buildInitialProviderFields(nextProvider)

              selectProvider(nextProviderKey)
              onChange(
                buildValue({
                  nextProviderKey,
                  nextProviderFields,
                }),
              )
            }}
          >
            <SelectTrigger
              id="upload-providerKey"
              data-value={providerKey}
              aria-describedby="upload-providerKey-description"
            >
              <SelectValue placeholder="서비스 선택" />
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
              <span className="text-sm font-semibold text-foreground">인증 방식</span>
              <span className="text-sm leading-6 text-muted-foreground">
                AList는 Token 인증과 계정 인증 중 하나만 사용합니다.
              </span>
              <ToggleGroup
                type="single"
                value={activeProviderUiState.alistAuthMode}
                aria-label="인증 방식"
                className="justify-start"
                onValueChange={(nextMode) => {
                  if (!isAlistAuthMode(nextMode)) {
                    return
                  }

                  const nextProviderUiState = {
                    ...activeProviderUiState,
                    alistAuthMode: nextMode,
                  }

                  updateProviderUiState({
                    alistAuthMode: nextProviderUiState.alistAuthMode,
                  })
                  onChange(buildValue({ nextProviderUiState }))
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
                  aria-label="사용자 이름 + 비밀번호"
                >
                  사용자 이름 + 비밀번호
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
                    onCheckedChange={(next) => {
                      const nextValue = next === true
                      const nextProviderFields = {
                        ...activeProviderFields,
                        [field.key]: nextValue,
                      }

                      updateProviderField(field.key, nextValue)
                      onChange(buildValue({ nextProviderFields }))
                    }}
                  />
                  <span className="grid gap-1">
                    <label htmlFor={fieldInputId} className="text-sm font-semibold text-foreground">
                      {field.label}
                    </label>
                    <span
                      id={fieldDescriptionId}
                      className="text-sm leading-6 text-muted-foreground"
                    >
                      {rule.description}
                    </span>
                    {rule.disabledReason ? (
                      <span id={fieldDisabledReasonId} className="notice-copy text-sm leading-6">
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
                  <label htmlFor={fieldInputId} className="text-sm font-semibold text-foreground">
                    {field.label}
                  </label>
                  <span id={fieldDescriptionId} className="text-sm leading-6 text-muted-foreground">
                    {rule.description}
                  </span>
                  <Select
                    value={
                      !field.required && String(activeProviderFields[field.key] ?? "") === ""
                        ? EMPTY_SELECT_VALUE
                        : String(activeProviderFields[field.key] ?? "")
                    }
                    disabled={rule.disabled}
                    onValueChange={(nextValue) => {
                      const fieldValue = nextValue === EMPTY_SELECT_VALUE ? "" : nextValue
                      const nextProviderFields = {
                        ...activeProviderFields,
                        [field.key]: fieldValue,
                      }

                      updateProviderField(field.key, fieldValue)
                      onChange(buildValue({ nextProviderFields }))
                    }}
                  >
                    <SelectTrigger
                      id={fieldInputId}
                      data-value={String(activeProviderFields[field.key] ?? "")}
                      aria-describedby={fieldDescribedBy}
                    >
                      <SelectValue placeholder={!field.required ? "선택 안 함" : "항목 선택"} />
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
                    <span id={fieldDisabledReasonId} className="notice-copy text-sm leading-6">
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
                <label htmlFor={fieldInputId} className="text-sm font-semibold text-foreground">
                  {field.label}
                </label>
                <span id={fieldDescriptionId} className="text-sm leading-6 text-muted-foreground">
                  {rule.description}
                </span>
                <Input
                  id={fieldInputId}
                  type={field.inputType}
                  value={String(activeProviderFields[field.key] ?? "")}
                  disabled={rule.disabled}
                  aria-describedby={fieldDescribedBy}
                  onChange={(event) => {
                    const nextProviderFields = {
                      ...activeProviderFields,
                      [field.key]: event.target.value,
                    }

                    updateProviderField(field.key, event.target.value)
                    onChange(buildValue({ nextProviderFields }))
                  }}
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
        updateProviderUiState={(nextState) => {
          const nextProviderUiState = {
            ...activeProviderUiState,
            ...nextState,
          }

          updateProviderUiState(nextState)
          onChange(buildValue({ nextProviderUiState }))
        }}
      />
      {testUploadResult ? (
        <p className="notice-copy text-sm leading-7">{resultToText(testUploadResult)}</p>
      ) : null}
      {testUploadError ? <p className="danger-copy text-sm leading-7">{testUploadError}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" className="w-full rounded-xl sm:w-auto" disabled={testUploadDisabled}>
          {testUploadSubmitting ? "테스트 업로드 중..." : "테스트 업로드"}
        </Button>
      </div>
    </form>
  )
}
