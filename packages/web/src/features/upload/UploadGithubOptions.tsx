import { UPLOAD_PROVIDER_KEYS } from "@exitpress/domain/upload/UploadProviderKeys.js"
import { Checkbox, FormControl, TextInput } from "@primer/react"

export const UploadGithubOptions = ({
  providerKey,
  githubUseJsDelivr,
  githubJsDelivrUrl,
  updateProviderUiState,
}: {
  providerKey: string
  githubUseJsDelivr: boolean
  githubJsDelivrUrl: string
  updateProviderUiState: (state: { githubUseJsDelivr: boolean }) => void
}) => {
  if (providerKey !== UPLOAD_PROVIDER_KEYS.GITHUB) {
    return null
  }

  return (
    <>
      <FormControl
        id="upload-github-use-jsdelivr"
        layout="horizontal"
        sx={{
          alignItems: "flex-start",
          borderRadius: 2,
          px: 2,
          py: 2,
          "&:hover": { bg: "neutral.subtle" },
        }}
      >
        <Checkbox
          checked={githubUseJsDelivr}
          onChange={(event) =>
            updateProviderUiState({
              githubUseJsDelivr: event.target.checked,
            })
          }
        />
        <FormControl.Label>jsDelivr CDN 사용</FormControl.Label>
        <FormControl.Caption>
          {githubUseJsDelivr
            ? githubJsDelivrUrl || "저장소를 입력하면 jsDelivr 주소를 만듭니다."
            : "기본 GitHub 업로드 URL을 씁니다."}
        </FormControl.Caption>
      </FormControl>
      {githubUseJsDelivr ? (
        <FormControl id="upload-github-jsdelivr-preview">
          <FormControl.Label>자동 커스텀 URL</FormControl.Label>
          <TextInput
            block
            value={githubJsDelivrUrl}
            readOnly
            placeholder="저장소와 브랜치를 입력하면 미리보기가 보입니다."
          />
          <FormControl.Caption>
            제출하면 jsDelivr 주소가 커스텀 URL로 자동 적용됩니다.
          </FormControl.Caption>
        </FormControl>
      ) : null}
    </>
  )
}
