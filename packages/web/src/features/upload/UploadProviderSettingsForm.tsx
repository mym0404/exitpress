import { UPLOAD_PROVIDER_KEYS } from "@exitpress/domain/upload/UploadProviderKeys.js"
import {
  Box,
  Button,
  Checkbox,
  Flash,
  FormControl,
  SegmentedControl,
  Text,
  TextInput,
} from "@primer/react"
import { useEffect } from "react"

import type {
  UploadProviderCatalogResponse,
  UploadProviderFields,
} from "@exitpress/domain/upload/schema/UploadProvider.js"

import type { AlistAuthMode } from "./UploadProviderFormRules.js"

import { PrimerSelectActionMenu } from "../../components/primer/PrimerSelectActionMenu.js"

import { UploadGithubOptions, uploadFormRowSx } from "./UploadGithubOptions.js"
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
  ...uploadFormRowSx,
  alignSelf: "start",
} as const

const fieldPanelSx = {
  ...uploadFormRowSx,
  display: "grid",
  gap: 2,
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
        display: "grid",
        gap: 0,
      }}
      onSubmit={(event) => {
        event.preventDefault()
        void onTestUpload(buildValue())
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 0,
        }}
      >
        <FormControl id="upload-providerKey" sx={uploadFormRowSx}>
          <FormControl.Label>Provider</FormControl.Label>
          <PrimerSelectActionMenu
            id="upload-providerKey"
            value={providerKey}
            maxWidth="24rem"
            options={uploadProviders.providers.map((provider) => ({
              value: provider.key,
              label: provider.label,
            }))}
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
          />
          <FormControl.Caption>{activeProviderDefinition.description}</FormControl.Caption>
        </FormControl>

        <Box sx={{ display: "grid", gap: 0 }}>
          {providerKey === UPLOAD_PROVIDER_KEYS.ALIST ? (
            <Box sx={fieldPanelSx}>
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
            const rule = getUploadProviderFieldRule({
              providerKey,
              field,
              providerFields: activeProviderFields,
              providerUiState: activeProviderUiState,
            })

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
                    opacity: rule.disabled ? 0.7 : 1,
                    "&:hover": rule.disabled ? undefined : { bg: "neutral.subtle" },
                  }}
                >
                  <Checkbox
                    checked={activeProviderFields[field.key] === true}
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
                  <FormControl.Label>{field.label}</FormControl.Label>
                  <FormControl.Caption>
                    {rule.description}
                    {rule.disabledReason ? (
                      <Box as="span" sx={{ color: "attention.fg", display: "block", mt: 1 }}>
                        {rule.disabledReason}
                      </Box>
                    ) : field.placeholder ? (
                      <Box as="span" sx={{ color: "fg.muted", display: "block", mt: 1 }}>
                        {field.placeholder}
                      </Box>
                    ) : null}
                  </FormControl.Caption>
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
                  <PrimerSelectActionMenu
                    id={fieldInputId}
                    value={
                      !field.required && currentValue === "" ? EMPTY_SELECT_VALUE : currentValue
                    }
                    disabled={rule.disabled}
                    maxWidth="42rem"
                    options={[
                      ...(!field.required
                        ? [
                            {
                              value: EMPTY_SELECT_VALUE,
                              label: "선택 안 함",
                            },
                          ]
                        : []),
                      ...(field.options ?? []).map((option) => ({
                        value: String(option.value),
                        label: option.label,
                      })),
                    ]}
                    onValueChange={(nextValue) => {
                      const fieldValue = nextValue === EMPTY_SELECT_VALUE ? "" : nextValue
                      const nextProviderFields = {
                        ...activeProviderFields,
                        [field.key]: fieldValue,
                      }

                      updateProviderField(field.key, fieldValue)
                      onChange(buildValue({ nextProviderFields }))
                    }}
                  />
                  <FormControl.Caption>
                    {rule.description}
                    {rule.disabledReason ? (
                      <Box as="span" sx={{ color: "attention.fg", display: "block", mt: 1 }}>
                        {rule.disabledReason}
                      </Box>
                    ) : null}
                  </FormControl.Caption>
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
                <TextInput
                  block
                  sx={{ maxWidth: "42rem" }}
                  type={field.inputType}
                  value={String(activeProviderFields[field.key] ?? "")}
                  disabled={rule.disabled}
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
                <FormControl.Caption>
                  {rule.description}
                  {rule.disabledReason ? (
                    <Box as="span" sx={{ color: "attention.fg", display: "block", mt: 1 }}>
                      {rule.disabledReason}
                    </Box>
                  ) : null}
                </FormControl.Caption>
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

      {testUploadResult ? (
        <Box sx={uploadFormRowSx}>
          <Flash>{resultToText(testUploadResult)}</Flash>
        </Box>
      ) : null}
      {testUploadError ? (
        <Box sx={uploadFormRowSx}>
          <Flash variant="danger">{testUploadError}</Flash>
        </Box>
      ) : null}
      <Box sx={{ display: "flex", justifyContent: "flex-end", py: 2 }}>
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
