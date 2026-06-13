import { RiArrowDownSLine } from "@remixicon/react"
import { useEffect, useMemo, useState } from "react"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"
import type { ReactNode } from "react"

import type { StorybookStory } from "./schema/Storybook.js"

import { PrimerAppProvider } from "../../app/PrimerAppProvider.js"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/Accordion.js"
import { Badge } from "../../components/ui/Badge.js"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js"
import { ScrollArea } from "../../components/ui/ScrollArea.js"
import { createAppHref, shouldShowStorybookBackLink } from "../../lib/AppRoutes.js"
import { cn } from "../../lib/Cn.js"
import { useThemePreference } from "../common/hooks/UseThemePreference.js"
import { WizardHeader } from "../common/shell/WizardHeader.js"
import { BlockTemplateCard, getEffectiveBlockTemplate } from "../options/BlockTemplateCard.js"

import { storybookCatalog } from "./StorybookCatalog.js"

const getInitialStoryKey = () => {
  const hashKey = window.location.hash.replace(/^#/, "")
  const firstStory = storybookCatalog[0]?.stories[0]

  return storybookCatalog.some((group) => group.stories.some((story) => story.storyKey === hashKey))
    ? hashKey
    : (firstStory?.storyKey ?? "")
}

const getStoryCount = () =>
  storybookCatalog.reduce((count, group) => count + group.stories.length, 0)

const findStory = (storyKey: string) =>
  storybookCatalog.flatMap((group) => group.stories).find((story) => story.storyKey === storyKey)

const formatHtmlForDisplay = (html: string) => {
  const lines: string[] = []
  let depth = 0

  html
    .replace(/>\s+</g, ">\n<")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const isClosingTag = line.startsWith("</")
      const isSelfClosingTag = line.endsWith("/>") || /^<(br|hr|img|input|meta|link)\b/i.test(line)

      if (isClosingTag) {
        depth = Math.max(0, depth - 1)
      }

      lines.push(`${"  ".repeat(depth)}${line}`)

      if (!isClosingTag && !isSelfClosingTag && /^<[^!?/][^>]*>$/.test(line)) {
        depth += 1
      }
    })

  return lines.join("\n")
}

const codeBlockClassName =
  "min-w-0 max-h-[520px] overflow-auto p-4 font-mono text-[0.75rem] leading-5 text-foreground"

const htmlTokenClassNames = {
  bracket: "text-muted-foreground",
  tag: "text-[color:var(--status-ready-fg)]",
  attribute: "text-[color:var(--status-running-fg)]",
  operator: "text-muted-foreground",
  value: "text-[color:var(--status-success-fg)]",
  comment: "text-muted-foreground",
  text: "text-foreground",
} as const

const markdownTokenClassNames = {
  marker: "text-[color:var(--status-running-fg)]",
  fence: "text-[color:var(--status-ready-fg)]",
  link: "text-[color:var(--status-success-fg)]",
  code: "text-[color:var(--status-ready-fg)]",
  text: "text-foreground",
} as const

const renderToken = (
  key: string,
  tokenType: keyof typeof htmlTokenClassNames | keyof typeof markdownTokenClassNames,

  children: string,
) => {
  const className =
    tokenType in htmlTokenClassNames
      ? htmlTokenClassNames[tokenType as keyof typeof htmlTokenClassNames]
      : markdownTokenClassNames[tokenType as keyof typeof markdownTokenClassNames]

  return (
    <span key={key} data-storybook-token={tokenType} className={className}>
      {children}
    </span>
  )
}

