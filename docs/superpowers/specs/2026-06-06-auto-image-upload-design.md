# 자동 Image Upload 설계

## 목표
- `download-and-upload` 옵션을 고르면 export 전에 업로드 provider와 metadata를 입력한다.
- 사용자가 export를 시작하면 같은 export job 안에서 이미지 다운로드, 필요한 전처리, 업로드, Markdown asset URL 치환까지 끝낸다.
- export 뒤에 별도 Image Upload 시작 버튼을 누르는 흐름을 없앤다.
- 같은 export job 안에서 동일 이미지는 한 번만 다운로드하고 한 번만 업로드한다.
- upload 설정, upload 실행, upload 진행 표시 외의 export 동작은 바꾸지 않는다.

## 확정한 결정
- 기본 접근은 기존 export job 안에 자동 업로드를 통합한다.
- `assets-options` 뒤에 `upload-provider-options` setup step을 추가한다.
- `upload-provider-options`는 `assets.imageHandlingMode === "download-and-upload"`일 때만 방문한다.
- provider form은 현재 결과 화면의 upload provider form 상태와 validation 규칙을 분리해 재사용한다.
- export 요청에는 정규화된 provider key와 provider fields를 포함한다.
- `download-and-upload`인데 provider 설정이 없으면 서버가 export 시작을 거절한다.
- 테스트 업로드는 서버가 만든 작은 임시 PNG로 provider 설정만 검증한다.
- 테스트 업로드는 export job, manifest, scan 결과, selected posts에 영향을 주지 않는다.
- 자동 업로드가 실패하면 전체 export job은 실패로 끝난다.
- 업로드 provider fields는 job state, manifest, log에 저장하지 않는다.

## 제외 범위
- parser block, template rendering, link rewrite, category selection, path template 동작은 바꾸지 않는다.
- `download`와 `remote` 이미지 처리 방식의 기존 export 결과는 바꾸지 않는다.
- 원격 provider에 남은 테스트 업로드 파일을 삭제하지 않는다.
- 오래된 수동 upload API를 위한 호환 wrapper나 대체 alias는 추가하지 않는다.
- 동일 이미지 dedupe 정책을 완화하지 않는다.

## 현재 상태
- `download-and-upload`는 export 중 local asset과 upload candidate를 만든다.
- export가 끝나면 job 상태가 `upload-ready`가 되고, 사용자가 결과 화면에서 provider form을 입력한 뒤 업로드를 시작한다.
- 서버의 `/api/export/:jobId/upload`가 별도 upload runner를 시작한다.
- upload runner는 candidate를 업로드한 뒤 Markdown과 manifest를 다시 rewrite한다.
- `AssetStore`는 같은 source URL과 content hash를 캐시해 중복 다운로드를 줄인다.
- `runImageUploadPhase`는 local path 기준으로 candidate를 dedupe한다.

## 새 사용자 흐름
- 사용자가 Assets 단계에서 `다운로드 후 Image Upload`를 선택한다.
- 다음 단계에서 provider와 metadata를 입력한다.
- 사용자는 선택적으로 `테스트 업로드`를 눌러 설정을 확인한다.
- Export 버튼을 누르면 export job이 시작된다.
- export job은 글별 Markdown과 local asset을 만든다.
- 모든 upload candidate가 확정되면 같은 job 안에서 업로드를 시작한다.
- 업로드가 끝나면 Markdown, frontmatter thumbnail, manifest, job item의 asset reference를 업로드 URL로 치환한다.
- 사용자는 결과 화면에서 export 진행률, upload 진행률, 최종 결과를 확인한다.

## UI 설계
- `setupSteps`에 `upload-provider-options`를 `assets-options` 다음에 추가한다.
- `goToNextStep`는 현재 단계가 `assets-options`이고 이미지 처리 방식이 `download-and-upload`면 `upload-provider-options`로 이동한다.
- 이미지 처리 방식이 `download`나 `remote`면 `upload-provider-options`를 건너뛴다.
- `goToPreviousStep`도 현재 옵션에 맞춰 건너뛰기 규칙을 동일하게 적용한다.
- `upload-provider-options`는 provider catalog를 로드하고 provider form을 보여준다.
- 필수 provider field가 비어 있으면 다음 단계로 넘어갈 수 없다.
- 결과 화면의 UploadPanel은 설정 form과 시작 버튼을 제거하고 진행률, 업로드된 수, 실패 수, 최종 링크만 보여준다.
- 기존 upload provider form 로직은 setup step과 결과 표시가 공유할 수 있도록 form 전용 컴포넌트와 hook으로 분리한다.

## 테스트 업로드 설계
- 새 서버 API는 provider key와 provider fields를 받는다.
- 서버는 provider fields를 catalog 기준으로 정규화한다.
- 서버는 repo-local `tmp/` 아래 작은 PNG 파일을 임시로 만든다.
- 서버는 같은 PicGo runtime 업로드 경로로 임시 PNG를 업로드한다.
- 성공하면 업로드 URL을 반환한다.
- 실패하면 sanitize된 에러 메시지를 반환한다.
- 요청이 끝나면 임시 로컬 파일은 삭제한다.
- 테스트 업로드 결과는 export options, job state, manifest에 저장하지 않는다.

## 요청 계약
```ts
type ExportRequest = {
  blogIdOrUrl: string
  outputDir: string
  profile: ExportProfile
  options: ExportOptions
  uploadProvider?: {
    providerKey: string
    providerFields: UploadProviderFields
  }
}
```

