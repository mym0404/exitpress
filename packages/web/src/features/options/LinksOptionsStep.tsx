import {
  applyPostTemplate,
  buildPostTemplateValues,
  postTemplateKeys,
} from "@exitpress/domain/export-paths/PostPathTemplate.js"

import type { PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { Input } from "../../components/ui/Input.js"

import {
  OptionSection,
  optionEmbeddedFieldClass,
  optionEmbeddedPanelClass,
  RadioField,
} from "./OptionControls.js"
import { TemplateVariableCards } from "./TemplateVariables.js"

export const LinksOptionsStep = ({
  options,
  description,
  linkTemplatePreviewPost,
  onOptionsChange,
}: {
  options: ExportOptions
  description: (key: string) => string | undefined
  linkTemplatePreviewPost?: Pick<
    PostSummary,
    "blogId" | "logNo" | "title" | "publishedAt" | "categoryName"
  > | null
  onOptionsChange: (updater: (current: ExportOptions) => ExportOptions) => void
}) => {
  const linkTemplatePreviewValues = linkTemplatePreviewPost
    ? buildPostTemplateValues({
        post: linkTemplatePreviewPost,
        options,
      })
    : null
  const customUrlTemplate = options.links.sameBlogPostCustomUrlTemplate.trim()
  const customUrlPreview =
    linkTemplatePreviewValues && customUrlTemplate
      ? applyPostTemplate({
          template: customUrlTemplate,
          values: linkTemplatePreviewValues,
        })
      : null

  return (
    <OptionSection title="같은 블로그 글 링크" note="현재 내보내는 블로그 안의 다른 글 링크 규칙">
      <div className="grid gap-4 xl:col-span-2">
        <RadioField
          inputId="links-sameBlogPostMode-keep-source"
          name="links-sameBlogPostMode"
          optionKey="links-sameBlogPostMode"
          label="원래 블로그 링크 유지"
          description="같은 블로그 글이어도 기존 URL을 그대로 둡니다."
          checked={options.links.sameBlogPostMode === "keep-source"}
          onChange={() =>
            onOptionsChange((current) => ({
              ...current,
              links: {
                ...current.links,
                sameBlogPostMode: "keep-source",
              },
            }))
          }
        />

        <RadioField
          inputId="links-sameBlogPostMode-custom-url"
          name="links-sameBlogPostMode"
          optionKey="links-sameBlogPostMode"
          label="내보낼 글이면 커스텀 URL로 바꾸기"
          description={description("links-sameBlogPostMode")}
          checked={options.links.sameBlogPostMode === "custom-url"}
          onChange={() =>
            onOptionsChange((current) => ({
              ...current,
              links: {
                ...current.links,
                sameBlogPostMode: "custom-url",
              },
            }))
          }
        >
          {options.links.sameBlogPostMode === "custom-url" ? (
            <div className="grid gap-3 pl-7">
              <label className={optionEmbeddedFieldClass}>
                <span className="text-sm font-semibold text-foreground">URL 템플릿</span>
                <Input
                  id="links-sameBlogPostCustomUrlTemplate"
                  value={options.links.sameBlogPostCustomUrlTemplate}
                  placeholder="https://myblog/{slug}"
                  onChange={(event) =>
                    onOptionsChange((current) => ({
                      ...current,
                      links: {
                        ...current.links,
                        sameBlogPostCustomUrlTemplate: event.target.value,
                      },
                    }))
                  }
                />
                <small className="field-help text-sm leading-6">
                  지원 변수만 바뀝니다. 예:{" "}
                  <span className="font-mono text-foreground">
                    https://myblog/{"{category}"}/{"{title}"}
                  </span>
                </small>
              </label>

              <div className={optionEmbeddedPanelClass}>
                <div className="grid gap-1">
                  <span className="text-sm font-semibold text-foreground">실시간 변환 예시</span>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {linkTemplatePreviewPost
                      ? `${linkTemplatePreviewPost.title} 글을 예시로 바로 표시합니다.`
                      : "선택 범위에 글이 있으면 여기에서 실제 변환 결과를 바로 표시합니다."}
                  </p>
                </div>

                <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  <span>현재 템플릿</span>
                  <code className="code-surface break-all px-3 py-2 font-mono text-[0.8125rem] text-foreground">
                    {customUrlTemplate || "(비어 있음)"}
                  </code>
                </div>

                <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  <span>변환 결과</span>
                  <code
                    id="links-sameBlogPostCustomUrlPreview"
                    className="code-surface-inverse break-all px-3 py-2 font-mono text-[0.8125rem]"
                  >
                    {customUrlPreview ?? "템플릿을 입력하면 결과가 여기에서 바로 바뀝니다."}
                  </code>
                </div>
              </div>

              <div className={optionEmbeddedPanelClass}>
                <div className="grid gap-1">
                  <span className="text-sm font-semibold text-foreground">사용 가능한 변수</span>
                  <p className="text-sm leading-6 text-muted-foreground">
                    아래 값은 현재 선택 범위 안의 글 하나로 계산한 예시입니다.
                  </p>
                </div>

                <TemplateVariableCards
                  keys={postTemplateKeys}
                  values={linkTemplatePreviewValues ?? {}}
                />
              </div>
            </div>
          ) : null}
        </RadioField>

        <RadioField
          inputId="links-sameBlogPostMode-relative-filepath"
          name="links-sameBlogPostMode"
          optionKey="links-sameBlogPostMode"
          label="내보낸 결과 기준 상대경로 filepath로 바꾸기"
          description="함께 내보낸 다른 글이면 현재 Markdown 파일 위치의 상대경로로 바꿉니다."
          checked={options.links.sameBlogPostMode === "relative-filepath"}
          onChange={() =>
            onOptionsChange((current) => ({
              ...current,
              links: {
                ...current.links,
                sameBlogPostMode: "relative-filepath",
              },
            }))
          }
        />
      </div>
    </OptionSection>
  )
}
