import { UPLOAD_PROVIDER_KEYS } from "@exitpress/domain/upload/UploadProviderKeys.js"
import {
  Box,
  Button,
  Checkbox,
  Flash,
  FormControl,
  SegmentedControl,
  Select,
  Text,
  TextInput,
} from "@primer/react"
import { useEffect } from "react"

import type {
  UploadProviderCatalogResponse,
  UploadProviderFields,
} from "@exitpress/domain/upload/schema/UploadProvider.js"

import type { AlistAuthMode } from "./UploadProviderFormRules.js"

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

const isAlistAuthMode = (value: string | undefined): value is AlistAuthMode =>
  value !== undefined && allAlistAuthModes.some((mode) => mode === value)

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

const fieldGridSx = {
  display: "grid",
  gap: 2,
  alignContent: "start",
  alignSelf: "start",
} as const

const fieldPanelSx = {
  bg: "canvas.subtle",
  border: "1px solid",
  borderColor: "border.default",
  borderRadius: 2,
  display: "grid",
  gap: 2,
  p: 3,
} as const

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
    return <Text sx={{ color: "fg.muted", fontSize: 1 }}>업로드 설정을 불러오지 못했습니다.</Text>
  }

  const testUploadDisabled = testUploadSubmitting || !providerSettingsReady
  return (
    <Box
      as="form"
      sx={{
        bg: "canvas.default",
        border: "1px solid",
        borderColor: "border.default",
        borderRadius: 2,
        display: "grid",
        gap: 3,
        p: 3,
      }}
      onSubmit={(event) => {
        event.preventDefault()
        void onTestUpload(buildValue())
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: ["1fr", null, null, "minmax(16rem,0.8fr) minmax(0,1.2fr)"],
          alignItems: "start",
        }}
      >
        <FormControl id="upload-providerKey">
          <FormControl.Label>Provider</FormControl.Label>
          <Select
            block
            id="upload-providerKey"
            value={providerKey}
            data-value={providerKey}
            aria-describedby="upload-providerKey-description"
            onChange={(event) => {
              const nextProviderKey = event.target.value
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
            {uploadProviders.providers.map((provider) => (
              <Select.Option key={provider.key} value={provider.key}>
                {provider.label}
              </Select.Option>
            ))}
          </Select>
          <FormControl.Caption id="upload-providerKey-description">
            {activeProviderDefinition.description}
          </FormControl.Caption>
        </FormControl>

        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: ["1fr", null, "1fr 1fr"] }}>
          {providerKey === UPLOAD_PROVIDER_KEYS.ALIST ? (
            <Box sx={{ ...fieldPanelSx, gridColumn: ["auto", null, "1 / -1"] }}>
              <Text sx={{ fontSize: 1, fontWeight: "semibold" }}>인증 방식</Text>
              <Text sx={{ color: "fg.muted", fontSize: 1, lineHeight: "24px" }}>
                AList는 Token 인증과 계정 인증 중 하나만 사용합니다.
              </Text>
              <SegmentedControl
                aria-label="인증 방식"
                fullWidth={{ narrow: true, regular: false }}
                onChange={(selectedIndex) => {
                  const nextMode = allAlistAuthModes[selectedIndex]

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
                <SegmentedControl.Button selected={activeProviderUiState.alistAuthMode === "token"}>
                  Token
                </SegmentedControl.Button>
                <SegmentedControl.Button
                  selected={activeProviderUiState.alistAuthMode === "account"}
                >
                  사용자 이름 + 비밀번호
                </SegmentedControl.Button>
              </SegmentedControl>
            </Box>
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
                <FormControl
                  key={`${providerKey}:${field.key}`}
                  id={fieldInputId}
                  layout="horizontal"
                  disabled={rule.disabled}
                  sx={{
                    ...fieldPanelSx,
                    alignItems: "flex-start",
                    gridColumn: ["auto", null, "1 / -1"],
                    opacity: rule.disabled ? 0.7 : 1,
                  }}
                >
                  <Checkbox
                    checked={activeProviderFields[field.key] === true}
                    aria-describedby={fieldDescribedBy}
                    onChange={(event) => {
                      const nextValue = event.target.checked
                      const nextProviderFields = {
                        ...activeProviderFields,
                        [field.key]: nextValue,
                      }

                      updateProviderField(field.key, nextValue)
                      onChange(buildValue({ nextProviderFields }))
                    }}
                  />
                  <Box sx={{ display: "grid", gap: 1, minWidth: 0 }}>
                    <FormControl.Label>{field.label}</FormControl.Label>
                    <FormControl.Caption id={fieldDescriptionId}>
                      {rule.description}
                    </FormControl.Caption>
                    {rule.disabledReason ? (
                      <Text
                        id={fieldDisabledReasonId}
                        sx={{ color: "attention.fg", fontSize: 1, lineHeight: "24px" }}
                      >
                        {rule.disabledReason}
                      </Text>
                    ) : field.placeholder ? (
                      <Text sx={{ color: "fg.muted", fontSize: 1, lineHeight: "24px" }}>
                        {field.placeholder}
                      </Text>
                    ) : null}
                  </Box>
                </FormControl>
              )
            }

            if (field.inputType === "select") {
              const currentValue = String(activeProviderFields[field.key] ?? "")

              return (
                <FormControl
                  key={`${providerKey}:${field.key}`}
                  id={fieldInputId}
                  disabled={rule.disabled}
                  sx={fieldGridSx}
                >
                  <FormControl.Label>{field.label}</FormControl.Label>
                  <FormControl.Caption id={fieldDescriptionId}>
                    {rule.description}
                  </FormControl.Caption>
                  <Select
                    block
                    id={fieldInputId}
                    value={
                      !field.required && currentValue === "" ? EMPTY_SELECT_VALUE : currentValue
                    }
                    disabled={rule.disabled}
                    data-value={currentValue}
                    aria-describedby={fieldDescribedBy}
                    onChange={(event) => {
                      const fieldValue =
                        event.target.value === EMPTY_SELECT_VALUE ? "" : event.target.value
                      const nextProviderFields = {
                        ...activeProviderFields,
                        [field.key]: fieldValue,
                      }

                      updateProviderField(field.key, fieldValue)
                      onChange(buildValue({ nextProviderFields }))
                    }}
                  >
                    {!field.required ? (
                      <Select.Option value={EMPTY_SELECT_VALUE}>선택 안 함</Select.Option>
                    ) : null}
                    {(field.options ?? []).map((option) => (
                      <Select.Option
                        key={`${field.key}:${option.value}`}
                        value={String(option.value)}
                      >
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                  {rule.disabledReason ? (
                    <Text
                      id={fieldDisabledReasonId}
                      sx={{ color: "attention.fg", fontSize: 1, lineHeight: "24px" }}
                    >
                      {rule.disabledReason}
                    </Text>
                  ) : null}
                </FormControl>
              )
            }

            return (
              <FormControl
                key={`${providerKey}:${field.key}`}
                id={fieldInputId}
                disabled={rule.disabled}
                sx={fieldGridSx}
              >
                <FormControl.Label>{field.label}</FormControl.Label>
                <FormControl.Caption id={fieldDescriptionId}>
                  {rule.description}
                </FormControl.Caption>
                <TextInput
                  block
                  id={fieldInputId}
                  type={field.inputType}
                  value={String(activeProviderFields[field.key] ?? "")}
                  disabled={rule.disabled}
                  aria-describedby={fieldDescribedBy}
                  placeholder={field.placeholder}
                  onChange={(event) => {
                    const nextProviderFields = {
                      ...activeProviderFields,
                      [field.key]: event.target.value,
                    }

                    updateProviderField(field.key, event.target.value)
                    onChange(buildValue({ nextProviderFields }))
                  }}
                />
                {rule.disabledReason ? (
                  <Text
                    id={fieldDisabledReasonId}
                    sx={{ color: "attention.fg", fontSize: 1, lineHeight: "24px" }}
                  >
                    {rule.disabledReason}
                  </Text>
                ) : null}
              </FormControl>
            )
          })}
        </Box>
      </Box>

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

      {testUploadResult ? <Flash>{resultToText(testUploadResult)}</Flash> : null}
      {testUploadError ? <Flash variant="danger">{testUploadError}</Flash> : null}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          type="submit"
          variant="primary"
          sx={{ width: ["100%", "auto"] }}
          disabled={testUploadDisabled}
        >
          {testUploadSubmitting ? "테스트 업로드 중..." : "테스트 업로드"}
        </Button>
      </Box>
    </Box>
  )
}
