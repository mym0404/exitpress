import { autocompletion } from "@codemirror/autocomplete"
import CodeMirror from "@uiw/react-codemirror"
import { useMemo } from "react"

import type {
  BlockTemplatePreset,
  TemplatePropDefinition,
} from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { ComponentPropsWithoutRef } from "react"

import { Badge } from "../../components/ui/Badge.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu.js"
import { cn } from "../../lib/Cn.js"

import {
  createTemplatePropCompletionSource,
  type TemplatePropCompletionSyntax,
} from "./TemplatePropAutocomplete.js"

const allTemplateEditorSurfaces = ["card", "embedded"] as const
type TemplateEditorSurface = (typeof allTemplateEditorSurfaces)[number]

export const TemplateEditorCard = ({
  title,
  badge,
  editorId,
  presetButtonId,
  presets = [],
  props,
  value,
  syntax = "dollar-brace",
  readOnly = false,
  minHeight = "9rem",
  surface = "card",
  onPresetApply,
  onTemplateChange,
  className,
  ...sectionProps
}: ComponentPropsWithoutRef<"section"> & {
  title: string
  badge?: string
  editorId: string
  presetButtonId?: string
  presets?: BlockTemplatePreset[]
  props: Record<string, TemplatePropDefinition>
  value: string
  syntax?: TemplatePropCompletionSyntax
  readOnly?: boolean
  minHeight?: string
  surface?: TemplateEditorSurface
  onPresetApply?: (template: string) => void
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
                    "grid min-w-0 grid-cols-[max-content_minmax(0,1fr)_max-content] items-center gap-3 px-3 py-2.5",
                    index > 0 && "border-t border-border",
                    index % 2 === 1 && "sm:border-l",
                    index === 1 && "sm:border-t-0",
                  )}
                  data-template-prop={key}
                >
                  <span className="whitespace-nowrap font-mono text-sm font-semibold text-[color:var(--status-ready-fg)]">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={readOnly && !onTemplateChange}>
                  <button
                    id={presetButtonId}
                    type="button"
                    className="inline-flex h-8 shrink-0 items-center rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-45"
                  >
                    프리셋
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {presets.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      onSelect={() => onPresetApply?.(preset.template)}
                    >
                      {preset.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
