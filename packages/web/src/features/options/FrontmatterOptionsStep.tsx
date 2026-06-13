import { Box, Checkbox, Flash, FormControl, Label, Text, TextInput } from "@primer/react"

import type {
  ExportOptions,
  FrontmatterFieldMeta,
  FrontmatterFieldName,
} from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { CheckField, OptionSection, OptionWideBox } from "./OptionControls.js"

export const FrontmatterOptionsStep = ({
  options,
  description,
  frontmatterFieldOrder,
  frontmatterFieldMeta,
  frontmatterValidationErrors,
  onOptionsChange,
}: {
  options: ExportOptions
  description: (key: string) => string | undefined
  frontmatterFieldOrder: FrontmatterFieldName[]
  frontmatterFieldMeta: Record<FrontmatterFieldName, FrontmatterFieldMeta>
  frontmatterValidationErrors: string[]
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => (
  <OptionSection title="Frontmatter" note="메타데이터 블록">
    <OptionWideBox>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: ["1fr", null, "minmax(0,0.85fr) minmax(0,1.15fr)"],
          alignItems: "start",
        }}
      >
        <CheckField
          inputId="frontmatter-enabled"
          optionKey="frontmatter-enabled"
          label="Frontmatter 사용"
          description={description("frontmatter-enabled")}
          checked={options.frontmatter.enabled}
          compact
          onChange={(checked) =>
            onOptionsChange((current) => ({
              ...current,
              frontmatter: {
                ...current.frontmatter,
                enabled: checked,
              },
            }))
          }
        />
        <Box
          data-state={frontmatterValidationErrors.length > 0 ? "error" : "default"}
          sx={{
            bg: frontmatterValidationErrors.length > 0 ? "danger.subtle" : "canvas.subtle",
            border: "1px solid",
            borderColor: frontmatterValidationErrors.length > 0 ? "danger.muted" : "border.default",
            borderRadius: 2,
            display: "flex",
            flexDirection: ["column", "row"],
            gap: 3,
            justifyContent: "space-between",
            p: 3,
          }}
        >
          <Box sx={{ display: "grid", gap: 2, minWidth: 0 }}>
            <Text sx={{ fontSize: 1, fontWeight: "semibold" }}>별칭 상태</Text>
            <Text
              sx={{
                color: frontmatterValidationErrors.length > 0 ? "danger.fg" : "fg.muted",
                fontSize: 1,
                lineHeight: "24px",
              }}
            >
              {frontmatterValidationErrors.length > 0
                ? "별칭 중복이나 빈 값을 먼저 정리한 뒤 내보내세요."
                : "현재 frontmatter 별칭 구성이 올바릅니다."}
            </Text>
          </Box>
          <Label
            variant={frontmatterValidationErrors.length > 0 ? "danger" : "success"}
            sx={{ alignSelf: "flex-start" }}
          >
            {frontmatterValidationErrors.length > 0 ? "별칭 오류" : "정상"}
          </Label>
        </Box>
      </Box>
    </OptionWideBox>

    {frontmatterValidationErrors.length > 0 ? (
      <OptionWideBox>
        <Flash id="frontmatter-status" variant="danger">
          {frontmatterValidationErrors.join(" ")}
        </Flash>
      </OptionWideBox>
    ) : null}

    <OptionWideBox id="frontmatter-fields">
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: ["1fr", null, "1fr 1fr", "1fr 1fr 1fr"],
          alignItems: "start",
        }}
      >
        {frontmatterFieldOrder.map((fieldName) => {
          const fieldMeta = frontmatterFieldMeta[fieldName]
          const fieldEnabled = options.frontmatter.fields[fieldName]
          const hasError = frontmatterValidationErrors.some((error) => error.includes(fieldName))

          return (
            <Box
              key={fieldName}
              data-frontmatter-field={fieldName}
              data-state={hasError ? "error" : "default"}
              sx={{
                bg: hasError ? "danger.subtle" : "canvas.subtle",
                border: "1px solid",
                borderColor: hasError ? "danger.muted" : "border.default",
                borderRadius: 2,
                display: "grid",
                gap: 3,
                p: 3,
              }}
            >
              <FormControl
                id={`frontmatter-field-${fieldName}`}
                layout="horizontal"
                disabled={!options.frontmatter.enabled}
                sx={{ alignItems: "flex-start", gap: 2 }}
              >
                <Checkbox
                  checked={fieldEnabled}
                  onChange={(event) =>
                    onOptionsChange((current) => ({
                      ...current,
                      frontmatter: {
                        ...current.frontmatter,
                        fields: {
                          ...current.frontmatter.fields,
                          [fieldName]: event.target.checked,
                        },
                      },
                    }))
                  }
                />
                <Box sx={{ display: "grid", gap: 1, minWidth: 0 }}>
                  <FormControl.Label>{fieldMeta.label}</FormControl.Label>
                  <FormControl.Caption>{fieldMeta.description}</FormControl.Caption>
                </Box>
              </FormControl>

              <FormControl
                id={`frontmatter-alias-${fieldName}`}
                disabled={!options.frontmatter.enabled || !fieldEnabled}
              >
                <FormControl.Label>내보낼 key 별칭</FormControl.Label>
                <TextInput
                  block
                  id={`frontmatter-alias-${fieldName}`}
                  data-alias-input="true"
                  data-field-name={fieldName}
                  value={options.frontmatter.aliases[fieldName] ?? ""}
                  placeholder={fieldMeta.defaultAlias}
                  aria-invalid={hasError || undefined}
                  validationStatus={hasError ? "error" : undefined}
                  disabled={!options.frontmatter.enabled || !fieldEnabled}
                  onChange={(event) =>
                    onOptionsChange((current) => ({
                      ...current,
                      frontmatter: {
                        ...current.frontmatter,
                        aliases: {
                          ...current.frontmatter.aliases,
                          [fieldName]: event.target.value,
                        },
                      },
                    }))
                  }
                />
              </FormControl>
            </Box>
          )
        })}
      </Box>
    </OptionWideBox>
  </OptionSection>
)
