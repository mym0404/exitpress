export const getTemplatePreview = (render: () => string) => {
  try {
    return render()
  } catch {
    return undefined
  }
}
