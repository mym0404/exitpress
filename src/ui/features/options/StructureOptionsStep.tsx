import type { ExportOptions } from "../../../domain/export-options/Types.js"

import { getDefaultSlugWhitespace } from "../../../domain/export-options/ExportOptions.js"
import {
  buildPostFolderName,
  buildPostTemplateValues,
  postTemplateKeys,
} from "../../../exporting/paths/PostPathTemplate.js"
import { Input } from "../../components/ui/Input.js"

import {
  CheckField,
  OptionField,
  OptionSection,
  OptionSelectField,
  optionEmbeddedFieldClass,
  optionEmbeddedPanelClass,
  RadioField,
} from "./OptionControls.js"
import {
  buildStructurePreviewTree,
  StructurePreviewTree,
  structurePreviewSample,
} from "./StructurePreview.js"
import { TemplateVariableCards } from "./TemplateVariables.js"

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
    blogId: "mym0404",
    logNo: structurePreviewSample.posts[0]?.logNo ?? "223034929697",
    title: structurePreviewSample.posts[0]?.title ?? "첫 글",
    publishedAt: structurePreviewSample.posts[0]?.publishedAt ?? "2026-04-11T04:00:00.000Z",
    categoryName: structurePreviewSample.posts[0]?.categoryPath.at(-1) ?? "React",
  }
  const structureTemplatePreviewValues = buildPostTemplateValues({
    post: structureTemplatePreviewPost,
    options,
  })
  const postFolderNameTemplate = options.structure.postFolderNameCustomTemplate.trim()
  const postFolderNamePreview =
    postFolderNameTemplate &&
    buildPostFolderName({
      post: structureTemplatePreviewPost,
      options: {
        structure: options.structure,
      },
    })
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

      <CheckField
        inputId="structure-includeDateInPostFolderName"
        optionKey="structure-includeDateInPostFolderName"
        label="글 폴더 이름에 날짜 포함"
        description={description("structure-includeDateInPostFolderName")}
        checked={options.structure.includeDateInPostFolderName}
        disabled={options.structure.postFolderNameMode === "custom-template"}
        onChange={(checked) =>
          onOptionsChange((current) => ({
            ...current,
            structure: {
              ...current.structure,
              includeDateInPostFolderName: checked,
            },
          }))
        }
      />

      <CheckField
        inputId="structure-includeLogNoInPostFolderName"
        optionKey="structure-includeLogNoInPostFolderName"
        label="글 폴더 이름에 logNo 포함"
        description={description("structure-includeLogNoInPostFolderName")}
        checked={options.structure.includeLogNoInPostFolderName}
        disabled={options.structure.postFolderNameMode === "custom-template"}
        onChange={(checked) =>
          onOptionsChange((current) => ({
            ...current,
            structure: {
              ...current.structure,
              includeLogNoInPostFolderName: checked,
            },
          }))
        }
      />

      <OptionField
        optionKey="structure-slugStyle"
        labelFor="structure-slugStyle"
        label="slug/카테고리 표기 방식"
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
        label="slug/카테고리 공백 처리"
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

      <div className="grid gap-4 xl:col-span-2">
        <RadioField
          inputId="structure-postFolderNameMode-preset"
          name="structure-postFolderNameMode"
          optionKey="structure-postFolderNameMode"
          label="기본 규칙으로 글 폴더 이름 만들기"
          description="날짜 포함, logNo 포함, slug 규칙을 조합해서 만듭니다."
          checked={options.structure.postFolderNameMode === "preset"}
          onChange={() =>
            onOptionsChange((current) => ({
              ...current,
              structure: {
                ...current.structure,
                postFolderNameMode: "preset",
              },
            }))
          }
        />

        <RadioField
          inputId="structure-postFolderNameMode-custom-template"
          name="structure-postFolderNameMode"
          optionKey="structure-postFolderNameMode"
          label="템플릿으로 글 폴더 이름 직접 구성"
          description={description("structure-postFolderNameMode")}
          checked={options.structure.postFolderNameMode === "custom-template"}
          onChange={() =>
            onOptionsChange((current) => ({
              ...current,
              structure: {
                ...current.structure,
                postFolderNameMode: "custom-template",
              },
            }))
          }
        >
          {options.structure.postFolderNameMode === "custom-template" ? (
            <div className="grid gap-3 pl-7">
              <label className={optionEmbeddedFieldClass}>
                <span className="text-sm font-semibold text-foreground">폴더명 템플릿</span>
                <Input
                  id="structure-postFolderNameCustomTemplate"
                  value={options.structure.postFolderNameCustomTemplate}
                  placeholder="{date}-{slug}"
                  onChange={(event) =>
                    onOptionsChange((current) => ({
                      ...current,
                      structure: {
                        ...current.structure,
                        postFolderNameCustomTemplate: event.target.value,
                      },
                    }))
                  }
                />
                <small className="field-help text-sm leading-6">
                  결과는 한 폴더 이름으로 정리됩니다. 예:{" "}
                  <span className="font-mono text-foreground">
                    {"{date}"}-{"{category}"}-{"{slug}"}
                  </span>
                </small>
              </label>

              <div className={optionEmbeddedPanelClass}>
                <div className="grid gap-1">
                  <span className="text-sm font-semibold text-foreground">실시간 폴더명 예시</span>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {structureTemplatePreviewPost.title} 글을 기준으로 바로 보여줍니다.
                  </p>
                </div>

                <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  <span>현재 템플릿</span>
                  <code className="code-surface break-all px-3 py-2 font-mono text-[0.8125rem] text-foreground">
                    {postFolderNameTemplate || "(비어 있음)"}
                  </code>
                </div>

                <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  <span>폴더 이름 결과</span>
                  <code
                    id="structure-postFolderNameCustomTemplatePreview"
                    className="code-surface-inverse break-all px-3 py-2 font-mono text-[0.8125rem]"
                  >
                    {postFolderNamePreview ?? "템플릿을 입력하면 결과가 여기에서 바로 바뀝니다."}
                  </code>
                </div>
              </div>

              <div className={optionEmbeddedPanelClass}>
                <div className="grid gap-1">
                  <span className="text-sm font-semibold text-foreground">사용 가능한 변수</span>
                  <p className="text-sm leading-6 text-muted-foreground">
                    아래 값은 구조 예시 글 하나를 기준으로 바로 계산합니다.
                  </p>
                </div>

                <TemplateVariableCards
                  keys={postTemplateKeys}
                  keyPrefix="structure"
                  values={structureTemplatePreviewValues}
                  variant="inline"
                />
              </div>
            </div>
          ) : null}
        </RadioField>
      </div>

      <div
        id="structure-file-tree-preview"
        className="field-card grid gap-3 rounded-2xl px-4 py-4 xl:col-span-2"
      >
        <div className="grid gap-1">
          <span className="text-sm font-semibold text-foreground">예시 파일 트리</span>
          <p className="text-sm leading-6 text-muted-foreground">
            현재 옵션 기준으로 여러 글이 저장되는 예시입니다.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-2">
          <StructurePreviewTree node={structurePreviewTree} />
        </div>
      </div>
    </OptionSection>
  )
}
