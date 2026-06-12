import { getDefaultSlugWhitespace } from "@exitpress/domain/export-options/ExportOptions.js"
import { buildPostFolderName } from "@exitpress/domain/export-paths/PostPathTemplate.js"

import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { cn } from "../../lib/Cn.js"

import {
  CheckField,
  OptionField,
  OptionSection,
  OptionSelectField,
  optionEmbeddedPanelClass,
} from "./OptionControls.js"
import { postTemplatePropDefinitions } from "./PostTemplateProps.js"
import {
  buildStructurePreviewTree,
  StructurePreviewTree,
  structurePreviewSample,
} from "./StructurePreview.js"
import { TemplateEditorCard } from "./TemplateEditorCard.js"
import { getTemplatePreview } from "./TemplatePreview.js"

export const StructureOptionsStep = ({
  outputDir,
  options,
  description,
  onOptionsChange,
}: {
  outputDir: string
  options: ExportOptions
  description: (key: string) => string | undefined
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const structureTemplatePreviewPost = {
    blogKey: "naver",
    sourceId: "mym0404",
    postId: structurePreviewSample.posts[0]?.postId ?? "223034929697",
    title: structurePreviewSample.posts[0]?.title ?? "첫 글",
    publishedAt: structurePreviewSample.posts[0]?.publishedAt ?? "2026-04-11T04:00:00.000Z",
    categoryName: structurePreviewSample.posts[0]?.categoryPath.at(-1) ?? "React",
  }
  const postFolderNameTemplate = options.structure.postFolderNameTemplate.trim()
  const postFolderNamePreview = postFolderNameTemplate
    ? getTemplatePreview(() =>
        buildPostFolderName({
          post: structureTemplatePreviewPost,
          options: {
            structure: options.structure,
          },
        }),
      )
    : undefined
  const structurePreviewTree = buildStructurePreviewTree({
    outputDir,
    options,
  })

  return (
    <OptionSection title="구조" note="출력 폴더와 파일 이름 규칙">
      <CheckField
        inputId="structure-groupByCategory"
        optionKey="structure-groupByCategory"
        label="카테고리 폴더 유지"
        description={description("structure-groupByCategory")}
        checked={options.structure.groupByCategory}
        onChange={(checked) =>
          onOptionsChange((current) => ({
            ...current,
            structure: {
              ...current.structure,
              groupByCategory: checked,
            },
          }))
        }
      />

      <OptionField
        optionKey="structure-slugStyle"
        labelFor="structure-slugStyle"
        label="slug와 카테고리 표기 방식"
        description={description("structure-slugStyle")}
      >
        <OptionSelectField
          inputId="structure-slugStyle"
          value={options.structure.slugStyle}
          options={[
            { value: "kebab", label: "kebab-case" },
            { value: "snake", label: "snake_case" },
            { value: "keep-title", label: "원본 제목 유지" },
          ]}
          onValueChange={(slugStyle) =>
            onOptionsChange((current) => ({
              ...current,
              structure: {
                ...current.structure,
                slugStyle,
                slugWhitespace: getDefaultSlugWhitespace(slugStyle),
              },
            }))
          }
        />
      </OptionField>

      <OptionField
        optionKey="structure-slugWhitespace"
        labelFor="structure-slugWhitespace"
        label="slug와 카테고리 공백 처리"
        description={description("structure-slugWhitespace")}
      >
        <OptionSelectField
          inputId="structure-slugWhitespace"
          value={options.structure.slugWhitespace}
          options={[
            { value: "dash", label: "-로 바꾸기" },
            { value: "underscore", label: "_로 바꾸기" },
            { value: "keep-space", label: "공백 유지" },
          ]}
          onValueChange={(slugWhitespace) =>
            onOptionsChange((current) => ({
              ...current,
              structure: {
                ...current.structure,
                slugWhitespace,
              },
            }))
          }
        />
      </OptionField>

      <div className="grid gap-3 xl:col-span-2">
        <TemplateEditorCard
          title="폴더명 템플릿"
          editorId="structure-postFolderNameTemplate"
          props={postTemplatePropDefinitions}
          value={options.structure.postFolderNameTemplate}
          minHeight="6.5rem"
          surface="embedded"
          onTemplateChange={(postFolderNameTemplate) =>
            onOptionsChange((current) => ({
              ...current,
              structure: {
                ...current.structure,
                postFolderNameTemplate,
              },
            }))
          }
        />

        <div className={optionEmbeddedPanelClass}>
          <div className="grid gap-1">
            <span className="text-sm font-semibold text-foreground">실시간 폴더명 예시</span>
            <p className="text-sm leading-6 text-muted-foreground">
              {structureTemplatePreviewPost.title}을 예시로 바로 표시합니다.
            </p>
          </div>

          <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
            <span>폴더 이름 결과</span>
            <code
              id="structure-postFolderNameTemplatePreview"
              role={postFolderNamePreview?.status === "error" ? "alert" : undefined}
              className={cn(
                "code-surface-inverse break-all px-3 py-2 font-mono text-[0.8125rem]",
                postFolderNamePreview?.status === "error" &&
                  "border-[color-mix(in_srgb,var(--status-error-fg)_26%,transparent)] bg-[var(--status-error-bg)] text-[var(--status-error-fg)]",
              )}
            >
              {postFolderNamePreview?.status === "success"
                ? postFolderNamePreview.text
                : (postFolderNamePreview?.message ??
                  "템플릿을 입력하면 결과가 여기에서 바로 바뀝니다.")}
            </code>
          </div>
        </div>
      </div>

      <div
        id="structure-file-tree-preview"
        className="field-card grid gap-3 rounded-2xl px-4 py-4 xl:col-span-2"
      >
        <div className="grid gap-1">
          <span className="text-sm font-semibold text-foreground">예시 파일 트리</span>
          <p className="text-sm leading-6 text-muted-foreground">
            현재 옵션으로 여러 글을 저장했을 때의 예시입니다.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-2">
          <StructurePreviewTree node={structurePreviewTree} />
        </div>
      </div>
    </OptionSection>
  )
}
