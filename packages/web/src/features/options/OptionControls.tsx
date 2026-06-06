import type { ReactNode } from "react"

import { Checkbox } from "../../components/ui/Checkbox.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select.js"
import { cn } from "../../lib/Cn.js"

const optionFieldCardClass =
  "field-card grid min-h-[6.25rem] content-start gap-1.5 self-start rounded-2xl px-3 py-3"
const optionFieldPlainClass = "grid min-h-0 content-start gap-1.5 self-start"
const checkFieldClass = "field-card flex w-full flex-col self-start rounded-2xl px-3 py-3"
const optionSectionClass = "option-section grid gap-4"
export const optionEmbeddedFieldClass =
  "field grid min-h-0 gap-2 rounded-xl border border-border bg-muted/20 px-3 py-3"
export const optionEmbeddedPanelClass =
  "grid gap-3 rounded-xl border border-border bg-muted/20 px-3 py-3"
export const optionEmbeddedTileClass =
  "grid gap-2 rounded-lg border border-border bg-background/30 px-3 py-3"
export const editorOutputCardClass = "field-card grid gap-4 rounded-2xl px-4 py-4 xl:col-span-2"

const allOptionFieldSurfaces = ["card", "plain"] as const
type OptionFieldSurface = (typeof allOptionFieldSurfaces)[number]

type SelectOption = {
  value: string
  label: string
  description?: string
}

export const OptionField = ({
  optionKey,
  labelFor,
  label,
  description,
  children,
  disabled = false,
  surface = "card",
}: {
  optionKey: string
  labelFor?: string
  label: string
  description?: string
  children: ReactNode
  disabled?: boolean
  surface?: OptionFieldSurface
}) => (
  <div
    className={cn(
      surface === "card" ? optionFieldCardClass : optionFieldPlainClass,
      disabled && "opacity-60",
    )}
    data-option-key={optionKey}
    aria-disabled={disabled}
  >
    <label htmlFor={labelFor} className="text-sm font-semibold text-foreground">
      {label}
    </label>
    {children}
    {description ? <small className="field-help text-[13px] leading-5">{description}</small> : null}
  </div>
)

export const OptionSelectField = <T extends string>({
  inputId,
  value,
  options,
  disabled = false,
  placeholder,
  describedBy,
  ariaInvalid = false,
  onValueChange,
}: {
  inputId: string
  value: T
  options: SelectOption[]
  disabled?: boolean
  placeholder?: string
  describedBy?: string
  ariaInvalid?: boolean
  onValueChange: (value: T) => void
}) => (
  <Select
    value={value}
    disabled={disabled}
    onValueChange={(nextValue) => onValueChange(nextValue as T)}
  >
    <SelectTrigger
      id={inputId}
      data-value={value}
      aria-describedby={describedBy}
      aria-invalid={ariaInvalid || undefined}
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        {options.map((option) => (
          <SelectItem key={`${inputId}:${option.value}`} value={option.value}>
            <span className="min-w-0 truncate">
              {option.label}
              {option.description ? (
                <span className="text-muted-foreground"> {option.description}</span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
)

export const CheckField = ({
  inputId,
  optionKey,
  label,
  description,
  checked,
  onChange,
  compact = false,
  disabled = false,
}: {
  inputId: string
  optionKey: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  compact?: boolean
  disabled?: boolean
}) => (
  <label
    className={cn(
      checkFieldClass,
      compact ? "min-h-0 gap-2" : "min-h-[7.75rem] gap-3",
      disabled && "opacity-60",
    )}
    data-option-key={optionKey}
    aria-disabled={disabled}
  >
    <span className={`check-head flex gap-3 ${compact ? "items-center" : "items-start"}`}>
      <Checkbox
        id={inputId}
        checked={checked}
        disabled={disabled}
        className="mt-0.5"
        onCheckedChange={(next) => onChange(next === true)}
      />
      <span className="check-copy grid min-w-0 gap-1">
        <span className="check-title text-sm font-semibold text-foreground">{label}</span>
      </span>
    </span>
    {description ? <small className="field-help text-[13px] leading-5">{description}</small> : null}
  </label>
)

export const RadioField = ({
  inputId,
  name,
  optionKey,
  label,
  description,
  checked,
  onChange,
  children,
}: {
  inputId: string
  name: string
  optionKey: string
  label: string
  description?: string
  checked: boolean
  onChange: () => void
  children?: ReactNode
}) => (
  <label
    className={cn(checkFieldClass, checked && "shadow-[var(--focus-ring)]")}
    data-option-key={optionKey}
  >
    <span className="check-head flex items-start gap-3">
      <input
        id={inputId}
        name={name}
        aria-labelledby={`${inputId}-label`}
        className="mt-0.5 size-[1.1rem] shrink-0 accent-primary"
        type="radio"
        checked={checked}
        onChange={onChange}
      />
      <span className="check-copy grid min-w-0 gap-1">
        <span id={`${inputId}-label`} className="check-title text-sm font-semibold text-foreground">
          {label}
        </span>
        {description ? (
          <small className="field-help text-[13px] leading-5">{description}</small>
        ) : null}
      </span>
    </span>
    {children ? <div className="pt-3">{children}</div> : null}
  </label>
)

export const OptionSection = ({
  title,
  note,
  children,
}: {
  title: string
  note: string
  children: ReactNode
}) => (
  <section className={optionSectionClass}>
    <div className="option-section-header flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{title}</h3>
        <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{note}</p>
      </div>
    </div>
    <div className="option-grid grid items-start gap-4 xl:grid-cols-2">{children}</div>
  </section>
)
