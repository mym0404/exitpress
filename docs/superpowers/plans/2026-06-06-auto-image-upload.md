# 자동 Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `download-and-upload` export가 provider 설정을 export 전에 받고, export job 안에서 이미지 다운로드, 전처리, 업로드, Markdown URL 치환까지 자동으로 끝나게 만든다.

**Architecture:** Web은 `assets-options` 뒤에 upload provider 설정 단계를 추가하고 export 요청에 provider payload를 포함한다. Server는 export 시작 전에 provider 설정을 정규화하고, export runner가 manifest 생성 직후 같은 job 안에서 upload phase와 rewrite phase를 이어 실행한다. 기존 수동 `/api/export/:jobId/upload` 시작 흐름은 새 정상 흐름에서 제거하고, 결과 화면은 자동 업로드 진행과 결과만 보여준다.

**Tech Stack:** TypeScript ESM, React, Vite, Vitest, Testing Library, Playwright/Bun e2e, Node.js HTTP server, PicGo runtime via `piclist`, pnpm through `mise exec -- pnpm`.

**VCS Rule:** 사용자가 명시적으로 요청하기 전에는 commit, push, PR을 만들지 않는다. 아래 단계의 commit 문구는 실행자가 사용자의 별도 승인을 받은 경우에만 쓴다.

---

## File Structure

- Modify `packages/domain/src/export-job/schema/ExportRequest.ts`
  - export 시작 요청에 optional `uploadProvider` payload를 추가한다.
- Modify `packages/web/src/features/job-results/UseExportJob.ts`
  - `startJob`이 upload provider payload를 `/api/export`에 함께 보낸다.
  - 수동 `startUpload`는 새 정상 흐름에서 제거한다.
- Modify `packages/web/src/features/job-results/UseExportJob.spec.tsx`
  - export 요청에 provider payload가 포함되는지, 수동 upload API 호출이 사라졌는지 검증한다.
- Create `packages/web/src/features/upload/UploadProviderSettingsForm.tsx`
  - provider 선택, provider field 입력, GitHub jsDelivr 옵션, test upload 버튼을 가진 재사용 form.
- Create `packages/web/src/features/upload/UseUploadProviderForm.ts`
  - 현재 `packages/web/src/features/job-results/UseUploadProviderForm.ts`의 provider state 로직을 setup step에서도 쓸 수 있는 위치로 옮긴다.
- Create `packages/web/src/features/upload/UploadProviderFormRules.ts`
  - 현재 `packages/web/src/features/job-results/UploadProviderFormRules.ts`의 validation과 field trim 규칙을 공유 위치로 옮긴다.
- Create `packages/web/src/features/upload/UploadGithubOptions.tsx`
  - 현재 `packages/web/src/features/job-results/UploadGithubOptions.tsx`를 공유 위치로 옮긴다.
- Delete `packages/web/src/features/job-results/UseUploadProviderForm.ts`
  - 새 공유 위치로 import가 모두 바뀐 뒤 삭제한다.
- Delete `packages/web/src/features/job-results/UploadProviderFormRules.ts`
  - 새 공유 위치로 import가 모두 바뀐 뒤 삭제한다.
- Delete `packages/web/src/features/job-results/UploadGithubOptions.tsx`
  - 새 공유 위치로 import가 모두 바뀐 뒤 삭제한다.
- Modify `packages/web/src/features/job-results/UploadPanel.tsx`
  - provider 설정 form과 upload 시작 버튼을 제거하고 자동 업로드 진행률과 결과만 표시한다.
- Create `packages/web/src/features/options/UploadProviderOptionsStep.tsx`
  - `download-and-upload` 전용 setup step UI.
- Modify `packages/web/src/features/common/shell/WizardFlow.tsx`
  - `upload-provider-options` step metadata와 step resolution을 추가한다.
- Modify `packages/web/src/features/common/hooks/UseWizardActions.ts`
  - next/previous step이 image handling mode에 따라 upload provider step을 건너뛰거나 방문한다.
- Modify `packages/web/src/features/common/hooks/schema/WizardActions.ts`
  - upload provider state와 validation state를 wizard action 인자로 받는다.
- Modify `packages/web/src/app/App.tsx`
  - upload provider form state를 보관하고 export 시작 시 `startJob`에 넘긴다.
- Modify `packages/web/src/app/AppStepView.tsx`
  - `upload-provider-options`에서 `UploadProviderOptionsStep`를 렌더링한다.
- Modify `packages/web/src/features/job-results/UseUploadProvidersCatalog.ts`
  - provider catalog를 export 전 setup step에서도 로드할 수 있게 `shouldLoad` 조건을 받는다.
- Modify `packages/server/src/routes/UploadRoutes.ts`
  - `GET /api/upload-providers`를 유지한다.
  - `POST /api/upload-providers/test`를 추가한다.
  - `POST /api/export/:jobId/upload` 수동 시작 라우트를 제거한다.
- Create `packages/server/src/upload/HttpUploadTestAsset.ts`
  - repo-local `tmp/` 아래 임시 1x1 PNG를 만들고 요청 뒤 삭제한다.
- Modify `packages/server/src/upload/HttpUploadConfig.ts`
  - export 요청과 test upload 요청에서 같은 provider config normalization을 사용한다.
- Modify `packages/server/src/routes/ExportRoutes.ts`
  - `download-and-upload` 요청의 provider payload를 검증하고 정규화한 뒤 export request에 싣는다.
- Modify `packages/server/src/jobs/HttpExportJobRunner.ts`
  - export manifest 생성 뒤 같은 tracked job 안에서 upload phase와 rewrite phase를 실행한다.
- Modify `packages/server/src/jobs/JobStore.ts`
  - export phase 완료 뒤 upload phase로 바로 이어갈 수 있는 상태 업데이트 메서드를 추가한다.
- Modify `packages/server/src/jobs/ExportJobManifest.ts`
  - provider secret 없이 자동 upload 진행과 완료 상태를 manifest snapshot에 반영한다.
- Modify `packages/server/src/http/HttpServer.ts`
  - 수동 upload runner 생성과 route context 주입을 제거한다.
- Modify `packages/server/src/routes/ApiRouteContext.ts`
  - `uploadJobRunner` context field를 제거한다.
- Delete `packages/server/src/upload/HttpUploadJobRunner.ts`
  - 수동 upload route 전용 runner를 제거하고, 자동 upload orchestration은 `HttpExportJobRunner` 안에서 수행한다.
- Keep `packages/engine/src/exporting/upload/ImageUploadPhase.ts`
  - runtime upload 실행 경계로 유지한다.
- Keep `packages/engine/src/exporting/upload/ImageUploadRewriter.ts`
  - export runner 내부 rewrite 단계에서 `rewriteUploadedAssets`를 재사용한다.
- Modify `packages/engine/src/exporting/workflow/NaverBlogExporter.spec.ts`
  - `download-and-upload` manifest 후보 생성 기대값을 자동 upload runner 테스트와 충돌하지 않게 정리한다.
- Modify `packages/server/src/upload/HttpServer.upload-start.spec.ts`
  - 수동 upload 시작 테스트를 export request provider validation 테스트로 바꾼다.
- Modify `packages/server/src/upload/HttpServer.upload-progress.spec.ts`
  - upload progress가 export job 내부에서 관측되는지 검증한다.
- Modify `packages/server/src/upload/HttpServer.upload-rewrite.spec.ts`
  - 별도 upload POST 없이 export가 최종 URL 치환까지 끝나는지 검증한다.
- Modify `packages/server/src/upload/HttpServer.upload-security.spec.ts`
  - provider secret이 job state, manifest, log에 저장되지 않는지 새 요청 계약 기준으로 검증한다.
- Modify `tests/e2e/scenarios/ui-smoke.ts`
  - mock UI 흐름을 provider step, test upload, automatic upload completion 기준으로 바꾼다.
- Modify `tests/e2e/scenarios/ui-live-upload.ts`
  - live upload e2e를 `upload-ready` 대기와 수동 upload POST 대신 자동 upload 완료와 URL 치환 검증으로 바꾼다.
- Modify `tests/e2e/run-ui-live-upload.ts`
  - scenario 변경에 맞춰 runner 출력과 실패 메시지를 갱신한다.
