import type { PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"
import type {
  ExportOptions,
  FrontmatterFieldMeta,
  FrontmatterFieldName,
} from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { BlockTemplateDefinition } from "@exitpress/domain/template/schema/BlockTemplateDefinition.js"
import type { ReactNode } from "react"

import type { ExportOptionsStep } from "./ExportOptionsSteps.js"

import { Card, CardContent } from "../../components/ui/Card.js"

import { AssetsOptionsStep } from "./AssetsOptionsStep.js"
import { MarkdownOptionsStep } from "./BlockTemplateOptions.js"
import { DiagnosticsOptionsStep } from "./DiagnosticsOptionsStep.js"
import { FrontmatterOptionsStep } from "./FrontmatterOptionsStep.js"
import { LinksOptionsStep } from "./LinksOptionsStep.js"
import { StructureOptionsStep } from "./StructureOptionsStep.js"

export const ExportOptionsPanel = ({
  step,
  outputDir,
  options,
  optionDescriptions,
  blockTemplateDefinitions = [],
  frontmatterFieldOrder,
  frontmatterFieldMeta,
  frontmatterValidationErrors,
  linkTemplatePreviewPost,
  onOptionsChange,
}: {
  step: ExportOptionsStep
  outputDir: string
  options: ExportOptions
  optionDescriptions: Record<string, string>
  blockTemplateDefinitions?: BlockTemplateDefinition[]
  frontmatterFieldOrder: FrontmatterFieldName[]
  frontmatterFieldMeta: Record<FrontmatterFieldName, FrontmatterFieldMeta>
  frontmatterValidationErrors: string[]
  linkTemplatePreviewPost?: Pick<
    PostSummary,
    "sourceId" | "postId" | "title" | "publishedAt" | "categoryName"
  > | null
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const description = (key: string) => optionDescriptions[key]
  const contentByStep: Record<ExportOptionsStep, ReactNode> = {
    structure: (
      <StructureOptionsStep
        outputDir={outputDir}
        options={options}
        description={description}
        onOptionsChange={onOptionsChange}
      />
    ),
    frontmatter: (
      <FrontmatterOptionsStep
        options={options}
        description={description}
        frontmatterFieldOrder={frontmatterFieldOrder}
        frontmatterFieldMeta={frontmatterFieldMeta}
        frontmatterValidationErrors={frontmatterValidationErrors}
        onOptionsChange={onOptionsChange}
      />
    ),
    markdown: (
      <MarkdownOptionsStep
        options={options}
        blockTemplateDefinitions={blockTemplateDefinitions}
        onOptionsChange={onOptionsChange}
      />
    ),
    assets: (
      <AssetsOptionsStep
        options={options}
        description={description}
        onOptionsChange={onOptionsChange}
      />
    ),
    links: (
      <LinksOptionsStep
        options={options}
        description={description}
        linkTemplatePreviewPost={linkTemplatePreviewPost}
        onOptionsChange={onOptionsChange}
      />
    ),
    diagnostics: (
      <DiagnosticsOptionsStep
        options={options}
        description={description}
        onOptionsChange={onOptionsChange}
      />
    ),
  }
  const formContent = (
    <div id="export-form" className="form-stack grid gap-5">
      {contentByStep[step]}
    </div>
  )

  if (step === "markdown") {
    return formContent
  }

  return (
    <Card variant="panel" className="board-card overflow-hidden" id="export-panel">
      <CardContent className="panel-body grid gap-4 p-5">{formContent}</CardContent>
    </Card>
  )
}
