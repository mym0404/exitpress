export type TemplatePreview =
  | {
      status: "success"
      text: string
    }
  | {
      status: "error"
      message: string
    }

const toTemplatePreviewErrorMessage = (error: unknown) =>
  `템플릿 오류: ${error instanceof Error ? error.message : String(error)}`

export const getTemplatePreview = (render: () => string): TemplatePreview => {
  try {
    return {
      status: "success",
      text: render(),
    }
  } catch (error) {
    return {
      status: "error",
      message: toTemplatePreviewErrorMessage(error),
    }
  }
}
