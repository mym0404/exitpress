import type { ExportOptions } from "../../../domain/export-options/Types.js"

import { CheckField, OptionField, OptionSection, OptionSelectField } from "./OptionControls.js"

export const AssetsOptionsStep = ({
  options,
  description,
  onOptionsChange,
}: {
  options: ExportOptions
  description: (key: string) => string | undefined
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => (
  <OptionSection title="Assets" note="다운로드와 참조 방식">
    <OptionField
      optionKey="assets-imageHandlingMode"
      labelFor="assets-imageHandlingMode"
      label="이미지 처리 방식"
      description={description("assets-imageHandlingMode")}
    >
      <OptionSelectField
        inputId="assets-imageHandlingMode"
        value={options.assets.imageHandlingMode}
        options={[
          { value: "download", label: "다운로드 유지" },
          { value: "remote", label: "네이버 원본 URL 유지" },
          { value: "download-and-upload", label: "다운로드 후 Image Upload" },
        ]}
        onValueChange={(imageHandlingMode) =>
          onOptionsChange((current) => ({
            ...current,
            assets: {
              ...current.assets,
              imageHandlingMode,
              compressionEnabled:
                imageHandlingMode === "remote" ? false : current.assets.compressionEnabled,
              downloadImages:
                imageHandlingMode === "remote"
                  ? false
                  : imageHandlingMode === "download-and-upload"
                    ? true
                    : current.assets.downloadImages,
              downloadThumbnails:
                imageHandlingMode === "remote"
                  ? false
                  : imageHandlingMode === "download-and-upload"
                    ? true
                    : current.assets.downloadThumbnails,
            },
          }))
        }
      />
    </OptionField>

    <CheckField
      inputId="assets-compressionEnabled"
      optionKey="assets-compressionEnabled"
      label="로컬 이미지 압축"
      description={description("assets-compressionEnabled")}
      checked={options.assets.compressionEnabled}
      disabled={options.assets.imageHandlingMode === "remote"}
      onChange={(checked) =>
        onOptionsChange((current) => ({
          ...current,
          assets: {
            ...current.assets,
            compressionEnabled: checked,
          },
        }))
      }
    />

    <OptionField
      optionKey="assets-stickerAssetMode"
      labelFor="assets-stickerAssetMode"
      label="스티커 자산 처리"
      description={description("assets-stickerAssetMode")}
    >
      <OptionSelectField
        inputId="assets-stickerAssetMode"
        value={options.assets.stickerAssetMode}
        options={[
          { value: "ignore", label: "무시" },
          { value: "download-original", label: "원본 자산 다운로드" },
        ]}
        onValueChange={(stickerAssetMode) =>
          onOptionsChange((current) => ({
            ...current,
            assets: {
              ...current.assets,
              stickerAssetMode,
            },
          }))
        }
      />
    </OptionField>

    <CheckField
      inputId="assets-downloadImages"
      optionKey="assets-downloadImages"
      label="본문 이미지 다운로드"
      description={description("assets-downloadImages")}
      checked={options.assets.downloadImages}
      disabled={options.assets.imageHandlingMode !== "download"}
      onChange={(checked) =>
        onOptionsChange((current) => ({
          ...current,
          assets: {
            ...current.assets,
            downloadImages: checked,
          },
        }))
      }
    />

    <CheckField
      inputId="assets-downloadThumbnails"
      optionKey="assets-downloadThumbnails"
      label="썸네일 다운로드"
      description={description("assets-downloadThumbnails")}
      checked={options.assets.downloadThumbnails}
      disabled={options.assets.imageHandlingMode !== "download"}
      onChange={(checked) =>
        onOptionsChange((current) => ({
          ...current,
          assets: {
            ...current.assets,
            downloadThumbnails: checked,
          },
        }))
      }
    />

    <OptionField
      optionKey="assets-thumbnailSource"
      labelFor="assets-thumbnailSource"
      label="썸네일 기준"
      description={description("assets-thumbnailSource")}
    >
      <OptionSelectField
        inputId="assets-thumbnailSource"
        value={options.assets.thumbnailSource}
        options={[
          { value: "post-list-first", label: "글 목록 대표 썸네일 사용" },
          { value: "first-body-image", label: "본문 첫 이미지 사용" },
          { value: "none", label: "썸네일 값 저장 안 함" },
        ]}
        onValueChange={(thumbnailSource) =>
          onOptionsChange((current) => ({
            ...current,
            assets: {
              ...current.assets,
              thumbnailSource,
            },
          }))
        }
      />
    </OptionField>
  </OptionSection>
)