- Modify `.agents/knowledge/upload.md`
  - 새 upload flow와 책임 경계를 반영한다.
- Modify `.agents/knowledge/verification.md`
  - `test:network:upload`가 자동 upload flow를 검증한다는 내용을 반영한다.

## Task 1: Export Request 계약과 Web Job API

**Files:**
- Modify: `packages/domain/src/export-job/schema/ExportRequest.ts`
- Modify: `packages/web/src/features/job-results/UseExportJob.ts`
- Modify: `packages/web/src/features/job-results/UseExportJob.spec.tsx`

- [ ] **Step 1: failing hook test 작성**

`packages/web/src/features/job-results/UseExportJob.spec.tsx`의 start job 테스트 근처에 다음 테스트를 추가한다.

```tsx
it("submits upload provider payload with download-and-upload exports", async () => {
  const uploadFlowOptions = defaultExportOptions()
  uploadFlowOptions.assets.imageHandlingMode = "download-and-upload"

  mockedPostJson.mockResolvedValue({ jobId: "job-upload-auto" })
  mockedFetchJson.mockResolvedValue({
    id: "job-upload-auto",
    status: "queued",
    request: {
      blogIdOrUrl: "blog",
      outputDir: "/tmp/out",
      profile: "gfm",
      options: uploadFlowOptions,
    },
    progress: { total: 0, completed: 0, failed: 0 },
    upload: {
      status: "not-requested",
      eligiblePostCount: 0,
      candidateCount: 0,
      uploadedCount: 0,
      failedCount: 0,
      terminalReason: null,
    },
    items: [],
    logs: [],
    resumeAvailable: false,
    startedAt: null,
    finishedAt: null,
    error: null,
  })

  const { result } = renderHook(() => useExportJob())

  await act(async () => {
    await result.current.startJob({
      blogIdOrUrl: "blog",
      outputDir: "/tmp/out",
      options: uploadFlowOptions,
      scanResult: null,
      uploadProvider: {
        providerKey: "github",
        providerFields: {
          repo: "owner/repo",
          branch: "main",
          token: "secret-token",
        },
      },
    })
  })

  expect(mockedPostJson).toHaveBeenCalledWith("/api/export", {
    blogIdOrUrl: "blog",
    outputDir: "/tmp/out",
    options: uploadFlowOptions,
    scanResult: null,
    uploadProvider: {
      providerKey: "github",
      providerFields: {
        repo: "owner/repo",
        branch: "main",
        token: "secret-token",
      },
    },
  })
})
```

- [ ] **Step 2: focused test가 실패하는지 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/web/src/features/job-results/UseExportJob.spec.tsx
```

Expected:

```text
FAIL packages/web/src/features/job-results/UseExportJob.spec.tsx
```

실패 이유는 `startJob` 인자 타입이나 `postJson` payload에 `uploadProvider`가 없다는 내용이어야 한다.

- [ ] **Step 3: ExportRequest 타입 확장**

`packages/domain/src/export-job/schema/ExportRequest.ts`를 다음 형태로 수정한다.

```ts
import type { UploadProviderFields } from "../../upload/schema/UploadProvider.js"
import type { ExportOptions } from "../../export-options/schema/ExportOptions.js"

export const allExportProfiles = ["gfm"] as const
// Markdown output profile selected by export requests.
export type ExportProfile = (typeof allExportProfiles)[number]

export type ExportUploadProviderRequest = {
  providerKey: string
  providerFields: UploadProviderFields
}

// Request body used to start an export job.
export type ExportRequest = {
  blogIdOrUrl: string
  outputDir: string
  profile: ExportProfile
  options: ExportOptions
  uploadProvider?: ExportUploadProviderRequest
}
```

- [ ] **Step 4: UseExportJob startJob payload 확장**

`packages/web/src/features/job-results/UseExportJob.ts`에서 type과 `startJob` 인자를 확장한다.

```ts
type UploadProviderInput = {
  providerKey: string
  providerFields: UploadProviderFields
}
```

`startJob` 시그니처에 `uploadProvider`를 추가한다.

```ts
uploadProvider,
}: {
  blogIdOrUrl: string
  outputDir: string
  options: ExportOptions
  scanResult?: ScanResult | null
  uploadProvider?: UploadProviderInput
}) => {
```

`postJson` payload에 `uploadProvider`를 포함한다.

```ts
const response = await postJson<{ jobId: string }>("/api/export", {
  blogIdOrUrl,
  outputDir,
  options,
  scanResult,
  uploadProvider,
})
```

- [ ] **Step 5: focused test 통과 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/web/src/features/job-results/UseExportJob.spec.tsx
```

Expected:

```text
PASS packages/web/src/features/job-results/UseExportJob.spec.tsx
```

## Task 2: Provider Form 공유 컴포넌트와 Test Upload UI

**Files:**
- Create: `packages/web/src/features/upload/UploadProviderSettingsForm.tsx`
- Create or move: `packages/web/src/features/upload/UseUploadProviderForm.ts`
- Create or move: `packages/web/src/features/upload/UploadProviderFormRules.ts`
- Create or move: `packages/web/src/features/upload/UploadGithubOptions.tsx`
- Modify: `packages/web/src/features/job-results/UploadPanel.tsx`

- [ ] **Step 1: 공유 form 컴포넌트의 failing component test 작성**

새 파일 `packages/web/src/features/upload/UploadProviderSettingsForm.spec.tsx`를 만든다.

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { UploadProviderCatalogResponse } from "@exitpress/domain/upload/schema/UploadProvider.js"

import { UploadProviderSettingsForm } from "./UploadProviderSettingsForm.js"

const catalog: UploadProviderCatalogResponse = {
  defaultProviderKey: "github",
  providers: [
    {
      key: "github",
      label: "GitHub",
      description: "GitHub uploader",
      fields: [
        {
          key: "repo",
          label: "Repo",
          description: "owner/repo",
          inputType: "text",
          required: true,
          defaultValue: "",
        },
      ],
    },
  ],
}

describe("UploadProviderSettingsForm", () => {
  it("disables submit until required provider fields are filled and can test upload", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onTestUpload = vi.fn(async () => "https://cdn.example.com/test.png")

    render(
      <UploadProviderSettingsForm
        uploadProviders={catalog}
        uploadProviderError={null}
        value={{
          providerKey: "github",
          providerFields: { repo: "" },
        }}
        testUploadSubmitting={false}
        testUploadResult={null}
        testUploadError={null}
        onChange={onChange}
        onTestUpload={onTestUpload}
      />,
    )

    expect(screen.getByRole("button", { name: "테스트 업로드" })).toBeDisabled()

    await user.type(screen.getByLabelText("Repo"), "owner/repo")

    expect(onChange).toHaveBeenLastCalledWith({
      providerKey: "github",
      providerFields: { repo: "owner/repo" },
    })
  })
})
```

- [ ] **Step 2: focused test 실패 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/web/src/features/upload/UploadProviderSettingsForm.spec.tsx
```

Expected:

```text
FAIL packages/web/src/features/upload/UploadProviderSettingsForm.spec.tsx
```

실패 이유는 `UploadProviderSettingsForm` 파일이나 export가 없다는 내용이어야 한다.

- [ ] **Step 3: upload form helper를 공유 위치로 이동**

기존 파일 내용을 새 위치로 옮긴다.

```text
packages/web/src/features/job-results/UseUploadProviderForm.ts
  -> packages/web/src/features/upload/UseUploadProviderForm.ts
packages/web/src/features/job-results/UploadProviderFormRules.ts
  -> packages/web/src/features/upload/UploadProviderFormRules.ts
packages/web/src/features/job-results/UploadGithubOptions.tsx
  -> packages/web/src/features/upload/UploadGithubOptions.tsx
```

새 `UseUploadProviderForm`은 `jobId` 대신 `resetKey`를 받는다.

```ts
export const useUploadProviderForm = ({
  resetKey,
  uploadProviders,
}: {
  resetKey: string | undefined
  uploadProviders: UploadProviderCatalogResponse
}) => {
  // existing state logic
}
```

effect dependency도 `jobId`에서 `resetKey`로 바꾼다.

