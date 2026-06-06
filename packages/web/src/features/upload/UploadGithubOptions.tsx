import { UPLOAD_PROVIDER_KEYS } from "@exitpress/domain/upload/UploadProviderKeys.js"

import { Checkbox } from "../../components/ui/Checkbox.js"
import { Input } from "../../components/ui/Input.js"

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
      <div className="subtle-panel flex items-center gap-3 rounded-2xl px-4 py-3">
        <Checkbox
          id="upload-github-use-jsdelivr"
          checked={githubUseJsDelivr}
          className="shrink-0"
          aria-describedby="upload-github-use-jsdelivr-description"
          onCheckedChange={(next) =>
            updateProviderUiState({
              githubUseJsDelivr: next === true,
            })
          }
        />
        <span className="grid gap-1">
          <label
            htmlFor="upload-github-use-jsdelivr"
            className="text-sm font-semibold text-foreground"
          >
            jsDelivr CDN 사용
          </label>
          <span
            id="upload-github-use-jsdelivr-description"
            className="text-sm leading-6 text-muted-foreground"
          >
            {githubUseJsDelivr
              ? githubJsDelivrUrl || "Repository를 입력하면 jsDelivr 주소를 만듭니다."
              : "기본 GitHub 업로드 URL을 사용합니다."}
          </span>
        </span>
      </div>
      {githubUseJsDelivr ? (
        <div className="grid gap-2">
          <label
            htmlFor="upload-github-jsdelivr-preview"
            className="text-sm font-semibold text-foreground"
          >
            자동 Custom URL
          </label>
          <Input
            id="upload-github-jsdelivr-preview"
            value={githubJsDelivrUrl}
            readOnly
            aria-describedby="upload-github-jsdelivr-preview-description"
            placeholder="Repository와 Branch를 입력하면 미리보기가 보입니다."
          />
          <span
            id="upload-github-jsdelivr-preview-description"
            className="text-sm leading-6 text-muted-foreground"
          >
            jsDelivr 주소는 제출 시 Custom URL로 자동 적용됩니다.
          </span>
        </div>
      ) : null}
    </>
  )
}
