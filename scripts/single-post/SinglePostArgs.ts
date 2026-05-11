const entrypoint = "bun scripts/single-post/export-single-post.ts"

const usageError = () => new Error(singlePostCliUsage())

export const singlePostCliUsage = () =>
  `Usage: ${entrypoint} --blogId my-blog --logNo 123456789012 --outputDir ./output [--report ./output/report.json] [--manualReviewMarkdownPath ./output/post.md] [--metadataCachePath ./output/metadata-cache.json] [--options ./config/single-post.json] [--stdout]\nInspect: ${entrypoint} --inspect --blogId my-blog --logNo 123456789012 [--report ./inspect.json] [--options ./config/single-post.json] [--stdout]`

export const parseSinglePostCliArgs = (args: string[]) => {
  let blogId: string | null = null
  let logNo: string | null = null
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

    if (arg === "--blogId") {
      blogId = readValue(index)
      index++
      continue
    }

    if (arg === "--logNo") {
      logNo = readValue(index)
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

  if (!blogId || !logNo || (!inspect && !outputDir)) {
    throw usageError()
  }

  return {
    blogId,
    logNo,
    outputDir,
    reportPath,
    manualReviewMarkdownPath,
    metadataCachePath,
    optionsPath,
    inspect,
    stdout,
  }
}