```ts
useEffect(() => {
  if (!resetKey) {
    return
  }

  setProviderKey(getPreferredDefaultProviderKey(uploadProviders))
  setProviderFieldMap(buildInitialProviderFieldMap(uploadProviders))
  setProviderUiStateMap(buildInitialProviderUiStateMap(uploadProviders))
}, [resetKey, uploadProviders])
```

- [ ] **Step 4: UploadProviderSettingsForm 구현**

`packages/web/src/features/upload/UploadProviderSettingsForm.tsx`를 만든다.

```tsx
import { UPLOAD_PROVIDER_KEYS } from "@exitpress/domain/upload/UploadProviderKeys.js"

import type {
  UploadProviderCatalogResponse,
  UploadProviderFields,
} from "@exitpress/domain/upload/schema/UploadProvider.js"

import { Button } from "../../components/ui/Button.js"
import { Input } from "../../components/ui/Input.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select.js"

import { UploadGithubOptions } from "./UploadGithubOptions.js"
import {
  getUploadProviderFieldRule,
  hasMissingRequiredUploadProviderField,
  trimProviderFieldsForSubmit,
} from "./UploadProviderFormRules.js"
import { useUploadProviderForm } from "./UseUploadProviderForm.js"

export type UploadProviderSettingsValue = {
  providerKey: string
  providerFields: UploadProviderFields
}

export const UploadProviderSettingsForm = ({
  uploadProviders,
  uploadProviderError,
  value,
  testUploadSubmitting,
  testUploadResult,
  testUploadError,
  onChange,
  onTestUpload,
}: {
  uploadProviders: UploadProviderCatalogResponse
  uploadProviderError: string | null
  value: UploadProviderSettingsValue | null
  testUploadSubmitting: boolean
  testUploadResult: string | null
  testUploadError: string | null
  onChange: (value: UploadProviderSettingsValue) => void
  onTestUpload: (value: UploadProviderSettingsValue) => Promise<void> | void
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
    resetKey: value?.providerKey,
    uploadProviders,
  })

  if (uploadProviderError) {
    return <p className="danger-copy text-sm leading-7">{uploadProviderError}</p>
  }

  if (uploadProviders.providers.length === 0 || !activeProviderDefinition) {
    return <p className="text-sm leading-7 text-muted-foreground">업로드 설정을 불러오지 못했습니다.</p>
  }

  const normalizedProviderFields = trimProviderFieldsForSubmit({
    provider: activeProviderDefinition,
    providerFields: activeProviderFields,
    providerUiState: activeProviderUiState,
  })
  const nextValue = {
    providerKey,
    providerFields: {
      ...normalizedProviderFields,
      ...(providerKey === UPLOAD_PROVIDER_KEYS.GITHUB && githubUseJsDelivr
        ? { customUrl: githubJsDelivrUrl }
        : {}),
    },
  }
  const submitDisabled = hasMissingRequiredUploadProviderField({
    provider: activeProviderDefinition,
    providerFields: activeProviderFields,
    providerUiState: activeProviderUiState,
  })

  return (
    <div className="field-card grid gap-4 rounded-[1.5rem] p-4">
      <div className="grid gap-2">
        <label htmlFor="upload-providerKey" className="text-sm font-semibold text-foreground">
          Provider
        </label>
        <Select
          value={providerKey}
          onValueChange={(nextProviderKey) => {
            selectProvider(nextProviderKey)
          }}
        >
          <SelectTrigger id="upload-providerKey" data-value={providerKey}>
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
      </div>

      <div className="grid items-start gap-3 sm:grid-cols-2">
        {activeProviderDefinition.fields.map((field) => {
          const fieldInputId = `upload-providerField-${field.key}`
          const rule = getUploadProviderFieldRule({
            providerKey,
            field,
            providerFields: activeProviderFields,
            providerUiState: activeProviderUiState,
          })

          return (
            <div key={`${providerKey}:${field.key}`} className="grid content-start gap-2 self-start">
              <label htmlFor={fieldInputId} className="text-sm font-semibold text-foreground">
                {field.label}
              </label>
              <span className="text-sm leading-6 text-muted-foreground">{rule.description}</span>
              <Input
                id={fieldInputId}
                type={field.inputType}
                value={String(activeProviderFields[field.key] ?? "")}
                disabled={rule.disabled}
                onChange={(event) => {
                  updateProviderField(field.key, event.target.value)
                  onChange(nextValue)
                }}
                placeholder={field.placeholder}
              />
            </div>
          )
        })}
      </div>

      <UploadGithubOptions
        providerKey={providerKey}
        githubUseJsDelivr={githubUseJsDelivr}
        githubJsDelivrUrl={githubJsDelivrUrl}
        updateProviderUiState={updateProviderUiState}
      />

      {testUploadResult ? (
        <p className="text-sm leading-7 text-muted-foreground">{testUploadResult}</p>
      ) : null}
      {testUploadError ? <p className="danger-copy text-sm leading-7">{testUploadError}</p> : null}

      <div className="flex justify-end">
        <Button
          id="upload-test-submit"
          type="button"
          disabled={submitDisabled || testUploadSubmitting}
          onClick={() => {
            onChange(nextValue)
            void onTestUpload(nextValue)
          }}
        >
          {testUploadSubmitting ? "테스트 중..." : "테스트 업로드"}
        </Button>
      </div>
    </div>
  )
}
```

`updateProviderField` 호출 뒤 부모에게 알릴 값은 입력 이벤트의 새 값을 포함해 계산한다. 구현은 다음 형태로 `nextProviderFields`를 만든 뒤 `onChange`에 넘긴다.

```tsx
const nextProviderFields = {
  ...activeProviderFields,
  [field.key]: event.target.value,
}

updateProviderField(field.key, event.target.value)
onChange({
  providerKey,
  providerFields: trimProviderFieldsForSubmit({
    provider: activeProviderDefinition,
    providerFields: nextProviderFields,
    providerUiState: activeProviderUiState,
  }),
})
```

- [ ] **Step 5: UploadPanel에서 form 제거**

`packages/web/src/features/job-results/UploadPanel.tsx`에서 provider form 렌더링과 `onUploadStart` prop 사용을 제거한다. 남기는 UI는 진행률, 대상 글, 대상 자산, 완료 수, 실패 수, 실패 메시지다.

```tsx
export const UploadPanel = ({
  mode,
  job,
}: {
  mode: JobResultsMode
  job: ExportJobState | null
}) => {
  const uploadProgressValue = toProgressValue(
    job?.upload.uploadedCount ?? 0,
    job?.upload.candidateCount ?? 0,
  )

  return (
    <section className="upload-panel subtle-panel grid gap-4 rounded-[1.5rem] p-4">
      <CompactMetrics
        items={[
          { label: "대상 글", value: String(job?.upload.eligiblePostCount ?? 0) },
          { label: "대상 자산", value: String(job?.upload.candidateCount ?? 0) },
          { label: "업로드 완료", value: String(job?.upload.uploadedCount ?? 0) },
          { label: "실패", value: String(job?.upload.failedCount ?? 0) },
        ]}
        className="field-card rounded-2xl px-4 py-3 lg:max-w-[32rem] lg:justify-end"
      />
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
      {job?.status === JOB_STATUSES.UPLOAD_FAILED && job.error ? (
        <p className="danger-copy text-sm leading-7">{job.error}</p>
      ) : null}
    </section>
  )
}
```

- [ ] **Step 6: focused form test 통과 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/web/src/features/upload/UploadProviderSettingsForm.spec.tsx
```

Expected:

```text
PASS packages/web/src/features/upload/UploadProviderSettingsForm.spec.tsx
```

## Task 3: Wizard Step, App State, Export Payload 연결

**Files:**
- Create: `packages/web/src/features/options/UploadProviderOptionsStep.tsx`
- Modify: `packages/web/src/features/common/shell/WizardFlow.tsx`
- Modify: `packages/web/src/features/common/hooks/UseWizardActions.ts`
- Modify: `packages/web/src/features/common/hooks/schema/WizardActions.ts`
- Modify: `packages/web/src/app/App.tsx`
- Modify: `packages/web/src/app/AppStepView.tsx`

- [ ] **Step 1: wizard step helper test 작성**

`packages/web/src/features/common/shell/WizardFlow.spec.ts`를 만들거나 기존 shell test가 있으면 거기에 추가한다.

```ts
import { describe, expect, it } from "vitest"

