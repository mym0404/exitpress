import { ChevronDownIcon } from "@primer/octicons-react"
import { Box, FormControl, Label, Select, Text } from "@primer/react"
import { useEffect, useMemo, useState } from "react"

import type { ThemePreference } from "@exitpress/domain/preferences/schema/ThemePreference.js"
import type { ReactNode } from "react"

import type { StorybookStory } from "./schema/Storybook.js"

import { PrimerAppProvider } from "../../app/PrimerAppProvider.js"
import { createAppHref, shouldShowStorybookBackLink } from "../../lib/AppRoutes.js"
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

const htmlTokenSx = {
  bracket: { color: "fg.muted" },
  tag: { color: "success.fg" },
  attribute: { color: "accent.fg" },
  operator: { color: "fg.muted" },
  value: { color: "done.fg" },
  comment: { color: "fg.muted" },
  text: { color: "fg.default" },
} as const

const markdownTokenSx = {
  marker: { color: "accent.fg" },
  fence: { color: "success.fg" },
  link: { color: "done.fg" },
  code: { color: "success.fg" },
  text: { color: "fg.default" },
} as const

const renderToken = (
  key: string,
  tokenType: keyof typeof htmlTokenSx | keyof typeof markdownTokenSx,
  children: string,
) => {
  const sx =
    tokenType in htmlTokenSx
      ? htmlTokenSx[tokenType as keyof typeof htmlTokenSx]
      : markdownTokenSx[tokenType as keyof typeof markdownTokenSx]

  return (
    <Box key={key} as="span" data-storybook-token={tokenType} sx={sx}>
      {children}
    </Box>
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

const panelSx = {
  border: "1px solid",
  borderColor: "border.default",
  borderRadius: 2,
  bg: "canvas.default",
  overflow: "hidden",
} as const

const codeBlockSx = ({
  codeType,
  compact,
}: {
  codeType: StorybookCodeType
  compact?: boolean
}) => ({
  m: 0,
  minWidth: 0,
  maxHeight: "520px",
  overflowX: "auto",
  overflowY: "auto",
  overscrollBehaviorX: "contain",
  p: 3,
  color: "fg.default",
  fontFamily: "mono",
  fontSize: compact ? "11px" : "12px",
  lineHeight: "20px",
  whiteSpace: codeType === "html" ? "pre" : "pre-wrap",
})

const StoryTreeBlock = ({
  story,
  active,
  onSelect,
}: {
  story: StorybookStory
  active: boolean
  onSelect: (storyKey: string) => void
}) => (
  <Box
    as="button"
    type="button"
    role="treeitem"
    tabIndex={0}
    aria-selected={active}
    data-storybook-block={story.storyKey}
    sx={{
      display: "grid",
      width: "100%",
      gridTemplateColumns: "auto minmax(0, 1fr)",
      alignItems: "center",
      gap: 2,
      border: 0,
      borderRadius: 2,
      bg: active ? "accent.emphasis" : "transparent",
      color: active ? "fg.onEmphasis" : "fg.default",
      px: 2,
      py: 2,
      font: "inherit",
      fontSize: 1,
      textAlign: "left",
      cursor: "pointer",
      "&:hover": {
        bg: active ? "accent.emphasis" : "canvas.subtle",
      },
      "&:focus-visible": {
        outline: "2px solid",
        outlineColor: "accent.fg",
        outlineOffset: "2px",
      },
    }}
    onClick={() => onSelect(story.storyKey)}
  >
    <Text sx={{ fontSize: 0, fontVariantNumeric: "tabular-nums", opacity: 0.72 }}>
      {story.blockIndex + 1}
    </Text>
    <Text sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {story.blockLabel}
    </Text>
  </Box>
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

  const toggleEditorType = (editorType: string) => {
    setOpenEditorTypes((current) =>
      current.includes(editorType)
        ? current.filter((currentEditorType) => currentEditorType !== editorType)
        : [...current, editorType],
    )
  }

  return (
    <Box
      data-storybook-tree
      sx={{
        ...panelSx,
        display: "grid",
        maxHeight: "min(44rem, calc(100vh - 14rem))",
        gridTemplateRows: "auto minmax(0, 1fr)",
        "@media (min-width: 1012px)": { position: "sticky", top: 4 },
      }}
    >
      <Box sx={{ borderBottom: "1px solid", borderColor: "border.default", p: 3 }}>
        <Text sx={{ color: "fg.default", fontSize: 2, fontWeight: 600 }}>블록 목록</Text>
      </Box>
      <Box sx={{ minHeight: 0, overflow: "auto", p: 3 }}>
        <Box role="tree" aria-label="Storybook 블록 목록" sx={{ display: "grid", gap: 3 }}>
          {storybookCatalog.map((group) => {
            const open = openEditorTypes.includes(group.editorType)

            return (
              <Box key={group.editorType} data-storybook-editor sx={{ display: "grid", gap: 2 }}>
                <Box
                  as="button"
                  type="button"
                  role="treeitem"
                  tabIndex={0}
                  aria-expanded={open}
                  sx={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    border: 0,
                    borderRadius: 2,
                    bg: open ? "canvas.subtle" : "transparent",
                    color: "fg.default",
                    px: 3,
                    py: 2,
                    font: "inherit",
                    fontSize: 1,
                    fontWeight: 600,
                    textAlign: "left",
                    cursor: "pointer",
                    "&:hover": { bg: "canvas.subtle" },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "accent.fg",
                      outlineOffset: "2px",
                    },
                  }}
                  onClick={() => toggleEditorType(group.editorType)}
                >
                  <Text>{group.editorLabel}</Text>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "fg.muted" }}>
                    <Text sx={{ fontSize: 0, fontWeight: 600 }}>{group.stories.length}</Text>
                    <Box
                      as="span"
                      sx={{
                        display: "inline-flex",
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 120ms ease",
                      }}
                    >
                      <ChevronDownIcon aria-hidden="true" />
                    </Box>
                  </Box>
                </Box>
                {open ? (
                  <Box role="group" sx={{ display: "grid", gap: 1 }}>
                    {group.stories.map((story) => (
                      <StoryTreeBlock
                        key={story.storyKey}
                        story={story}
                        active={story.storyKey === activeStoryKey}
                        onSelect={onSelect}
                      />
                    ))}
                  </Box>
                ) : null}
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
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
  <Box sx={panelSx}>
    <Box sx={{ borderBottom: "1px solid", borderColor: "border.default", p: 3 }}>
      <Text sx={{ color: "fg.default", fontSize: 2, fontWeight: 600 }}>{title}</Text>
    </Box>
    <Box
      as="pre"
      aria-label={`${title} 코드`}
      data-storybook-code={codeType}
      tabIndex={0}
      sx={codeBlockSx({
        codeType,
        compact,
      })}
    >
      {codeType === "html" ? highlightHtml(children) : highlightMarkdown(children)}
    </Box>
  </Box>
)

const StoryTemplateCard = ({
  story,
  themePreference,
}: {
  story: StorybookStory
  themePreference: ThemePreference
}) => {
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
      themePreference={themePreference}
      readOnly
      onTemplateChange={setTemplate}
    />
  )
}

const StoryPreview = ({
  story,
  themePreference,
}: {
  story: StorybookStory
  themePreference: ThemePreference
}) => {
  return (
    <Box as="section" data-active-storybook-story={story.storyKey} sx={{ display: "grid", gap: 3 }}>
      <Box
        aria-label="선택된 Storybook 항목"
        data-storybook-summary="true"
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}
      >
        <Label variant="secondary" size="large">
          {story.blockLabel}
        </Label>
        <Label size="large">
          {story.editorLabel} / {story.blockId}
        </Label>
      </Box>

      <StoryTemplateCard story={story} themePreference={themePreference} />

      <Box
        sx={{
          display: "grid",
          gap: 3,
          "@media (min-width: 1280px)": {
            gridTemplateColumns: "minmax(0, 0.95fr) minmax(0, 1.05fr)",
          },
        }}
      >
        <CodePanel title="입력 HTML" codeType="html" compact>
          {formatHtmlForDisplay(story.inputHtml)}
        </CodePanel>
        <Box sx={panelSx}>
          <Box sx={{ borderBottom: "1px solid", borderColor: "border.default", p: 3 }}>
            <Text sx={{ color: "fg.default", fontSize: 2, fontWeight: 600 }}>원본 캡처</Text>
          </Box>
          <Box sx={{ display: "grid", placeItems: "center", bg: "canvas.subtle", p: 3 }}>
            <Box
              as="img"
              src={story.screenshotSrc}
              alt={`${story.blockLabel} 원본 캡처`}
              sx={{
                maxHeight: "420px",
                maxWidth: "100%",
                border: "1px solid",
                borderColor: "border.default",
                borderRadius: 2,
                bg: "canvas.default",
                objectFit: "contain",
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box sx={panelSx}>
        <Box sx={{ borderBottom: "1px solid", borderColor: "border.default", p: 3 }}>
          <Text sx={{ color: "fg.default", fontSize: 2, fontWeight: 600 }}>Markdown</Text>
        </Box>
        <Box
          as="pre"
          aria-label="Markdown 코드"
          data-storybook-markdown
          tabIndex={0}
          sx={codeBlockSx({ codeType: "markdown" })}
        >
          {highlightMarkdown(story.markdown)}
        </Box>
      </Box>
    </Box>
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
      <Box
        as="main"
        sx={{ minHeight: "100vh", width: "100%", overflowX: "clip", bg: "canvas.default" }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            minHeight: "100vh",
            width: "100%",
            maxWidth: "1280px",
            mx: "auto",
            flexDirection: "column",
            gap: 3,
            px: [3, 4],
            py: [3, 4],
          }}
        >
          <WizardHeader
            title="Storybook"
            description="지원 중인 블록의 입력 HTML, 원본 캡처, Markdown 출력을 비교합니다."
            themePreference={themePreference}
            headerStatus="ready"
            summaryCards={summaryCards}
            backLink={backLink}
            onThemeChange={setThemePreference}
          />
          <Box sx={{ display: ["block", null, "none"] }}>
            <FormControl id="storybook-block-select">
              <FormControl.Label>블록 선택</FormControl.Label>
              <Select
                block
                value={activeStory.storyKey}
                onChange={(event) => selectStory(event.target.value)}
              >
                {storybookCatalog.map((group) => (
                  <optgroup key={group.editorType} label={group.editorLabel}>
                    {group.stories.map((story) => (
                      <Select.Option key={story.storyKey} value={story.storyKey}>
                        {story.blockIndex + 1}. {story.blockLabel}
                      </Select.Option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box
            data-storybook-layout
            sx={{
              display: "grid",
              gap: 3,
              "@media (min-width: 1012px)": {
                gridTemplateColumns: "18rem minmax(0, 1fr)",
              },
            }}
          >
            <Box sx={{ display: ["none", null, "block"], order: [2, null, 1] }}>
              <StoryTree activeStoryKey={activeStory.storyKey} onSelect={selectStory} />
            </Box>
            <Box sx={{ order: [1, null, 2], minWidth: 0 }}>
              <StoryPreview story={activeStory} themePreference={themePreference} />
            </Box>
          </Box>
        </Box>
      </Box>
    </PrimerAppProvider>
  )
}
