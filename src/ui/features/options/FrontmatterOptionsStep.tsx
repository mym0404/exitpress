import type {
  ExportOptions,
  FrontmatterFieldMeta,
  FrontmatterFieldName,
} from "../../../domain/export-options/Types.js"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/Alert.js"
import { Badge } from "../../components/ui/Badge.js"
import { Checkbox } from "../../components/ui/Checkbox.js"
import { Input } from "../../components/ui/Input.js"
import { cn } from "../../lib/Cn.js"
import { CheckField, OptionSection } from "./OptionControls.js"

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
    <div className="frontmatter-toolbar grid gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
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
      <div
        className={cn(
          "frontmatter-state-card field-card flex min-h-0 flex-col justify-between gap-3 rounded-2xl px-4 py-4 sm:flex-row sm:items-start",
          frontmatterValidationErrors.length > 0 &&
            "border-[color-mix(in_srgb,var(--status-error-fg)_26%,transparent)] shadow-[var(--panel-shadow-border),0_0_0_1px_color-mix(in_srgb,var(--status-error-fg)_12%,transparent)]",
        )}
        data-state={frontmatterValidationErrors.length > 0 ? "error" : "default"}
      >
        <div className="frontmatter-state-copy grid min-w-0 gap-2">
          <span className="frontmatter-state-label text-sm font-semibold text-foreground">
            Alias 상태
          </span>
          <p className="frontmatter-description text-sm leading-6">
            {frontmatterValidationErrors.length > 0
              ? "중복되거나 비어 있는 alias를 먼저 정리해야 내보내기를 진행할 수 있습니다."
              : "현재 frontmatter alias 구성이 유효합니다."}
          </p>
        </div>
        <Badge
          className="frontmatter-state-badge flex min-w-[4.5rem] justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
          variant={frontmatterValidationErrors.length > 0 ? "destructive" : "secondary"}
        >
          {frontmatterValidationErrors.length > 0 ? "alias 오류" : "정상"}
        </Badge>
      </div>
    </div>

    {frontmatterValidationErrors.length > 0 ? (
      <Alert
        id="frontmatter-status"
        className="frontmatter-alert rounded-2xl px-4 py-4"
        data-state="error"
        variant="destructive"
      >
        <AlertTitle>Frontmatter alias</AlertTitle>
        <AlertDescription>{frontmatterValidationErrors.join(" ")}</AlertDescription>
      </Alert>
    ) : null}

    <div
      id="frontmatter-fields"
      className="frontmatter-grid grid gap-3 md:grid-cols-2 xl:col-span-2 2xl:grid-cols-3"
    >
      {frontmatterFieldOrder.map((fieldName) => {
        const fieldMeta = frontmatterFieldMeta[fieldName]
        const fieldEnabled = options.frontmatter.fields[fieldName]
        const hasError = frontmatterValidationErrors.some((error) => error.includes(fieldName))

        return (
          <div
            key={fieldName}
            className={cn(
              "frontmatter-row field-card grid content-start gap-3 rounded-2xl px-3 py-3",
              hasError &&
                "border-[color-mix(in_srgb,var(--status-error-fg)_26%,transparent)] shadow-[var(--panel-shadow-border),0_0_0_1px_color-mix(in_srgb,var(--status-error-fg)_12%,transparent)]",
            )}
            data-frontmatter-field={fieldName}
            data-state={hasError ? "error" : "default"}
          >
            <div className="frontmatter-main grid gap-3">
              <label
                className="frontmatter-toggle inline-flex items-start gap-3"
                htmlFor={`frontmatter-field-${fieldName}`}
              >
                <Checkbox
                  id={`frontmatter-field-${fieldName}`}
                  checked={fieldEnabled}
                  className="mt-0.5"
                  onCheckedChange={(next) =>
                    onOptionsChange((current) => ({
                      ...current,
                      frontmatter: {
                        ...current.frontmatter,
                        fields: {
                          ...current.frontmatter.fields,
                          [fieldName]: next === true,
                        },
                      },
                    }))
                  }
                />
                <span className="frontmatter-toggle-copy grid gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{fieldMeta.label}</span>
                </span>
              </label>
              <p className="frontmatter-description text-[13px] leading-5">
                {fieldMeta.description}
              </p>
            </div>
            <label className="field frontmatter-alias-field grid min-h-0 gap-1.5">
              <span className="text-sm font-semibold text-foreground">내보낼 key alias</span>
              <Input
                data-alias-input="true"
                data-field-name={fieldName}
                value={options.frontmatter.aliases[fieldName] ?? ""}
                placeholder={fieldMeta.defaultAlias}
                aria-invalid={hasError || undefined}
                className={
                  hasError
                    ? "border-[var(--destructive)] shadow-[var(--panel-shadow-border),0_0_0_1px_color-mix(in_srgb,var(--destructive)_18%,transparent)]"
                    : undefined
                }
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
            </label>
          </div>
        )
      })}
    </div>
  </OptionSection>
)