- `uploadProvider`는 `download-and-upload`에서만 필요하다.
- 서버는 `download-and-upload`가 아닌 요청에 들어온 `uploadProvider`를 무시하지 않고 거절한다.
- 서버는 provider fields를 정규화한 뒤 runtime upload config로 바꿔 export runner에 넘긴다.
- provider fields 원본과 token류 값은 manifest와 job log에 남기지 않는다.

## Export 내부 흐름
```ts
const manifest = await exporter.run()

if (shouldRunAutoUpload({ request, manifest })) {
  jobStore.startUpload(jobId)

  const uploadResults = await runImageUploadPhase({
    outputDir: request.outputDir,
    candidates: manifest.posts.flatMap((post) => post.upload.candidates),
    uploaderKey: request.uploadProvider.providerKey,
    uploaderConfig,
    onProgress: syncJobUploadProgress,
  })

  const rewritten = await rewriteUploadedAssets({
    outputDir: request.outputDir,
    manifest,
    items: jobStore.get(jobId)?.items ?? [],
    uploadResults,
  })

  jobStore.completeUpload(jobId, rewritten)
} else {
  jobStore.completeExport(jobId, manifest)
}
```

- `shouldRunAutoUpload`는 `download-and-upload`, provider 설정 있음, upload candidate 있음일 때만 참이다.
- upload candidate가 없으면 기존처럼 upload 상태를 `skipped`로 둔다.
- upload 성공 후 최종 job status는 `upload-completed`다.
- upload 실패 후 최종 job status는 `failed`다.
- `upload-ready`는 자동 업로드 대기 상태로 더 이상 쓰지 않는다.

## 중복 이미지 가드레일
- 같은 source URL은 `AssetStore.sourceUrlCache`를 통해 같은 local asset을 재사용한다.
- 같은 content hash는 `AssetStore.cache`를 통해 같은 local asset을 재사용한다.
- 같은 local path upload candidate는 `dedupeUploadCandidatesByLocalPath`로 한 번만 업로드한다.
- Markdown 치환은 여러 글이 같은 local asset을 참조해도 하나의 upload result를 공유한다.
- 이 dedupe 동작을 바꾸는 parser, renderer, asset path 정책 변경은 포함하지 않는다.

## 실패 처리
- provider 설정이 없거나 정규화에 실패하면 export job을 만들기 전에 요청을 거절한다.
- 테스트 업로드 실패는 export job을 만들지 않고 form 단계에만 표시한다.
- export 중 이미지 다운로드 실패는 기존 `downloadFailureMode` 규칙을 따른다.
- 자동 업로드 실패는 전체 job 실패로 표시한다.
- upload 실패 전에 이미 업로드된 원격 파일은 삭제하지 않는다.
- 실패 시 manifest와 job item에는 가능한 마지막 진행 상태를 남기되 provider secret은 남기지 않는다.

## Resume 기준
- 자동 업로드 통합 뒤에는 정상 흐름에서 `upload-ready` resume dialog가 필요하지 않다.
- export 중단이나 실패 후 재개는 기존 export resume 규칙을 우선한다.
- 업로드 도중 중단된 작업을 이어서 업로드하는 별도 UX는 이번 범위에 넣지 않는다.
- 기존 bootstrap이 과거 manifest의 `upload-ready`를 읽는 코드가 남아 있다면 현재 목표 상태 기준으로 정리한다.

## 검증 기준
- domain 계약 테스트: `ExportRequest`의 upload provider payload와 option 조합 validation.
- web 테스트: `download-and-upload` 선택 시 provider step 노출, 다른 모드에서 step skip, 필수 field validation, 테스트 업로드 버튼.
- server 테스트: export 요청의 provider 정규화, 누락 provider 거절, 테스트 업로드 API 성공과 실패.
- engine 테스트: export 후 자동 업로드와 rewrite, dedupe된 candidate 한 번 업로드, upload 실패 시 job 실패.
- smoke UI: mock flow에서 `download-and-upload` 선택, provider 입력, 테스트 업로드, export, 자동 업로드 완료 확인.
- network e2e: `tests/e2e/run-ui-live-upload.ts`와 `mise exec -- pnpm test:network:upload`는 provider 설정 단계, 테스트 업로드, export 중 자동 업로드, 최종 URL 치환을 검증하도록 갱신한다.
- 기본 검증 명령은 `mise exec -- pnpm check:local`이다.
- UI 상태와 upload flow 변경 후 `mise exec -- pnpm smoke:ui`도 실행한다.
- upload flow와 검증 명령이 바뀌므로 `.agents/knowledge/upload.md`와 `.agents/knowledge/verification.md`를 새 기준에 맞춰 갱신한다.

## 완료 기준
- `download-and-upload` export는 사용자가 별도 upload 시작 버튼을 누르지 않아도 최종 Markdown에 원격 image URL을 쓴다.
- 동일 이미지는 같은 export job에서 중복 다운로드와 중복 업로드를 하지 않는다.
- 테스트 업로드는 export 전에 provider 설정만 검증한다.
- 결과 화면에는 자동 업로드 진행과 결과만 표시된다.
- `download`와 `remote` 모드의 기존 export 동작은 그대로 유지된다.
- live upload e2e는 기존 수동 upload 시작 흐름이 아니라 자동 upload 완료와 최종 URL 치환을 검증한다.
- repo 지식 문서는 새 upload flow와 검증 기준을 설명한다.
