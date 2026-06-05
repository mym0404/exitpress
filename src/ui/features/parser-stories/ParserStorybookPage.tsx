import { RiArrowDownSLine } from "@remixicon/react"
import { useEffect, useMemo, useState } from "react"

import type { ThemePreference } from "../../../domain/preferences/ThemePreference.js"

import type { ParserStory } from "./ParserStoryCatalog.js"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/Accordion.js"
import { Badge } from "../../components/ui/Badge.js"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card.js"
import { ScrollArea } from "../../components/ui/ScrollArea.js"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/Tabs.js"
import { cn } from "../../lib/Cn.js"
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

const CodePanel = ({ title, children }: { title: string; children: string }) => (
  <Card variant="panel" className="overflow-hidden">
    <CardHeader className="border-b border-border p-4">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <pre className="code-surface max-h-[420px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[0.8125rem] leading-6 text-foreground">
        {children}
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
        <CodePanel title="Input HTML">{story.inputHtml}</CodePanel>
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
        <CardContent className="p-4">
          {story.markdownVariants.length > 1 ? (
            <Tabs defaultValue={defaultVariantKey}>
              <TabsList className="mb-3 inline-flex !w-fit max-w-full flex-nowrap overflow-x-auto group-data-[orientation=horizontal]/tabs:!w-fit">
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
                  <pre
                    className="code-surface max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] p-4 font-mono text-[0.8125rem] leading-6 text-foreground"
                    data-parser-story-markdown
                  >
                    {variant.markdown}
                  </pre>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <pre
              className="code-surface max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] p-4 font-mono text-[0.8125rem] leading-6 text-foreground"
              data-parser-story-markdown
            >
              {story.markdownVariants[0]?.markdown ?? ""}
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
          backLink={{ href: "/", label: "Back" }}
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