import { getNextSetupStep, getPreviousSetupStep } from "./WizardFlow.js"

describe("upload provider setup step navigation", () => {
  it("visits upload provider options after assets when download-and-upload is selected", () => {
    expect(
      getNextSetupStep({
        setupStep: "assets-options",
        imageHandlingMode: "download-and-upload",
      }),
    ).toBe("upload-provider-options")
  })

  it("skips upload provider options when image handling does not upload", () => {
    expect(
      getNextSetupStep({
        setupStep: "assets-options",
        imageHandlingMode: "download",
      }),
    ).toBe("links-options")
    expect(
      getNextSetupStep({
        setupStep: "assets-options",
        imageHandlingMode: "remote",
      }),
    ).toBe("links-options")
  })

  it("goes back from links to upload provider options only for download-and-upload", () => {
    expect(
      getPreviousSetupStep({
        setupStep: "links-options",
        imageHandlingMode: "download-and-upload",
      }),
    ).toBe("upload-provider-options")
    expect(
      getPreviousSetupStep({
        setupStep: "links-options",
        imageHandlingMode: "download",
      }),
    ).toBe("assets-options")
  })
})
```

- [ ] **Step 2: focused test 실패 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/web/src/features/common/shell/WizardFlow.spec.ts
```

Expected:

```text
FAIL packages/web/src/features/common/shell/WizardFlow.spec.ts
```

실패 이유는 helper export가 없다는 내용이어야 한다.

- [ ] **Step 3: WizardFlow에 step과 helper 추가**

`packages/web/src/features/common/shell/WizardFlow.tsx`에서 `setupSteps`에 `"upload-provider-options"`를 추가한다.

```ts
export const setupSteps = [
  "blog-input",
  "category-selection",
  "structure-options",
  "frontmatter-options",
  "assets-options",
  "upload-provider-options",
  "links-options",
  "diagnostics-options",
] as const
```

step metadata도 추가한다.

```ts
"upload-provider-options": {
  title: "Image Upload",
  description: "업로드 provider와 metadata를 정합니다.",
},
```

helper를 추가한다.

```ts
export const getNextSetupStep = ({
  setupStep,
  imageHandlingMode,
}: {
  setupStep: SetupStep
  imageHandlingMode: ExportOptions["assets"]["imageHandlingMode"]
}) => {
  if (setupStep === "assets-options" && imageHandlingMode !== "download-and-upload") {
    return "links-options" satisfies SetupStep
  }

  const nextIndex = setupSteps.indexOf(setupStep) + 1
  return setupSteps[nextIndex] ?? setupStep
}

export const getPreviousSetupStep = ({
  setupStep,
  imageHandlingMode,
}: {
  setupStep: SetupStep
  imageHandlingMode: ExportOptions["assets"]["imageHandlingMode"]
}) => {
  if (setupStep === "links-options" && imageHandlingMode !== "download-and-upload") {
    return "assets-options" satisfies SetupStep
  }

  const previousIndex = setupSteps.indexOf(setupStep) - 1
  return setupSteps[previousIndex] ?? setupStep
}
```

- [ ] **Step 4: UseWizardActions가 helper를 사용하게 변경**

`packages/web/src/features/common/hooks/UseWizardActions.ts`에서 직접 index 계산을 helper 호출로 바꾼다.

```ts
import { getNextSetupStep, getPreviousSetupStep } from "../shell/WizardFlow.js"
```

previous:

```ts
setSetupStep(
  getPreviousSetupStep({
    setupStep,
    imageHandlingMode: args.options.assets.imageHandlingMode,
  }),
)
```

next generic branch:

```ts
setSetupStep(
  getNextSetupStep({
    setupStep,
    imageHandlingMode: args.options.assets.imageHandlingMode,
  }),
)
```

`upload-provider-options`에서 필수 provider 값이 없으면 다음 단계로 가지 않게 한다.

```ts
if (setupStep === "upload-provider-options" && !args.uploadProviderReady) {
  args.setCategoryStatus("Image Upload 설정을 먼저 입력해야 합니다.")
  return
}
```

- [ ] **Step 5: UploadProviderOptionsStep 생성**

`packages/web/src/features/options/UploadProviderOptionsStep.tsx`를 만든다.

```tsx
import type { UploadProviderCatalogResponse } from "@exitpress/domain/upload/schema/UploadProvider.js"
import type { UploadProviderSettingsValue } from "../upload/UploadProviderSettingsForm.js"

import { Card, CardContent } from "../../components/ui/Card.js"
import { UploadProviderSettingsForm } from "../upload/UploadProviderSettingsForm.js"

export const UploadProviderOptionsStep = ({
  uploadProviders,
  uploadProviderError,
  value,
  testUploadSubmitting,
  testUploadResult,
  testUploadError,
  onChange,
  onTestUpload,
}: {
  uploadProviders: UploadProviderCatalogResponse
  uploadProviderError: string | null
  value: UploadProviderSettingsValue | null
  testUploadSubmitting: boolean
  testUploadResult: string | null
  testUploadError: string | null
  onChange: (value: UploadProviderSettingsValue) => void
  onTestUpload: (value: UploadProviderSettingsValue) => Promise<void> | void
}) => (
  <Card variant="panel" className="board-card overflow-hidden" id="upload-provider-panel">
    <CardContent className="panel-body grid gap-4 p-5">
      <UploadProviderSettingsForm
        uploadProviders={uploadProviders}
        uploadProviderError={uploadProviderError}
        value={value}
        testUploadSubmitting={testUploadSubmitting}
        testUploadResult={testUploadResult}
        testUploadError={testUploadError}
        onChange={onChange}
        onTestUpload={onTestUpload}
      />
    </CardContent>
  </Card>
)
```

- [ ] **Step 6: App에서 provider state를 export payload로 연결**

`packages/web/src/app/App.tsx`에 state를 추가한다.

```ts
const [uploadProviderSettings, setUploadProviderSettings] =
  useState<UploadProviderSettingsValue | null>(null)
const [testUploadSubmitting, setTestUploadSubmitting] = useState(false)
const [testUploadResult, setTestUploadResult] = useState<string | null>(null)
const [testUploadError, setTestUploadError] = useState<string | null>(null)
```

provider catalog load 조건을 바꾼다.

```ts
const shouldLoadUploadProviders =
  options.assets.imageHandlingMode === "download-and-upload" ||
  isUploadActionableJob(job)
```

export 시작 payload에 provider를 넣는다.

```ts
const uploadProvider =
  options.assets.imageHandlingMode === "download-and-upload"
    ? uploadProviderSettings ?? undefined
    : undefined

const jobId = await startJob({
  blogIdOrUrl: currentScanTarget,
  outputDir: normalizeOutputDir(outputDir),
  options,
  scanResult,
  uploadProvider,
})
```

test upload handler를 추가한다.

```ts
const handleTestUpload = useCallback(async (value: UploadProviderSettingsValue) => {
  setTestUploadSubmitting(true)
  setTestUploadResult(null)
  setTestUploadError(null)

  try {
    const response = await postJson<{ uploadedUrl: string }>("/api/upload-providers/test", value)
    setTestUploadResult(response.uploadedUrl)
  } catch (error) {
    setTestUploadError(error instanceof Error ? error.message : String(error))
  } finally {
    setTestUploadSubmitting(false)
  }
}, [])
```

- [ ] **Step 7: AppStepView에서 새 step 렌더링**

`packages/web/src/app/AppStepView.tsx`에 `UploadProviderOptionsStep`를 연결한다.

```tsx
if (currentStep === "upload-provider-options") {
  return (
    <UploadProviderOptionsStep
      uploadProviders={uploadProviders}
      uploadProviderError={uploadProviderError}
      value={uploadProviderSettings}
      testUploadSubmitting={testUploadSubmitting}
      testUploadResult={testUploadResult}
      testUploadError={testUploadError}
      onChange={setUploadProviderSettings}
      onTestUpload={handleTestUpload}
    />
  )
}
```

