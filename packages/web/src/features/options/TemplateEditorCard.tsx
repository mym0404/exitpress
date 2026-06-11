import { autocompletion } from "@codemirror/autocomplete"
import { javascript } from "@codemirror/lang-javascript"
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { EditorView } from "@codemirror/view"
import { githubDark } from "@uiw/codemirror-theme-github"
import CodeMirror from "@uiw/react-codemirror"
import { useMemo } from "react"

import type {
  BlockTemplatePreset,
  TemplatePropDefinition,
} from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { ComponentPropsWithoutRef } from "react"

import { Badge } from "../../components/ui/Badge.js"
import { Button } from "../../components/ui/Button.js"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/Dialog.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/DropdownMenu.js"
import { cn } from "../../lib/Cn.js"

import { createTemplatePropCompletionSource } from "./TemplatePropAutocomplete.js"

const allTemplateEditorSurfaces = ["card", "embedded"] as const
type TemplateEditorSurface = (typeof allTemplateEditorSurfaces)[number]
let lastTemplateEditorScroll: { x: number; y: number } | undefined
const restoreTemplateEditorScroll = () => {
  const scroll = lastTemplateEditorScroll

  if (!scroll) {
    return
  }

  if (window.scrollX !== scroll.x || window.scrollY !== scroll.y) {
    window.scrollTo(scroll.x, scroll.y)
  }
}
const templateEditorBaseExtensions = [
  githubDark,
  EditorView.lineWrapping,
  javascript({ typescript: true }),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  EditorView.theme(
    {
      ".cm-tooltip.cm-tooltip-autocomplete": {
        overflow: "hidden",
        padding: "0.25rem",
        border: "1px solid #30363d",
        borderRadius: "0.625rem",
        backgroundColor: "#161b22",
        boxShadow: "0 18px 48px rgba(0, 0, 0, 0.44), 0 0 0 1px rgba(255, 255, 255, 0.04)",
        color: "#c9d1d9",
        fontFamily: "var(--font-mono)",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul": {
        maxHeight: "14rem",
        minWidth: "13.5rem",
        padding: "0",
        scrollbarWidth: "thin",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
        display: "flex",
        alignItems: "baseline",
        gap: "0.625rem",
        minHeight: "2rem",
        padding: "0.375rem 0.625rem",
        borderRadius: "0.4375rem",
        color: "#c9d1d9",
        lineHeight: "1.35",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
        backgroundColor: "#263041",
        color: "#f0f6fc",
      },
      ".cm-tooltip.cm-tooltip-autocomplete .cm-completionIcon": {
        display: "none",
      },
      ".cm-tooltip.cm-tooltip-autocomplete .cm-completionLabel": {
        color: "inherit",
        fontSize: "0.8125rem",
        fontWeight: "650",
      },
      ".cm-tooltip.cm-tooltip-autocomplete .cm-completionMatchedText": {
        color: "#ff7bca",
        fontWeight: "800",
        textDecoration: "none",
      },
      ".cm-tooltip.cm-tooltip-autocomplete .cm-completionDetail": {
        marginLeft: "auto",
        color: "#8b949e",
        fontFamily: "var(--font-sans)",
        fontSize: "0.75rem",
        fontStyle: "normal",
      },
      ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionDetail": {
        color: "#c9d1d9",
      },
    },
    { dark: true },
  ),
  EditorView.domEventHandlers({
    click: (event, view) => {
      const target = event.target

      if (!(target instanceof Element) || !view.dom.contains(target)) {
        return false
      }

      lastTemplateEditorScroll ??= {
        x: window.scrollX,
        y: window.scrollY,
      }
      view.contentDOM.focus({ preventScroll: true })

      requestAnimationFrame(() => {
        view.contentDOM.focus({ preventScroll: true })
        restoreTemplateEditorScroll()
      })
      window.setTimeout(restoreTemplateEditorScroll, 0)
      window.setTimeout(restoreTemplateEditorScroll, 100)
      window.setTimeout(() => {
        restoreTemplateEditorScroll()
        lastTemplateEditorScroll = undefined
      }, 200)

      return false
    },
    mousedown: (event, view) => {
      const target = event.target

      if (!(target instanceof Element) || !view.dom.contains(target)) {
        return false
      }

      const scrollX = window.scrollX
      const scrollY = window.scrollY

      lastTemplateEditorScroll = { x: scrollX, y: scrollY }
      view.contentDOM.focus({ preventScroll: true })
      requestAnimationFrame(() => {
        restoreTemplateEditorScroll()
      })
      window.setTimeout(restoreTemplateEditorScroll, 0)
      window.setTimeout(restoreTemplateEditorScroll, 100)
      window.setTimeout(() => {
        restoreTemplateEditorScroll()
        lastTemplateEditorScroll = undefined
      }, 200)

      return false
    },
  }),
]

export const TemplateEditorCard = ({
  title,
  badge,
  editorId,
  presetButtonId,
  presets = [],
  props,
  value,
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
  readOnly?: boolean
  minHeight?: string
  surface?: TemplateEditorSurface
  onPresetApply?: (template: string) => void
  onTemplateChange?: (template: string) => void
}) => {
  const propEntries = Object.entries(props)
  const completionExtension = useMemo(
    () => autocompletion({ override: [createTemplatePropCompletionSource(props)] }),
    [props],
  )
  const layoutExtension = useMemo(
    () =>
      EditorView.theme({
        "&": { minHeight },
        ".cm-scroller": { minHeight },
        ".cm-content": { flexGrow: "1", minHeight },
      }),
    [minHeight],
  )
  const editorExtensions = useMemo(
    () => [...templateEditorBaseExtensions, completionExtension, layoutExtension],
    [completionExtension, layoutExtension],
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
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-[var(--radius-sm)] font-mono"
                    aria-label="템플릿 문법 도움말"
                  >
                    ?
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>템플릿 문법</DialogTitle>
                    <DialogDescription>
                      중괄호 두 개 안에 JavaScript와 비슷한 식을 입력합니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 text-sm leading-6 text-muted-foreground">
                    <div className="grid gap-2">
                      <span className="font-semibold text-foreground">기본</span>
                      <code className="code-surface break-all px-3 py-2 font-mono text-foreground">
                        {"{{ title }}"}
                      </code>
                      <code className="code-surface break-all px-3 py-2 font-mono text-foreground">
                        {"{{ `![${alt}](${url})` }}"}
                      </code>
                    </div>
                    <div className="grid gap-2">
                      <span className="font-semibold text-foreground">문자열</span>
                      <code className="code-surface break-all px-3 py-2 font-mono text-foreground">
                        {"{{ '{{}}' }}"}
                      </code>
                    </div>
                    {propEntries.length > 0 ? (
                      <div className="grid gap-2">
                        <span className="font-semibold text-foreground">자동완성</span>
                        <p>
                          <code className="font-mono text-foreground">{"{{ "}</code>
                          뒤에 변수 이름을 입력하면 사용할 수 있는 prop을 제안합니다.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {propEntries.map(([key, prop]) => (
                            <Badge key={key} variant="secondary" className="font-mono">
                              {key}: {prop.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>
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
          </div>
          <CodeMirror
            id={editorId}
            value={value}
            minHeight={minHeight}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
            }}
            theme="none"
            editable={!readOnly}
            readOnly={readOnly}
            extensions={editorExtensions}
            onChange={(nextValue) => onTemplateChange?.(nextValue)}
          />
        </div>
      </div>
    </section>
  )
}
