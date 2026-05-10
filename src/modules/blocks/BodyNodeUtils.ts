import type {
  ParsedPost,
  ParsedPostStructuredBodyNode,
} from "../../shared/Types.js"

export const getParsedPostBodyNodes = (parsedPost: ParsedPost) => parsedPost.body

export const getStructuredBodyBlocks = (parsedPost: ParsedPost) =>
  getParsedPostBodyNodes(parsedPost)
    .filter((node): node is ParsedPostStructuredBodyNode => node.kind === "block")
    .map((node) => node.block)