- [ ] **Step 8: focused wizard test 통과 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/web/src/features/common/shell/WizardFlow.spec.ts
```

Expected:

```text
PASS packages/web/src/features/common/shell/WizardFlow.spec.ts
```

## Task 4: Test Upload API

**Files:**
- Create: `packages/server/src/upload/HttpUploadTestAsset.ts`
- Modify: `packages/server/src/routes/UploadRoutes.ts`
- Test: `packages/server/src/upload/HttpServer.upload-start.spec.ts`

- [ ] **Step 1: failing server test 작성**

`packages/server/src/upload/HttpServer.upload-start.spec.ts`에 test upload API 테스트를 추가한다.

```ts
it("tests upload provider settings with a generated image without creating an export job", async () => {
  const { baseUrl, close, uploadPhaseRunner } = await createHttpServerSpecHarness()

  try {
    uploadPhaseRunner.mockResolvedValue([
      {
        candidate: {
          kind: "image",
          sourceUrl: "exitpress://test-upload.png",
          localPath: "tmp/image-upload-test.png",
          markdownReference: "tmp/image-upload-test.png",
        },
        uploadedUrl: "https://cdn.example.com/test-upload.png",
      },
    ])

    const response = await fetch(`${baseUrl}/api/upload-providers/test`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
      },
      body: JSON.stringify({
        providerKey: "github",
        providerFields: {
          repo: "owner/repo",
          branch: "main",
          token: "secret-token",
        },
      }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      uploadedUrl: "https://cdn.example.com/test-upload.png",
    })
    expect(uploadPhaseRunner).toHaveBeenCalledTimes(1)
  } finally {
    await close()
  }
})
```

- [ ] **Step 2: focused test 실패 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/server/src/upload/HttpServer.upload-start.spec.ts
```

Expected:

```text
FAIL packages/server/src/upload/HttpServer.upload-start.spec.ts
```

실패 이유는 `/api/upload-providers/test`가 404 또는 false route인 상태여야 한다.

- [ ] **Step 3: 임시 PNG helper 생성**

`packages/server/src/upload/HttpUploadTestAsset.ts`를 만든다.

```ts
import { rm, writeFile } from "node:fs/promises"
import path from "node:path"

import { ensureDir, getProjectTempPath } from "@exitpress/engine/infra/node/util/FilePaths.js"

const testUploadPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lV6wWQAAAABJRU5ErkJggg==",
  "base64",
)

export const createHttpUploadTestAsset = async () => {
  const assetPath = getProjectTempPath("image-upload", `test-upload-${Date.now()}.png`)

  await ensureDir(path.dirname(assetPath))
  await writeFile(assetPath, testUploadPng)

  return {
    assetPath,
    localPath: path.relative(process.cwd(), assetPath).split(path.sep).join("/"),
    cleanup: async () => {
      await rm(assetPath, { force: true })
    },
  }
}
```

- [ ] **Step 4: UploadRoutes에 test route 추가**

`packages/server/src/routes/UploadRoutes.ts`에서 `GET /api/upload-providers` 아래에 추가한다.

```ts
if (method === "POST" && url.pathname === "/api/upload-providers/test") {
  if (rejectNonJson(request, response) || rejectNonSameOrigin(request, response)) {
    return true
  }

  const payload = await parseJsonBody<{
    providerKey?: string
    providerFields?: unknown
  }>(request)
  const providerKey = payload.providerKey?.trim()
  const providerFields = providerKey
    ? await uploadProviderSource.normalizeProviderFields(providerKey, payload.providerFields)
    : null

  if (!providerKey || !providerFields) {
    sendJson({
      response,
      statusCode: 400,
      body: { error: "providerKey와 providerFields는 필수입니다." },
    })
    return true
  }

  const testAsset = await createHttpUploadTestAsset()

  try {
    const results = await runImageUploadPhase({
      outputDir: process.cwd(),
      candidates: [
        {
          kind: "image",
          sourceUrl: "exitpress://test-upload.png",
          localPath: testAsset.localPath,
          markdownReference: testAsset.localPath,
        },
      ],
      uploaderKey: providerKey,
      uploaderConfig: normalizeUploaderConfig({ uploaderKey: providerKey, providerFields }),
    })

    sendJson({
      response,
      statusCode: 200,
      body: { uploadedUrl: results[0]?.uploadedUrl ?? "" },
    })
  } catch (error) {
    sendJson({
      response,
      statusCode: 400,
      body: { error: sanitizeUploadError({ error, providerFields }) },
    })
  } finally {
    await testAsset.cleanup()
  }

  return true
}
```

필요 imports:

```ts
import { runImageUploadPhase } from "@exitpress/engine/exporting/upload/ImageUploadPhase.js"
import { createHttpUploadTestAsset } from "../upload/HttpUploadTestAsset.js"
import { normalizeUploaderConfig, sanitizeUploadError } from "../upload/HttpUploadConfig.js"
```

- [ ] **Step 5: focused test 통과 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/server/src/upload/HttpServer.upload-start.spec.ts
```

Expected:

```text
PASS packages/server/src/upload/HttpServer.upload-start.spec.ts
```

## Task 5: Export Route Provider Validation

**Files:**
- Modify: `packages/server/src/routes/ExportRoutes.ts`
- Modify: `packages/server/src/jobs/HttpExportJobRunner.ts`
- Modify: `packages/server/src/routes/ApiRouteContext.ts`
- Test: `packages/server/src/upload/HttpServer.upload-start.spec.ts`
- Test: `packages/server/src/upload/HttpServer.upload-security.spec.ts`

- [ ] **Step 1: provider 누락 실패 테스트 작성**

`packages/server/src/upload/HttpServer.upload-start.spec.ts`에 추가한다.

```ts
it("rejects download-and-upload export requests without provider settings", async () => {
  const { baseUrl, close } = await createHttpServerSpecHarness()

  try {
    const options = defaultExportOptions()
    options.assets.imageHandlingMode = "download-and-upload"

    const response = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        blogIdOrUrl: "https://blog.naver.com/test",
        outputDir: createTestPath("http-server", "auto-upload-missing-provider"),
        options,
        scanResult: createScanResultFixture(),
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: "Image Upload provider 설정이 필요합니다.",
    })
  } finally {
    await close()
  }
})
```

- [ ] **Step 2: provider secret 비저장 테스트 작성**

`packages/server/src/upload/HttpServer.upload-security.spec.ts`에 export request 기준 테스트를 추가한다.

```ts
it("does not persist upload provider fields from export requests", async () => {
  const { baseUrl, close } = await createHttpServerSpecHarness()

  try {
    const options = defaultExportOptions()
    options.assets.imageHandlingMode = "download-and-upload"

    const response = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        blogIdOrUrl: "https://blog.naver.com/test",
        outputDir: createTestPath("http-server", "auto-upload-secret"),
        options,
        scanResult: createScanResultFixture(),
        uploadProvider: {
          providerKey: "github",
          providerFields: {
            repo: "owner/repo",
            branch: "main",
            token: "secret-token",
          },
        },
      }),
    })

    expect(response.status).toBe(202)
    const body = (await response.json()) as { jobId: string }
    const jobResponse = await fetch(`${baseUrl}/api/export/${body.jobId}`)
    const serializedJob = JSON.stringify(await jobResponse.json())

    expect(serializedJob).not.toContain("secret-token")
  } finally {
    await close()
  }
})
```

- [ ] **Step 3: focused tests 실패 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/server/src/upload/HttpServer.upload-start.spec.ts packages/server/src/upload/HttpServer.upload-security.spec.ts
```

Expected:

```text
FAIL packages/server/src/upload/HttpServer.upload-start.spec.ts
FAIL packages/server/src/upload/HttpServer.upload-security.spec.ts
```

- [ ] **Step 4: ExportRoutes에서 uploadProvider 검증**

`packages/server/src/routes/ExportRoutes.ts`의 `/api/export` payload type에 `uploadProvider`를 추가한다.

```ts
uploadProvider?: {
  providerKey?: string
  providerFields?: unknown
}
```

options clone 뒤에 validation을 추가한다.

```ts
const uploadProviderKey = payload.uploadProvider?.providerKey?.trim()
const uploadProviderFields =
  uploadProviderKey && payload.uploadProvider
    ? await uploadProviderSource.normalizeProviderFields(
        uploadProviderKey,
        payload.uploadProvider.providerFields,
      )
    : null

if (options.assets.imageHandlingMode === "download-and-upload") {
  if (!uploadProviderKey || !uploadProviderFields) {
    sendJson({
      response,
      statusCode: 400,
      body: { error: "Image Upload provider 설정이 필요합니다." },
    })
    return true
  }
} else if (payload.uploadProvider) {
  sendJson({
    response,
    statusCode: 400,
    body: { error: "Image Upload provider 설정은 download-and-upload에서만 사용할 수 있습니다." },
  })
  return true
}
```

