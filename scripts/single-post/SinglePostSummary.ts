import type { SinglePostInspectDiagnostics } from "@exitpress/blog-naver/exporting/SinglePostInspect.js"
import type { ParserBlockInspection } from "@exitpress/blog-naver/parsing/naver-blog/core/ParserBlockDiagnostics.js"

export const renderSinglePostSummary = ({
  sourceId,
  postId,
  blockIds,
  exporterMarkdownFilePath,
  manualReviewMarkdownFilePath,
  metadataCachePath,
}: {
  sourceId: string
  postId: string
  blockIds: string[]
  exporterMarkdownFilePath: string
  manualReviewMarkdownFilePath: string | null
  metadataCachePath: string | null
}) =>
  [
    `sourceId: ${sourceId}`,
    `postId: ${postId}`,
    `blockIds: ${blockIds.join(", ") || "(none)"}`,
    `exporterMarkdownFilePath: ${exporterMarkdownFilePath}`,
    `manualReviewMarkdownFilePath: ${manualReviewMarkdownFilePath ?? "(not provided)"}`,
    `metadataCachePath: ${metadataCachePath ?? "(not provided)"}`,
  ].join("\n")

const renderInspectNodeSummary = (node: ParserBlockInspection) => {
  const attributes = [
    node.id ? `id="${node.id}"` : "",
    node.className ? `class="${node.className}"` : "",
    node.moduleType ? `moduleType="${node.moduleType}"` : "",
  ].filter(Boolean)
  const nodeLabel = [node.tagName, ...attributes].join(" ")

  return [
    `  - path: ${node.path}`,
    `    node: ${nodeLabel}`,
    `    text: ${node.text || "(empty)"}`,
    `    html: ${node.html}`,
  ].join("\n")
}

export const renderSinglePostInspectSummary = ({
  diagnostics,
  reportPath,
}: {
  diagnostics: SinglePostInspectDiagnostics
  reportPath: string | null
}) => {
  const parseLines =
    diagnostics.parse.status === "success"
      ? ["parse: success", `blockIds: ${diagnostics.parse.blockIds.join(", ") || "(none)"}`]
      : ["parse: failed", `error: ${diagnostics.parse.error}`]

  return [
    `sourceId: ${diagnostics.sourceId}`,
    `postId: ${diagnostics.postId}`,
    `editor: ${diagnostics.editor ? `${diagnostics.editor.type} (${diagnostics.editor.label})` : "(not detected)"}`,
    ...parseLines,
    `unsupportedCount: ${diagnostics.unsupportedNodes.length}`,
    `inspectReportPath: ${reportPath ?? "(not provided)"}`,
    ...diagnostics.unsupportedNodes.flatMap((node) => renderInspectNodeSummary(node)),
  ].join("\n")
}
