import { generatedStorybookCatalog } from "./generated/StorybookCatalog.generated.js"
import { resolveStorybookCaptureSrc } from "./StorybookAssets.js"

export type { StorybookEditorGroup, StorybookStory } from "./schema/Storybook.js"

export const storybookCatalog = generatedStorybookCatalog.map((group) => ({
  ...group,
  stories: group.stories.map((story) => ({
    ...story,
    screenshotSrc: resolveStorybookCaptureSrc({
      storyKey: story.storyKey,
      fallbackSrc: story.screenshotSrc,
    }),
  })),
}))