job request에 sanitized payload만 넣는다.

```ts
uploadProvider:
  options.assets.imageHandlingMode === "download-and-upload" && uploadProviderKey && uploadProviderFields
    ? {
        providerKey: uploadProviderKey,
        providerFields: uploadProviderFields,
      }
    : undefined,
```

- [ ] **Step 5: ApiRouteContext와 handler 인자 연결**

`packages/server/src/routes/ApiRouteContext.ts`에 이미 `uploadProviderSource`가 있으면 `ExportRoutes` handler가 받도록 destructuring을 확장한다.

```ts
export const handleExportRoutes =
  ({ state, blockScanJobRunner, exportJobRunner, uploadProviderSource }: ApiRouteContext) =>
```

- [ ] **Step 6: focused tests 통과 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/server/src/upload/HttpServer.upload-start.spec.ts packages/server/src/upload/HttpServer.upload-security.spec.ts
```

Expected:

```text
PASS packages/server/src/upload/HttpServer.upload-start.spec.ts
PASS packages/server/src/upload/HttpServer.upload-security.spec.ts
```

## Task 6: Export Job 내부 자동 Upload와 Rewrite

**Files:**
- Modify: `packages/server/src/jobs/HttpExportJobRunner.ts`
- Modify: `packages/server/src/jobs/JobStore.ts`
- Modify: `packages/server/src/upload/HttpUploadProgress.ts`
- Modify: `packages/server/src/upload/HttpUploadRewrite.ts`
- Test: `packages/server/src/upload/HttpServer.upload-progress.spec.ts`
- Test: `packages/server/src/upload/HttpServer.upload-rewrite.spec.ts`
- Test: `packages/engine/src/exporting/workflow/NaverBlogExporter.spec.ts`

- [ ] **Step 1: export 한 번으로 upload-completed가 되는 failing test 작성**

`packages/server/src/upload/HttpServer.upload-rewrite.spec.ts`의 기존 `/upload` POST 테스트를 새 흐름으로 바꾼다.

```ts
it("uploads and rewrites markdown during the export job", async () => {
  const { baseUrl, close, uploadPhaseRunner } = await createHttpServerSpecHarness()

  try {
    uploadPhaseRunner.mockResolvedValue([
      {
        candidate: {
          kind: "image",
          sourceUrl: "https://postfiles.pstatic.net/image.png",
          localPath: "public/shared.png",
          markdownReference: "./public/shared.png",
        },
        uploadedUrl: "https://cdn.example.com/shared.png",
      },
    ])

    const options = defaultExportOptions()
    options.assets.imageHandlingMode = "download-and-upload"

    const exportResponse = await fetch(`${baseUrl}/api/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        blogIdOrUrl: "https://blog.naver.com/test",
        outputDir: createTestPath("http-server", "auto-upload-rewrite"),
        options,
        scanResult: createScanResultFixture(),
        uploadProvider: {
          providerKey: "github",
          providerFields: {
            repo: "owner/repo",
            branch: "main",
            token: "secret-token",
          },
        },
      }),
    })

    expect(exportResponse.status).toBe(202)
    const body = (await exportResponse.json()) as { jobId: string }
    const completedJob = await waitForJob({
      baseUrl,
      jobId: body.jobId,
      accept: (job) => job.status === "upload-completed",
    })

    expect(completedJob.upload.status).toBe("upload-completed")
    expect(completedJob.upload.uploadedCount).toBe(completedJob.upload.candidateCount)
    expect(uploadPhaseRunner).toHaveBeenCalledTimes(1)
  } finally {
    await close()
  }
})
```

- [ ] **Step 2: focused test 실패 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/server/src/upload/HttpServer.upload-rewrite.spec.ts
```

Expected:

```text
FAIL packages/server/src/upload/HttpServer.upload-rewrite.spec.ts
```

현재 상태는 `upload-ready`에서 멈추거나 `/api/export/:jobId/upload` 요청이 없어서 완료되지 않아야 한다.

- [ ] **Step 3: JobStore에 export phase 완료 상태 추가**

`packages/server/src/jobs/JobStore.ts`에 upload 자동 실행 전 manifest와 item을 반영하는 메서드를 추가한다.

```ts
completeExportPhase(id: string, manifest: ExportManifest) {
  const job = this.mustGet(id)
  job.manifest = manifest
  job.resumeAvailable = false
  job.progress = {
    total: manifest.totalPosts,
    completed: manifest.successCount,
    failed: manifest.failureCount,
  }
  job.upload = manifest.upload
  job.items =
    job.items.length > 0
      ? job.items
      : manifest.posts.map((post) => buildJobItemFromPost(post, new Date().toISOString()))
}
```

기존 `completeExport`는 이 helper를 호출하도록 정리한다.

```ts
completeExport(id: string, manifest: ExportManifest) {
  this.completeExportPhase(id, manifest)
  const job = this.mustGet(id)

  if (manifest.upload.status === UPLOAD_STATUSES.UPLOAD_READY) {
    job.status = JOB_STATUSES.UPLOAD_READY
    job.finishedAt = null
    return
  }

  job.status = JOB_STATUSES.COMPLETED
  job.finishedAt = new Date().toISOString()
}
```

- [ ] **Step 4: HttpExportJobRunner에서 upload phase 연결**

`packages/server/src/jobs/HttpExportJobRunner.ts` imports를 추가한다.

```ts
import { UPLOAD_STATUSES } from "@exitpress/domain/export-job/ExportJobState.js"
import { runImageUploadPhase } from "@exitpress/engine/exporting/upload/ImageUploadPhase.js"
import { rewriteUploadedAssets } from "@exitpress/engine/exporting/upload/ImageUploadRewriter.js"
import { dedupeUploadCandidatesByLocalPath } from "@exitpress/engine/exporting/upload/util/dedupeUploadCandidatesByLocalPath.js"
import { normalizeUploaderConfig, sanitizeUploadError } from "../upload/HttpUploadConfig.js"
import { syncJobUploadProgress } from "../upload/HttpUploadProgress.js"
```

`runExport`에서 `jobStore.completeExport(jobId, manifest)` 대신 자동 upload 분기를 둔다.

```ts
const shouldAutoUpload =
  request.options.assets.imageHandlingMode === "download-and-upload" &&
  request.uploadProvider &&
  manifest.upload.status === UPLOAD_STATUSES.UPLOAD_READY &&
  manifest.upload.candidateCount > 0

if (!shouldAutoUpload) {
  jobStore.completeExport(jobId, manifest)
  scheduleJobManifestPersist(jobId)
  await manifestPersistRunner.flush(jobId)
  return
}

jobStore.completeExportPhase(jobId, manifest)

const uploadedLocalPaths = new Set<string>()
const uploadResults = []
const candidates = dedupeUploadCandidatesByLocalPath(
  manifest.posts.flatMap((post) => post.upload.candidates),
)

jobStore.startUpload(jobId, uploadedLocalPaths)
jobStore.appendLog(jobId, "Image Upload를 시작했습니다.")
await manifestPersistRunner.flush(jobId)

try {
  const phaseResults = await runImageUploadPhase({
    outputDir: request.outputDir,
    candidates,
    uploaderKey: request.uploadProvider.providerKey,
    uploaderConfig: normalizeUploaderConfig({
      uploaderKey: request.uploadProvider.providerKey,
      providerFields: request.uploadProvider.providerFields,
    }),
    abortSignal: signal,
    onProgress: ({ lastCompletedLocalPath }) => {
      if (lastCompletedLocalPath) {
        uploadedLocalPaths.add(lastCompletedLocalPath)
      }
      syncJobUploadProgress({ jobStore, jobId, uploadedLocalPaths })
      scheduleJobManifestPersist(jobId)
    },
  })

  uploadResults.push(...phaseResults)

  const rewritten = await rewriteUploadedAssets({
    outputDir: request.outputDir,
    manifest,
    items: jobStore.get(jobId)?.items ?? [],
    uploadResults,
  })

  jobStore.completeUpload(jobId, rewritten)
  scheduleJobManifestPersist(jobId)
  await manifestPersistRunner.flush(jobId)
} catch (error) {
  const message = sanitizeUploadError({
    error,
    providerFields: request.uploadProvider.providerFields,
  })
  jobStore.appendLog(jobId, message)
  jobStore.fail(jobId, message)
  await manifestPersistRunner.flush(jobId)
}
```

구현 중 `uploadResults` 타입은 `ImageUploadResult[]`로 선언한다.

- [ ] **Step 5: upload progress focused test 갱신**

`packages/server/src/upload/HttpServer.upload-progress.spec.ts`에서 `/upload` POST를 기다리는 부분을 제거하고, `/api/export` 이후 polling으로 `uploading` 또는 `upload-completed` 상태를 관측하도록 바꾼다.

```ts
const uploadingJob = await waitForJob({
  baseUrl,
  jobId: exportBody.jobId,
  accept: (job) => job.status === "uploading" || job.status === "upload-completed",
})

expect(["uploading", "upload-completed"]).toContain(uploadingJob.status)
expect(uploadingJob.upload.candidateCount).toBeGreaterThan(0)
```

- [ ] **Step 6: focused tests 통과 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/server/src/upload/HttpServer.upload-progress.spec.ts packages/server/src/upload/HttpServer.upload-rewrite.spec.ts
```

Expected:

```text
PASS packages/server/src/upload/HttpServer.upload-progress.spec.ts
PASS packages/server/src/upload/HttpServer.upload-rewrite.spec.ts
```

## Task 7: 수동 Upload 시작 흐름 제거

**Files:**
- Modify: `packages/server/src/routes/UploadRoutes.ts`
- Modify: `packages/server/src/http/HttpServer.ts`
- Modify: `packages/server/src/routes/ApiRouteContext.ts`
- Modify: `packages/web/src/features/job-results/UseExportJob.ts`
- Modify: `packages/web/src/features/job-results/JobResultsPanel.tsx`
- Modify: `packages/web/src/features/common/hooks/UseWizardActions.ts`
- Modify: `packages/web/src/features/common/hooks/schema/WizardActions.ts`
- Modify: `packages/web/src/app/App.tsx`
- Modify: `packages/web/src/app/AppStepView.tsx`
- Test: `packages/web/src/features/job-results/UseExportJob.spec.tsx`
- Test: `packages/server/src/routes/HttpServer.routes.spec.ts`

- [ ] **Step 1: 수동 upload API 호출 금지 테스트 작성**

`packages/web/src/features/job-results/UseExportJob.spec.tsx`에서 기존 `startUpload` 테스트를 제거하고 다음 테스트로 대체한다.

```tsx
it("does not expose a manual upload starter in the export job hook", () => {
  const { result } = renderHook(() => useExportJob())

  expect("startUpload" in result.current).toBe(false)
})
```

- [ ] **Step 2: server route 테스트 작성**

`packages/server/src/routes/HttpServer.routes.spec.ts`에 수동 upload POST가 더 이상 route로 처리되지 않는지 확인한다.

```ts
it("does not expose manual export upload start route", async () => {
  const { baseUrl, close } = await createHttpServerSpecHarness()

  try {
    const response = await fetch(`${baseUrl}/api/export/job-id/upload`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: baseUrl,
      },
      body: JSON.stringify({
        providerKey: "github",
        providerFields: {},
      }),
    })

    expect(response.status).toBe(404)
  } finally {
    await close()
  }
})
```

- [ ] **Step 3: focused tests 실패 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/web/src/features/job-results/UseExportJob.spec.tsx packages/server/src/routes/HttpServer.routes.spec.ts
```

Expected:

```text
FAIL packages/web/src/features/job-results/UseExportJob.spec.tsx
FAIL packages/server/src/routes/HttpServer.routes.spec.ts
```

- [ ] **Step 4: UseExportJob에서 startUpload 제거**

`packages/web/src/features/job-results/UseExportJob.ts`에서 다음 항목을 제거한다.

```ts
const [uploadSubmitting, setUploadSubmitting] = useState(false)
const startUpload = useCallback(...)
```

return에서도 제거한다.

```ts
return {
  job,
  submitting,
  hydrateJob,
  resumeJob,
  setJob,
  startJob,
}
```

`uploadSubmitting`이 step resolution에 필요하면 App 레벨의 test upload submitting과 구분해서 쓰지 않는다. 자동 upload 진행은 job status `uploading`으로 판단한다.

- [ ] **Step 5: WizardActions에서 handleUpload 제거**

`packages/web/src/features/common/hooks/UseWizardActions.ts`에서 `handleUpload` callback과 `startUpload` destructuring을 제거한다. schema에서도 제거한다.

```ts
export type UseWizardActionsResult = {
  ensureScanResult: () => Promise<ScanResult | null>
  handleBlogInputChange: (value: string) => void
  handleOutputDirChange: (value: string) => void
  handleOutputDirBlur: () => void
  handleCategoryToggle: (categoryId: number, checked: boolean) => void
  handleSelectAllCategories: () => void
  handleClearAllCategories: () => void
  handleRestoreResume: () => Promise<void>
  handleResumeExport: () => Promise<void>
  handleResetResume: () => Promise<void>
  goToPreviousStep: () => void
  goToNextStep: () => Promise<void>
}
```

- [ ] **Step 6: JobResultsPanel과 AppStepView props 정리**

`JobResultsPanel`에서 `uploadSubmitting`, `uploadProviders`, `uploadProviderError`, `onUploadStart` props를 제거한다. `UploadPanel` 호출도 `mode`와 `job`만 넘긴다.

```tsx
<UploadPanel mode={mode} job={job} />
```

`AppStepView`에서도 결과 panel에 upload form 관련 props를 넘기지 않는다.

- [ ] **Step 7: UploadRoutes에서 수동 POST route 제거**

`packages/server/src/routes/UploadRoutes.ts`에서 `/api/export/:jobId/upload` match 이후 처리 전체를 제거한다. `GET /api/upload-providers`와 `POST /api/upload-providers/test`만 남긴다.

```ts
if (method !== "POST" || url.pathname !== "/api/upload-providers/test") {
  return false
}
```

실제 구현은 `GET /api/upload-providers`, `POST /api/upload-providers/test`, fallback `return false` 순서로 둔다.

- [ ] **Step 8: HttpServer context에서 수동 upload runner 제거**

`packages/server/src/http/HttpServer.ts`에서 `createHttpUploadJobRunner` import와 생성 코드를 제거한다.

```ts
const routeContext = {
  state,
  blockScanJobRunner,
  exportJobRunner,
  uploadProviderSource,
}
```

`packages/server/src/routes/ApiRouteContext.ts`에서 `uploadJobRunner` field를 제거한다.

```ts
export type ApiRouteContext = {
  state: HttpServerState
  blockScanJobRunner: BlockScanJobRunner
  exportJobRunner: HttpExportJobRunner
  uploadProviderSource: UploadProviderSource
}
```

- [ ] **Step 9: focused tests 통과 확인**

Run:

```bash
mise exec -- pnpm test:offline -- packages/web/src/features/job-results/UseExportJob.spec.tsx packages/server/src/routes/HttpServer.routes.spec.ts
```

Expected:

```text
PASS packages/web/src/features/job-results/UseExportJob.spec.tsx
PASS packages/server/src/routes/HttpServer.routes.spec.ts
```

## Task 8: UI Smoke와 Live Upload E2E 갱신

**Files:**
- Modify: `tests/e2e/scenarios/ui-smoke.ts`
- Modify: `tests/e2e/scenarios/ui-live-upload.ts`
- Modify: `tests/e2e/run-ui-live-upload.ts`

- [ ] **Step 1: mock smoke에서 새 흐름 기대값으로 변경**

`tests/e2e/scenarios/ui-smoke.ts`에서 upload-ready 대기와 `/api/export/job-smoke/upload` route를 제거한다. `/api/upload-providers/test` mock route를 추가한다.

```ts
if (pathname === "/api/upload-providers/test" && request.method() === "POST") {
  await route.fulfill(
    buildJsonResponse({
      uploadedUrl: "https://cdn.example.com/test-upload.png",
    }),
  )
  return
}
```

`/api/export` mock request 검증에 `uploadProvider`를 추가한다.

```ts
const body = request.postDataJSON() as {
  uploadProvider?: {
    providerKey: string
    providerFields: Record<string, unknown>
  }
}

if (body.uploadProvider?.providerKey !== "github") {
  throw new Error("export request did not include upload provider")
}
```

job polling mock은 `running -> uploading -> upload-completed` 순서로 바꾼다.

```ts
const uploadCompletedJob = {
  ...baseJob,
  status: "upload-completed",
  upload: {
    status: "upload-completed",
    eligiblePostCount: 1,
    candidateCount: 1,
    uploadedCount: 1,
    failedCount: 0,
    terminalReason: null,
  },
}
```

- [ ] **Step 2: live upload scenario에서 수동 upload POST 제거**

`tests/e2e/scenarios/ui-live-upload.ts`에서 다음 흐름을 제거한다.

```ts
await waitForJob({ accept: (job) => job.status === "upload-ready" })
await page.getByRole("button", { name: "업로드 시작" }).click()
await waitForResponse((response) => response.url() === `${baseUrl}/api/export/${jobId}/upload`)
```

대신 provider 설정 단계에서 test upload를 누른다.

```ts
await page.getByRole("button", { name: "테스트 업로드" }).click()
await expect(page.getByText(/https?:\\/\\//)).toBeVisible()
```

export 후 완료 대기는 `upload-completed`로 바꾼다.

```ts
const completedJob = await waitForJob({
  baseUrl,
  jobId,
  accept: (job) => job.status === "upload-completed",
  timeoutLabel: "automatic upload completion",
})
```

최종 Markdown 검증은 원격 URL 치환을 확인한다.

```ts
const markdown = await readFile(path.join(outputDir, completedJob.items[0]!.outputPath!), "utf8")

if (!/https?:\\/\\//.test(markdown)) {
  throw new Error("exported markdown did not contain uploaded image URL")
}

if (markdown.includes("./public/") || markdown.includes("../public/")) {
  throw new Error("exported markdown still contains local image reference")
}
```

- [ ] **Step 3: smoke 실행 실패 확인**

Run:

```bash
mise exec -- pnpm smoke:ui
```

Expected before all implementation is complete:

```text
FAIL
```

실패가 이미 구현된 새 흐름의 실제 버그를 가리키면 해당 task로 돌아가 수정한다.

- [ ] **Step 4: smoke 통과 확인**

Run:

```bash
mise exec -- pnpm smoke:ui
```

Expected:

```text
PASS
```

- [ ] **Step 5: live upload e2e command 확인**

환경에 live upload credential이 있으면 실행한다.

```bash
mise exec -- pnpm test:network:upload
```

Expected:

```text
PASS
```

환경 변수나 credential이 없어서 실행할 수 없으면, 실패 원인을 최종 보고에 `⚠️`로 남긴다. 테스트 코드는 자동 upload 완료와 최종 URL 치환을 검증하도록 갱신되어 있어야 한다.

## Task 9: Knowledge 문서 동기화

**Files:**
- Modify: `.agents/knowledge/upload.md`
- Modify: `.agents/knowledge/verification.md`
- Do not modify: `.agents/knowledge/architecture.md`

- [ ] **Step 1: upload knowledge 갱신**

`.agents/knowledge/upload.md`의 Upload Flow를 다음 기준으로 바꾼다.

```md
## Upload Flow
- `download-and-upload` export는 export 시작 전에 web UI에서 provider key와 provider fields를 받는다.
- Server는 export 요청에서 provider fields를 runtime catalog 기준으로 정규화하고 provider secret을 job state, manifest, log에 저장하지 않는다.
- Export는 local asset candidates를 만든 뒤 같은 export job 안에서 upload phase와 Markdown rewrite phase를 이어서 실행한다.
- 동일 local asset upload candidate는 local path 기준으로 dedupe되어 한 번만 업로드된다.
- 결과 화면은 자동 upload 진행률과 완료/실패 결과만 보여주며 별도 upload 시작 form을 제공하지 않는다.
- Test upload는 임시 PNG로 provider 설정만 검증하고 export job이나 manifest를 만들지 않는다.
```

- [ ] **Step 2: verification knowledge 갱신**

`.agents/knowledge/verification.md`의 network command 설명을 다음 기준으로 수정한다.

```md
- `mise exec -- pnpm test:network:upload`: live provider 설정 단계, test upload, export 중 자동 upload, 최종 Markdown URL 치환을 검증한다.
```

Task Loops upload 항목도 추가하거나 수정한다.

```md
- Upload provider UI, export upload payload, upload runner, rewrite, or live upload e2e changes require `mise exec -- pnpm smoke:ui`; run `mise exec -- pnpm test:network:upload` when credentials are available.
```

- [ ] **Step 3: 문서 확인**

Run:

```bash
rg -n "upload-ready|/api/export/.*/upload|test:network:upload|자동 upload|Test upload" .agents/knowledge/upload.md .agents/knowledge/verification.md .agents/knowledge/architecture.md
```

Expected:

```text
.agents/knowledge/upload.md
.agents/knowledge/verification.md
```

`upload-ready`나 `/api/export/:jobId/upload`가 새 정상 흐름 설명으로 남아 있으면 수정한다. 과거 manifest/bootstrap 설명처럼 필요한 예외가 아니면 제거한다.

## Task 10: 전체 검증과 정리

**Files:**
- All files changed by earlier tasks
- `.agents/knowledge/verification.md`

- [ ] **Step 1: format 적용**

Run:

```bash
mise exec -- pnpm format
```

Expected:

```text
PASS
```

또는 formatter가 파일을 수정하고 정상 종료한다.

- [ ] **Step 2: local baseline 실행**

Run:

```bash
mise exec -- pnpm check:local
```

Expected:

```text
PASS
```

미수정 파일에서 기존 오류가 나오면 오류 파일과 변경 범위를 분리해서 보고한다. 수정한 파일의 오류는 고친다.

- [ ] **Step 3: smoke UI 실행**

Run:

```bash
mise exec -- pnpm smoke:ui
```

Expected:

```text
PASS
```

- [ ] **Step 4: live upload e2e 실행**

Credential이 있는 환경이면 실행한다.

```bash
mise exec -- pnpm test:network:upload
```

Expected:

```text
PASS
```

Credential이 없거나 외부 provider 장애가 있으면 다음 형식으로 최종 보고에 남긴다.

```md
⚠️ `mise exec -- pnpm test:network:upload`: 실행 불가. 원인: `UPLOAD_GITHUB_TOKEN` 환경 변수가 설정되어 있지 않음.
```

- [ ] **Step 5: 수동 upload route 잔여 참조 검색**

Run:

```bash
rg -n "/api/export/.*/upload|startUpload|upload-ready panel|업로드 시작" packages tests docs .agents/knowledge
```

Expected:

```text
```

허용되는 결과는 과거 상태를 읽는 resume migration성 코드나 테스트 fixture뿐이다. 새 정상 흐름의 UI, e2e, server route에는 남기지 않는다.

- [ ] **Step 6: 중복 이미지 가드레일 검색**

Run:

```bash
rg -n "dedupeUploadCandidatesByLocalPath|sourceUrlCache|contentHash|uploadResults" packages/engine/src packages/server/src
```

Expected:

```text
packages/engine/src/exporting/upload/util/dedupeUploadCandidatesByLocalPath.ts
packages/engine/src/exporting/assets/AssetStore.ts
```

추가 결과는 자동 upload runner에서 dedupe helper를 호출하는 코드여야 한다.

- [ ] **Step 7: 최종 diff 검토**

Run:

```bash
git diff --stat
git diff -- packages/domain/src/export-job/schema/ExportRequest.ts packages/web/src packages/server/src packages/engine/src/exporting/upload packages/engine/src/exporting/workflow tests/e2e .agents/knowledge
```

Expected:

```text
Diff only covers automatic upload provider setup, export upload payload, upload execution, rewrite, e2e, and knowledge docs.
```

parser block, template rendering, link rewrite, category selection, path template 파일이 포함되어 있으면 현재 요청과 직접 관련 있는지 확인한다. 직접 관련이 없으면 되돌린다.
