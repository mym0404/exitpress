import { autocompletion } from "@codemirror/autocomplete"
import CodeMirror from "@uiw/react-codemirror"
import { useMemo } from "react"

import type { TemplatePropDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { ComponentPropsWithoutRef } from "react"

import { Badge } from "../../components/ui/Badge.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select.js"
import { cn } from "../../lib/Cn.js"

import {
  createTemplatePropCompletionSource,
  type TemplatePropCompletionSyntax,
} from "./TemplatePropAutocomplete.js"

const customPresetValue = "__custom__"
const allTemplateEditorSurfaces = ["card", "embedded"] as const
type TemplateEditorSurface = (typeof allTemplateEditorSurfaces)[number]

type TemplateEditorPreset = {
  id: string
  label: string
  template: string
}

export const TemplateEditorCard = ({
  title,
  badge,
  editorId,
  presetId,
  presetSelectId,
  presets = [],
  props,
  value,
  syntax = "dollar-brace",
  readOnly = false,
  minHeight = "9rem",
  surface = "card",
  onPresetChange,
  onTemplateChange,
  className,
  ...sectionProps
}: ComponentPropsWithoutRef<"section"> & {
  title: string
  badge?: string
  editorId: string
  presetId?: string
  presetSelectId?: string
  presets?: TemplateEditorPreset[]
  props: Record<string, TemplatePropDefinition>
  value: string
  syntax?: TemplatePropCompletionSyntax
  readOnly?: boolean
  minHeight?: string
  surface?: TemplateEditorSurface
  onPresetChange?: (presetId: string) => void
  onTemplateChange?: (template: string) => void
}) => {
  const propEntries = Object.entries(props)
  const completionExtension = useMemo(
    () => autocompletion({ override: [createTemplatePropCompletionSource(props, { syntax })] }),
    [props, syntax],
  )

  return (
    <section
      className={cn(
        "grid content-start overflow-hidden border border-border",
        surface === "card"
          ? "rounded-[var(--radius-lg)] bg-card shadow-[var(--panel-shadow-border)]"
          : "rounded-xl bg-muted/20",
        className,
      )}
      {...sectionProps}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
        <h4 className="min-w-0 truncate text-base font-semibold tracking-[-0.03em] text-foreground">
          {title}
        </h4>
        {badge ? (
          <Badge variant="outline" className="shrink-0 font-mono">
            {badge}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 p-4">
        {propEntries.length > 0 ? (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-border">
            <div className="border-b border-border px-3 py-2 text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground">
              PROP
            </div>
            <div className="grid gap-0 sm:grid-cols-2" data-template-prop-grid>
              {propEntries.map(([key, prop], index) => (
                <div
                  key={key}
                  className={cn(
                    "grid min-w-0 grid-cols-[minmax(5rem,0.6fr)_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5",
                    index > 0 && "border-t border-border",
                    index % 2 === 1 && "sm:border-l",
                    index === 1 && "sm:border-t-0",
                  )}
                  data-template-prop={key}
                >
                  <span className="min-w-0 truncate font-mono text-sm font-semibold text-[color:var(--status-ready-fg)]">
                    {key}
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {prop.label}
                  </span>
                  <Badge variant="secondary" className="shrink-0 font-mono">
                    {prop.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-background"
          data-template-code-section
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <span className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground">
              CODE
            </span>
            {presets.length > 0 ? (
              <Select
                value={presetId === customPresetValue ? undefined : presetId}
                onValueChange={(nextPresetId) => onPresetChange?.(nextPresetId)}
                disabled={readOnly && !onTemplateChange}
              >
                <SelectTrigger
                  id={presetSelectId}
                  size="sm"
                  aria-label="Preset"
                  className="h-8 w-40"
                >
                  <SelectValue placeholder="Custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : null}
          </div>
          <CodeMirror
            className="template-code-editor"
            id={editorId}
            value={value}
            minHeight={minHeight}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
            }}
            theme="dark"
            editable={!readOnly}
            readOnly={readOnly}
            extensions={[completionExtension]}
            onChange={(nextValue) => onTemplateChange?.(nextValue)}
          />
        </div>
      </div>
    </section>
  )
}

export const getCustomTemplatePresetValue = () => customPresetValue
