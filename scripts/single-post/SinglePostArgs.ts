const entrypoint = "bun scripts/single-post/export-single-post.ts"

const usageError = () => new Error(singlePostCliUsage())

export const singlePostCliUsage = () =>
  `Usage: ${entrypoint} --sourceId my-blog --postId 123456789012 --outputDir ./output [--report ./output/report.json] [--manualReviewMarkdownPath ./output/post.md] [--metadataCachePath ./output/metadata-cache.json] [--options ./config/single-post.json] [--stdout]\nInspect: ${entrypoint} --inspect --sourceId my-blog --postId 123456789012 [--report ./inspect.json] [--options ./config/single-post.json] [--stdout]`

export const parseSinglePostCliArgs = (args: string[]) => {
  let sourceId: string | null = null
  let postId: string | null = null
  let outputDir: string | null = null
  let reportPath: string | null = null
  let manualReviewMarkdownPath: string | null = null
  let metadataCachePath: string | null = null
  let optionsPath: string | null = null
  let inspect = false
  let stdout = false

  const readValue = (index: number) => {
    const value = args[index + 1]

    if (!value || value.startsWith("--")) {
      throw usageError()
    }

    return value
  }

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]

    if (arg === "--sourceId") {
      sourceId = readValue(index)
      index++
      continue
    }

    if (arg === "--postId") {
      postId = readValue(index)
      index++
      continue
    }

    if (arg === "--outputDir") {
      outputDir = readValue(index)
      index++
      continue
    }

    if (arg === "--report") {
      reportPath = readValue(index)
      index++
      continue
    }

    if (arg === "--manualReviewMarkdownPath") {
      manualReviewMarkdownPath = readValue(index)
      index++
      continue
    }

    if (arg === "--metadataCachePath") {
      metadataCachePath = readValue(index)
      index++
      continue
    }

    if (arg === "--options") {
      optionsPath = readValue(index)
      index++
      continue
    }

    if (arg === "--stdout") {
      stdout = true
      continue
    }

    if (arg === "--inspect") {
      inspect = true
      continue
    }

    throw usageError()
  }

  if (!sourceId || !postId || (!inspect && !outputDir)) {
    throw usageError()
  }

  return {
    sourceId,
    postId,
    outputDir,
    reportPath,
    manualReviewMarkdownPath,
    metadataCachePath,
    optionsPath,
    inspect,
    stdout,
  }
}
