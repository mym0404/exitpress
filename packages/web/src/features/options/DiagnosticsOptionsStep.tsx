import type { ExportOptions } from "@exitpress/domain/export-options/Types.js"

import { OptionField, OptionSection, OptionSelectField } from "./OptionControls.js"

export const DiagnosticsOptionsStep = ({
  options,
  description,
  onOptionsChange,
}: {
  options: ExportOptions
  description: (key: string) => string | undefined
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => (
  <OptionSection title="진단" note="실패 처리 기준">
    <OptionField
      optionKey="assets-downloadFailureMode"
      labelFor="assets-downloadFailureMode"
      label="이미지 다운로드 실패 처리"
      description={description("assets-downloadFailureMode")}
      disabled={options.assets.imageHandlingMode === "remote"}
    >
      <OptionSelectField
        inputId="assets-downloadFailureMode"
        value={options.assets.downloadFailureMode}
        disabled={options.assets.imageHandlingMode === "remote"}
        options={[
          { value: "fail", label: "글 실패 처리" },
          { value: "use-source", label: "원본 URL 유지" },
          { value: "omit", label: "이미지 생략" },
        ]}
        onValueChange={(downloadFailureMode) =>
          onOptionsChange((current) => ({
            ...current,
            assets: {
              ...current.assets,
              downloadFailureMode,
            },
          }))
        }
      />
    </OptionField>
  </OptionSection>
)
