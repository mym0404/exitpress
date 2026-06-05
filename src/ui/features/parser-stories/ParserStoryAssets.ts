const captureModules = import.meta.glob("./assets/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

export const parserStoryCaptureAssets = Object.fromEntries(
  Object.entries(captureModules).map(([path, url]) => [
    path.replace(/^.*\/([^/]+)\.png$/, "$1"),
    url,
  ]),
)

export const resolveParserStoryCaptureSrc = ({
  storyKey,
  fallbackSrc,
}: {
  storyKey: string
  fallbackSrc: string
}) => parserStoryCaptureAssets[storyKey] ?? fallbackSrc
