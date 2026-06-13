import {
  applyPostTemplate,
  buildPostTemplateValues,
} from "@exitpress/domain/export-paths/PostPathTemplate.js"
import { Box, Text } from "@primer/react"

import type { PostSummary } from "@exitpress/domain/blog/schema/BlogScan.js"
import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { EmbeddedOptionPanel, OptionSection, OptionWideBox, RadioField } from "./OptionControls.js"
import { postTemplatePropDefinitions } from "./PostTemplateProps.js"
import { TemplateEditorCard } from "./TemplateEditorCard.js"
import { getTemplatePreview } from "./TemplatePreview.js"

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
    "blogKey" | "sourceId" | "postId" | "title" | "publishedAt" | "categoryName"
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
      ? getTemplatePreview(() =>
          applyPostTemplate({
            template: customUrlTemplate,
            values: linkTemplatePreviewValues,
          }),
        )
      : null

  return (
    <OptionSection title="같은 블로그 글 링크" note="현재 내보내는 블로그 안의 다른 글 링크 규칙">
      <OptionWideBox>
        <Box sx={{ display: "grid", gap: 3 }}>
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
            label="내보낼 글은 사용자 지정 URL로 바꾸기"
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
              <Box sx={{ display: "grid", gap: 3, pl: 4 }}>
                <TemplateEditorCard
                  title="URL 템플릿"
                  editorId="links-sameBlogPostCustomUrlTemplate"
                  props={postTemplatePropDefinitions}
                  value={options.links.sameBlogPostCustomUrlTemplate}
                  minHeight="6.5rem"
                  surface="embedded"
                  onTemplateChange={(sameBlogPostCustomUrlTemplate) =>
                    onOptionsChange((current) => ({
                      ...current,
                      links: {
                        ...current.links,
                        sameBlogPostCustomUrlTemplate,
                      },
                    }))
                  }
                />

                <EmbeddedOptionPanel>
                  <Box sx={{ display: "grid", gap: 1 }}>
                    <Text sx={{ fontSize: 1, fontWeight: "semibold" }}>실시간 변환 예시</Text>
                    <Text sx={{ color: "fg.muted", fontSize: 1, lineHeight: "24px" }}>
                      {linkTemplatePreviewPost
                        ? `${linkTemplatePreviewPost.title}을 예시로 바로 표시합니다.`
                        : "선택 범위에 글이 있으면 실제 변환 결과가 여기에 바로 표시됩니다."}
                    </Text>
                  </Box>

                  <Box
                    sx={{
                      color: "fg.muted",
                      display: "grid",
                      fontSize: 1,
                      gap: 2,
                      lineHeight: "24px",
                    }}
                  >
                    <Text>변환 결과</Text>
                    <Box
                      as="code"
                      id="links-sameBlogPostCustomUrlPreview"
                      role={customUrlPreview?.status === "error" ? "alert" : undefined}
                      sx={{
                        bg: customUrlPreview?.status === "error" ? "danger.subtle" : "canvas.inset",
                        border: "1px solid",
                        borderColor:
                          customUrlPreview?.status === "error" ? "danger.muted" : "border.default",
                        borderRadius: 2,
                        color: customUrlPreview?.status === "error" ? "danger.fg" : "fg.default",
                        display: "block",
                        fontFamily: "mono",
                        fontSize: 0,
                        lineHeight: "20px",
                        overflowWrap: "anywhere",
                        px: 3,
                        py: 2,
                      }}
                    >
                      {customUrlPreview?.status === "success"
                        ? customUrlPreview.text
                        : (customUrlPreview?.message ??
                          "템플릿을 입력하면 결과가 여기에서 바로 바뀝니다.")}
                    </Box>
                  </Box>
                </EmbeddedOptionPanel>
              </Box>
            ) : null}
          </RadioField>

          <RadioField
            inputId="links-sameBlogPostMode-relative-filepath"
            name="links-sameBlogPostMode"
            optionKey="links-sameBlogPostMode"
            label="내보낸 결과 기준 상대 파일 경로로 바꾸기"
            description="함께 내보낸 다른 글이면 현재 Markdown 파일 위치를 기준으로 한 상대경로로 바꿉니다."
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
        </Box>
      </OptionWideBox>
    </OptionSection>
  )
}
