import { Box, Checkbox, FormControl, Select, Text } from "@primer/react"

import type { ReactNode } from "react"

const panelSx = {
  display: "grid",
  gap: 3,
  border: "1px solid",
  borderColor: "border.default",
  borderRadius: 2,
  bg: "canvas.subtle",
  p: 3,
} as const

type SelectOption = {
  value: string
  label: string
  description?: string
}

const optionSurfaceSx = {
  display: "grid",
  gap: 1,
  minWidth: 0,
  alignContent: "start",
} as const

export const OptionField = ({
  optionKey,
  labelFor,
  label,
  description,
  children,
  disabled = false,
}: {
  optionKey: string
  labelFor?: string
  label: string
  description?: string
  children: ReactNode
  disabled?: boolean
  surface?: "card" | "plain"
}) => (
  <FormControl id={labelFor} disabled={disabled} sx={optionSurfaceSx}>
    <FormControl.Label>{label}</FormControl.Label>
    {children}
    {description ? <FormControl.Caption>{description}</FormControl.Caption> : null}
    <Box data-option-key={optionKey} sx={{ display: "none" }} />
  </FormControl>
)

export const OptionSelectField = <T extends string>({
  inputId,
  value,
  options,
  disabled = false,
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
    block
    id={inputId}
    value={value}
    data-value={value}
    disabled={disabled}
    aria-describedby={describedBy}
    aria-invalid={ariaInvalid || undefined}
    onChange={(event) => onValueChange(event.target.value as T)}
  >
    {options.map((option) => (
      <Select.Option key={`${inputId}:${option.value}`} value={option.value}>
        {option.description ? `${option.label} ${option.description}` : option.label}
      </Select.Option>
    ))}
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
  <FormControl
    id={inputId}
    layout="horizontal"
    disabled={disabled}
    data-option-key={optionKey}
    sx={{
      alignItems: "flex-start",
      borderRadius: 2,
      gap: 2,
      minHeight: compact ? "auto" : undefined,
      px: 2,
      py: 2,
      "&:hover": disabled ? undefined : { bg: "neutral.subtle" },
    }}
  >
    <Checkbox checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <Box sx={{ display: "grid", gap: 1, minWidth: 0 }}>
      <FormControl.Label>{label}</FormControl.Label>
      {description ? <FormControl.Caption>{description}</FormControl.Caption> : null}
    </Box>
  </FormControl>
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
  <Box
    as="label"
    data-option-key={optionKey}
    sx={{
      display: "grid",
      gap: 2,
      borderRadius: 2,
      bg: checked ? "accent.subtle" : "transparent",
      px: 2,
      py: 2,
      "&:hover": { bg: checked ? "accent.subtle" : "neutral.subtle" },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, minWidth: 0 }}>
      <input
        id={inputId}
        name={name}
        aria-labelledby={`${inputId}-label`}
        type="radio"
        checked={checked}
        onChange={onChange}
      />
      <Box sx={{ display: "grid", gap: 1, minWidth: 0 }}>
        <Text id={`${inputId}-label`} sx={{ fontSize: 1, fontWeight: "semibold" }}>
          {label}
        </Text>
        {description ? (
          <Text sx={{ color: "fg.muted", fontSize: 0, lineHeight: "20px" }}>{description}</Text>
        ) : null}
      </Box>
    </Box>
    {children ? <Box sx={{ pl: 4 }}>{children}</Box> : null}
  </Box>
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
  <Box as="section" sx={{ display: "grid", gap: 3 }}>
    <Box
      sx={{
        display: "flex",
        flexDirection: ["column", "row"],
        gap: 2,
        justifyContent: "space-between",
        borderBottom: "1px solid",
        borderColor: "border.default",
        pb: 3,
      }}
    >
      <Box sx={{ display: "grid", gap: 1 }}>
        <Box as="h3" sx={{ fontSize: 3, fontWeight: "semibold", m: 0 }}>
          {title}
        </Box>
        <Text sx={{ color: "fg.muted", fontSize: 0, lineHeight: "20px" }}>{note}</Text>
      </Box>
    </Box>
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: ["1fr", null, null, "1fr 1fr"] }}>
      {children}
    </Box>
  </Box>
)

export const EmbeddedOptionPanel = ({ children }: { children: ReactNode }) => (
  <Box sx={panelSx}>{children}</Box>
)

export const OptionWideBox = ({ id, children }: { id?: string; children: ReactNode }) => (
  <Box id={id} sx={{ gridColumn: ["auto", null, null, "1 / -1"] }}>
    {children}
  </Box>
)