const renderHtmlTag = (tag: string, tokenKey: string): ReactNode[] => {
  const tagNameMatch = tag.match(/^<\/?\s*([A-Za-z][\w:.-]*)/)

  if (!tagNameMatch) {
    return [renderToken(`${tokenKey}-tag`, "text", tag)]
  }

  const tagName = tagNameMatch[1]
  const tagNameStart = tag.indexOf(tagName)
  const tagNameEnd = tagNameStart + tagName.length
  const nodes: ReactNode[] = [
    renderToken(`${tokenKey}-open`, "bracket", tag.slice(0, tagNameStart)),
    renderToken(`${tokenKey}-name`, "tag", tagName),
  ]
  const attributeSource = tag.slice(tagNameEnd, -1)
  const attributePattern = /([^\s=<>"'`]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/g
  let cursor = 0
  let attributeMatch: RegExpExecArray | null

  while ((attributeMatch = attributePattern.exec(attributeSource)) !== null) {
    const [source, name, operator, value] = attributeMatch

    if (attributeMatch.index > cursor) {
      nodes.push(
        renderToken(
          `${tokenKey}-between-${cursor}`,
          "bracket",
          attributeSource.slice(cursor, attributeMatch.index),
        ),
      )
    }

    nodes.push(renderToken(`${tokenKey}-attr-${attributeMatch.index}`, "attribute", name))
    nodes.push(renderToken(`${tokenKey}-operator-${attributeMatch.index}`, "operator", operator))
    nodes.push(renderToken(`${tokenKey}-value-${attributeMatch.index}`, "value", value))
    cursor = attributeMatch.index + source.length
  }

  if (cursor < attributeSource.length) {
    nodes.push(renderToken(`${tokenKey}-tail`, "bracket", attributeSource.slice(cursor)))
  }

  nodes.push(renderToken(`${tokenKey}-close`, "bracket", tag.slice(-1)))

  return nodes
}

const highlightHtml = (html: string): ReactNode[] =>
  html.split(/(<[^>]+>)/g).reduce<ReactNode[]>((nodes, part, index) => {
    if (!part) {
      return nodes
    }

    if (part.startsWith("<!--")) {
      nodes.push(renderToken(`html-comment-${index}`, "comment", part))
      return nodes
    }

    if (part.startsWith("<")) {
      nodes.push(...renderHtmlTag(part, `html-tag-${index}`))
      return nodes
    }

    nodes.push(renderToken(`html-text-${index}`, "text", part))
    return nodes
  }, [])

const highlightMarkdownLine = (line: string, lineIndex: number): ReactNode[] => {
  if (/^\s*```/.test(line)) {
    return [renderToken(`md-${lineIndex}-fence`, "fence", line)]
  }

  const nodes: ReactNode[] = []
  const markerMatch = line.match(/^(\s*(?:#{1,6}|>|[-*+]|\d+[.)])\s+)/)
  let cursor = 0

  if (markerMatch) {
    nodes.push(renderToken(`md-${lineIndex}-marker`, "marker", markerMatch[1]))
    cursor = markerMatch[1].length
  }

  const inlinePattern = /(!?\[[^\]]+\]\([^)]+\)|`[^`]+`)/g
  inlinePattern.lastIndex = cursor
  let inlineMatch: RegExpExecArray | null

  while ((inlineMatch = inlinePattern.exec(line)) !== null) {
    if (inlineMatch.index > cursor) {
      nodes.push(
        renderToken(
          `md-${lineIndex}-text-${cursor}`,
          "text",
          line.slice(cursor, inlineMatch.index),
        ),
      )
    }

    nodes.push(
      renderToken(
        `md-${lineIndex}-inline-${inlineMatch.index}`,
        inlineMatch[0].startsWith("`") ? "code" : "link",
        inlineMatch[0],
      ),
    )
    cursor = inlineMatch.index + inlineMatch[0].length
  }

  if (cursor < line.length) {
    nodes.push(renderToken(`md-${lineIndex}-text-tail`, "text", line.slice(cursor)))
  }

  return nodes.length > 0 ? nodes : [renderToken(`md-${lineIndex}-empty`, "text", line)]
}

const highlightMarkdown = (markdown: string): ReactNode[] =>
  markdown.split("\n").reduce<ReactNode[]>((nodes, line, index, lines) => {
    nodes.push(...highlightMarkdownLine(line, index))

    if (index < lines.length - 1) {
      nodes.push("\n")
    }

    return nodes
  }, [])

const StoryTreeBlock = ({
  story,
  active,
  onSelect,
}: {
  story: StorybookStory
  active: boolean
  onSelect: (storyKey: string) => void
}) => (
  <button
    type="button"
    role="treeitem"
    aria-selected={active}
    data-storybook-block={story.storyKey}
    className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:shadow-[var(--focus-ring)] aria-selected:bg-primary aria-selected:text-primary-foreground"
    onClick={() => onSelect(story.storyKey)}
  >
    <span className="text-xs tabular-nums opacity-70">{story.blockIndex + 1}</span>
    <span className="min-w-0 truncate">{story.blockLabel}</span>
  </button>
)

const StoryTree = ({
  activeStoryKey,
  onSelect,
}: {
  activeStoryKey: string
  onSelect: (storyKey: string) => void
}) => {
  const activeEditorType =
    storybookCatalog.find((group) =>
      group.stories.some((story) => story.storyKey === activeStoryKey),
    )?.editorType ?? storybookCatalog[0]?.editorType
  const [openEditorTypes, setOpenEditorTypes] = useState<string[]>(
    activeEditorType ? [activeEditorType] : [],
  )

  useEffect(() => {
    if (!activeEditorType) {
      return
    }

    setOpenEditorTypes((current) =>
      current.includes(activeEditorType) ? current : [...current, activeEditorType],
    )
  }, [activeEditorType])

  return (
    <Card
      variant="panel"
      data-storybook-tree
      className="grid max-h-[min(44rem,calc(100vh-14rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:sticky lg:top-5"
    >
      <CardHeader className="border-b border-border p-4">
        <CardTitle className="text-base">블록 목록</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 p-0">
        <ScrollArea className="h-full">
          <Accordion
            type="multiple"
            value={openEditorTypes}
            onValueChange={setOpenEditorTypes}
            role="tree"
            aria-label="Storybook 블록 목록"
            className="grid gap-3 p-3"
          >
            {storybookCatalog.map((group) => (
              <AccordionItem
                key={group.editorType}
                value={group.editorType}
                className="grid gap-2"
                data-storybook-editor
              >
                <AccordionTrigger
                  role="treeitem"
                  className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:shadow-[var(--focus-ring)] data-[state=open]:bg-muted"
                >
                  <span>{group.editorLabel}</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <span>{group.stories.length}</span>
                    <RiArrowDownSLine
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0 transition-transform",
                        openEditorTypes.includes(group.editorType) && "rotate-180",
                      )}
                    />
                  </span>
                </AccordionTrigger>
                <AccordionContent
                  forceMount
                  role="group"
                  className="grid gap-1 data-[state=closed]:hidden"
                >
                  {group.stories.map((story) => (
                    <StoryTreeBlock
                      key={story.storyKey}
                      story={story}
                      active={story.storyKey === activeStoryKey}
                      onSelect={onSelect}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

const allStorybookCodeTypes = ["html", "markdown"] as const
type StorybookCodeType = (typeof allStorybookCodeTypes)[number]

const CodePanel = ({
  title,
  children,
  codeType,
  compact = false,
}: {
  title: string
  children: string
  codeType: StorybookCodeType
  compact?: boolean
}) => (
  <Card variant="panel" className="overflow-hidden">
    <CardHeader className="border-b border-border p-4">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <pre
        className={cn(
          codeBlockClassName,
          codeType === "html" ? "whitespace-pre" : "whitespace-pre-wrap",
          compact ? "text-[0.6875rem] leading-5" : "text-[0.75rem] leading-5",
        )}
        data-storybook-code={codeType}
      >
        {codeType === "html" ? highlightHtml(children) : highlightMarkdown(children)}
      </pre>
    </CardContent>
  </Card>
)

const StoryTemplateCard = ({ story }: { story: StorybookStory }) => {
  const [template, setTemplate] = useState("")

  useEffect(() => {
    setTemplate("")
  }, [story.storyKey])

  return (
    <BlockTemplateCard
      key={story.storyKey}
      definition={story.templateDefinition}
      template={getEffectiveBlockTemplate({
        definition: story.templateDefinition,
        template,
      })}
      readOnly
      onTemplateChange={setTemplate}
    />
  )
}

const StoryPreview = ({ story }: { story: StorybookStory }) => {
  return (
    <section className="grid gap-4" data-active-storybook-story={story.storyKey}>
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label="선택된 Storybook 항목"
        data-storybook-summary="true"
      >
        <Badge variant="secondary" className="px-3 py-1 text-sm">
          {story.blockLabel}
        </Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm">
          {story.editorLabel} / {story.blockId}
        </Badge>
      </div>

      <StoryTemplateCard story={story} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <CodePanel title="입력 HTML" codeType="html" compact>
          {formatHtmlForDisplay(story.inputHtml)}
        </CodePanel>
        <Card variant="panel" className="overflow-hidden">
          <CardHeader className="border-b border-border p-4">
            <CardTitle className="text-base">원본 캡처</CardTitle>
          </CardHeader>
          <CardContent className="grid place-items-center bg-muted p-4">
            <img
              src={story.screenshotSrc}
              alt={`${story.blockLabel} 원본 캡처`}
              className="max-h-[420px] max-w-full rounded-[var(--radius-md)] border border-border bg-card object-contain shadow-[var(--panel-shadow-border)]"
            />
          </CardContent>
        </Card>
      </div>

      <Card variant="panel" className="overflow-hidden">
        <CardHeader className="border-b border-border p-4">
          <CardTitle className="text-base">Markdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <pre className={codeBlockClassName} data-storybook-markdown>
            {highlightMarkdown(story.markdown)}
          </pre>
        </CardContent>
      </Card>
    </section>
  )
}

export const StorybookPage = () => {
  const [themePreference, setThemePreference] = useState<ThemePreference>("dark")
  const [activeStoryKey, setActiveStoryKey] = useState(getInitialStoryKey)
  const activeStory = useMemo(() => findStory(activeStoryKey), [activeStoryKey])
  useThemePreference(themePreference)
  const backLink = shouldShowStorybookBackLink(import.meta.env.BASE_URL)
    ? {
        href: createAppHref({
          pathname: "/",
          basePath: import.meta.env.BASE_URL,
        }),
        label: "뒤로",
      }
    : undefined
  const summaryCards = useMemo(
    () => [
      { label: "편집기", value: String(storybookCatalog.length) },
      { label: "블록", value: String(getStoryCount()) },
    ],
    [],
  )

  useEffect(() => {
    const handleHashChange = () => {
      setActiveStoryKey(getInitialStoryKey())
    }

    window.addEventListener("hashchange", handleHashChange)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  const selectStory = (storyKey: string) => {
    setActiveStoryKey(storyKey)
    window.history.replaceState(null, "", `#${storyKey}`)
  }

  if (!activeStory) {
    return null
  }

  return (
    <PrimerAppProvider themePreference={themePreference}>
      <main
        className={`dashboard-shell relative min-h-screen w-full overflow-x-clip ${themePreference}`}
      >
        <div
          id="dashboard-backdrop"
          className="shell-backdrop pointer-events-none fixed inset-0 -z-10"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 xl:px-6 xl:py-6">
          <WizardHeader
            title="Storybook"
            description="지원 중인 블록의 입력 HTML, 원본 캡처, Markdown 출력을 비교합니다."
            themePreference={themePreference}
            headerStatus="ready"
            summaryCards={summaryCards}
            backLink={backLink}
            onThemeChange={setThemePreference}
          />
          <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]" data-storybook-layout>
            <StoryTree activeStoryKey={activeStory.storyKey} onSelect={selectStory} />
            <StoryPreview story={activeStory} />
          </div>
        </div>
      </main>
    </PrimerAppProvider>
  )
}
