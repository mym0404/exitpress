import { autocompletion } from "@codemirror/autocomplete"
import CodeMirror from "@uiw/react-codemirror"
import { useMemo } from "react"

import type { BlockTemplateDefinition } from "@exitpress/domain/template/Types.js"

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

import { createTemplatePropCompletionSource } from "./TemplatePropAutocomplete.js"

const customPresetValue = "__custom__"

const toBlockTemplateControlId = (key: string) => key.replace(/[^A-Za-z0-9_-]/g, "-")

const getDefaultTemplate = (definition: BlockTemplateDefinition) =>
  definition.presets[0]?.template ?? ""

const getSelectedPresetId = ({
  definition,
  template,
}: {
  definition: BlockTemplateDefinition
  template: string
}) => definition.presets.find((preset) => preset.template === template)?.id

export const getEffectiveBlockTemplate = ({
  definition,
  template,
}: {
  definition: BlockTemplateDefinition
  template?: string
}) => template || getDefaultTemplate(definition)

export const BlockTemplateCard = ({
  definition,
  template,
  readOnly = false,
  onTemplateChange,
}: {
  definition: BlockTemplateDefinition
  template?: string
  readOnly?: boolean
  onTemplateChange?: (template: string) => void
}) => {
  const controlId = toBlockTemplateControlId(definition.key)
  const effectiveTemplate = getEffectiveBlockTemplate({ definition, template })
  const selectedPresetId =
    getSelectedPresetId({ definition, template: effectiveTemplate }) ?? customPresetValue
  const propEntries = Object.entries(definition.props)
  const completionExtension = useMemo(
    () => autocompletion({ override: [createTemplatePropCompletionSource(definition.props)] }),
    [definition.props],
  )

  if (!definition.presets[0]) {
    return null
  }

  const selectPreset = (presetId: string) => {
    const preset = definition.presets.find((candidate) => candidate.id === presetId)

    if (preset) {
      onTemplateChange?.(preset.template)
    }
  }

  return (
    <section
      className="grid content-start overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--panel-shadow-border)]"
      data-block-template-card={definition.key}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
        <h4 className="min-w-0 truncate text-base font-semibold tracking-[-0.03em] text-foreground">
          {definition.label}
        </h4>
        <Badge variant="outline" className="shrink-0 font-mono">
          {definition.key}
        </Badge>
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
            <Select
              value={selectedPresetId === customPresetValue ? undefined : selectedPresetId}
              onValueChange={selectPreset}
              disabled={readOnly && !onTemplateChange}
            >
              <SelectTrigger
                id={`block-template-preset-${controlId}`}
                size="sm"
                aria-label="Preset"
                className="h-8 w-40"
              >
                <SelectValue placeholder="Custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {definition.presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <CodeMirror
            id={`block-template-editor-${controlId}`}
            value={effectiveTemplate}
            minHeight="9rem"
            basicSetup={{
              foldGutter: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
            }}
            theme="dark"
            editable={!readOnly}
            readOnly={readOnly}
            extensions={[completionExtension]}
            onChange={(value) => onTemplateChange?.(value)}
          />
        </div>
      </div>
    </section>
  )
}
