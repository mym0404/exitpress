import { RiArrowDownSLine } from "@remixicon/react"
import { useEffect, useMemo, useState } from "react"

import type { ReactNode } from "react"

import type { ThemePreference } from "../../../domain/preferences/ThemePreference.js"

import type { ParserStory } from "./ParserStoryCatalog.js"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/Accordion.js"
import { Badge } from "../../components/ui/Badge.js"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card.js"
import { ScrollArea } from "../../components/ui/ScrollArea.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/Tabs.js"
import { createAppHref, shouldShowStorybookBackLink } from "../../lib/AppRoutes.js"
import { cn } from "../../lib/Cn.js"
import { useThemePreference } from "../common/hooks/UseThemePreference.js"
import { WizardHeader } from "../common/shell/WizardHeader.js"

import { parserStoryCatalog } from "./ParserStoryCatalog.js"

const getInitialStoryKey = () => {
  const hashKey = window.location.hash.replace(/^#/, "")
  const firstStory = parserStoryCatalog[0]?.stories[0]

  return parserStoryCatalog.some((group) =>
    group.stories.some((story) => story.storyKey === hashKey),
  )
    ? hashKey
    : (firstStory?.storyKey ?? "")
}

const getStoryCount = () =>
  parserStoryCatalog.reduce((count, group) => count + group.stories.length, 0)

const findStory = (storyKey: string) =>
  parserStoryCatalog.flatMap((group) => group.stories).find((story) => story.storyKey === storyKey)

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
  "min-w-0 max-h-[520px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[0.75rem] leading-5 text-foreground"

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
    <span key={key} data-parser-token={tokenType} className={className}>
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
  story: ParserStory
  active: boolean
  onSelect: (storyKey: string) => void
}) => (
  <button
    type="button"
    role="treeitem"
    aria-selected={active}
    data-parser-story-block={story.storyKey}
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
    parserStoryCatalog.find((group) =>
      group.stories.some((story) => story.storyKey === activeStoryKey),
    )?.editorType ?? parserStoryCatalog[0]?.editorType
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
      data-parser-story-tree
      className="overflow-hidden lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)]"
    >
      <CardHeader className="border-b border-border p-4">
        <CardTitle className="text-base">Blocks</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[18rem] lg:h-[min(72vh,760px)]">
          <Accordion
            type="multiple"
            value={openEditorTypes}
            onValueChange={setOpenEditorTypes}
            role="tree"
            aria-label="Parser block stories"
            className="grid gap-3 p-3"
          >
            {parserStoryCatalog.map((group) => (
              <AccordionItem
                key={group.editorType}
                value={group.editorType}
                className="grid gap-2"
                data-parser-story-editor
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

const CodePanel = ({
  title,
  children,
  codeType,
  compact = false,
}: {
  title: string
  children: string
  codeType: "html" | "markdown"
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
          compact ? "text-[0.6875rem] leading-5" : "text-[0.75rem] leading-5",
        )}
        data-parser-story-code={codeType}
      >
        {codeType === "html" ? highlightHtml(children) : highlightMarkdown(children)}
      </pre>
    </CardContent>
  </Card>
)

const StoryPreview = ({ story }: { story: ParserStory }) => {
  const defaultVariant =
    story.markdownVariants.find((variant) => variant.isDefault) ?? story.markdownVariants[0]
  const defaultVariantKey = defaultVariant?.label ?? "기본"

  return (
    <section className="grid gap-4" data-active-parser-story={story.storyKey}>
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label="선택된 parser story"
        data-parser-story-summary="true"
      >
        <Badge variant="secondary" className="px-3 py-1 text-sm">
          {story.blockLabel}
        </Badge>
        <Badge variant="outline" className="px-3 py-1 text-sm">
          {story.editorLabel} / {story.blockId}
        </Badge>
        <Badge variant={story.group === "auxiliary" ? "idle" : "running"} className="px-3 py-1">
          {story.group === "auxiliary" ? "Auxiliary" : "Output"}
        </Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <CodePanel title="Input HTML" codeType="html" compact>
          {formatHtmlForDisplay(story.inputHtml)}
        </CodePanel>
        <Card variant="panel" className="overflow-hidden">
          <CardHeader className="border-b border-border p-4">
            <CardTitle className="text-base">Naver Capture</CardTitle>
          </CardHeader>
          <CardContent className="grid place-items-center bg-muted p-4">
            <img
              src={story.screenshotSrc}
              alt={`${story.blockLabel} Naver capture`}
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
          {story.markdownVariants.length > 1 ? (
            <Tabs defaultValue={defaultVariantKey}>
              <TabsList className="mx-4 mt-4 inline-flex !w-fit max-w-[calc(100%-2rem)] flex-nowrap overflow-x-auto group-data-[orientation=horizontal]/tabs:!w-fit">
                {story.markdownVariants.map((variant) => (
                  <TabsTrigger
                    key={variant.label}
                    value={variant.label}
                    className="!w-auto shrink-0 group-data-[orientation=horizontal]/tabs:!w-auto"
                  >
                    {variant.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {story.markdownVariants.map((variant) => (
                <TabsContent key={variant.label} value={variant.label}>
                  <pre className={codeBlockClassName} data-parser-story-markdown>
                    {highlightMarkdown(variant.markdown)}
                  </pre>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <pre className={codeBlockClassName} data-parser-story-markdown>
              {highlightMarkdown(story.markdownVariants[0]?.markdown ?? "")}
            </pre>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export const ParserStorybookPage = () => {
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
        label: "Back",
      }
    : undefined
  const summaryCards = useMemo(
    () => [
      { label: "Editors", value: String(parserStoryCatalog.length) },
      { label: "Blocks", value: String(getStoryCount()) },
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
          title="Parser Storybook"
          description="지원 중인 Naver Blog parser block의 입력 HTML, 원본 캡처, Markdown 출력을 비교합니다."
          themePreference={themePreference}
          headerStatus="ready"
          summaryCards={summaryCards}
          backLink={backLink}
          onThemeChange={setThemePreference}
        />
        <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]" data-parser-story-layout>
          <StoryTree activeStoryKey={activeStory.storyKey} onSelect={selectStory} />
          <StoryPreview story={activeStory} />
        </div>
      </div>
    </main>
  )
}
