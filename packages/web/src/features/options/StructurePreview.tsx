import { formatCategorySegment } from "@exitpress/domain/export-paths/PathFormat.js"
import { buildPostFolderName } from "@exitpress/domain/export-paths/PostPathTemplate.js"
import { ChevronDownIcon, FileDirectoryIcon, FileIcon } from "@primer/octicons-react"
import { Box, Details, Text } from "@primer/react"

import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"

import { getTemplatePreview } from "./TemplatePreview.js"

type StructurePreviewTreeNode =
  | {
      kind: "file"
      name: string
    }
  | {
      kind: "folder"
      name: string
      items: StructurePreviewTreeNode[]
      defaultOpen?: boolean
    }

export const structurePreviewSample = {
  posts: [
    {
      publishedAt: "2026-04-11T04:00:00.000Z",
      logNo: "223034929697",
      title: "첫 글",
      categoryPath: ["개발 메모", "React"],
    },
    {
      publishedAt: "2026-04-12T04:00:00.000Z",
      logNo: "223034929698",
      title: "둘째 글",
      categoryPath: ["개발 메모", "React"],
    },
    {
      publishedAt: "2026-04-14T04:00:00.000Z",
      logNo: "223034929755",
      title: "세 번째 정리",
      categoryPath: ["개발 메모", "TypeScript"],
    },
  ],
}

const appendStructurePreviewPost = ({
  items,
  post,
  options,
}: {
  items: StructurePreviewTreeNode[]
  post: (typeof structurePreviewSample.posts)[number]
  options: ExportOptions["structure"]
}) => {
  const postFolderNamePreview = getTemplatePreview(() =>
    buildPostFolderName({
      post: {
        blogId: "mym0404",
        logNo: post.logNo,
        title: post.title,
        publishedAt: post.publishedAt,
        categoryName: post.categoryPath.at(-1),
      },
      options: {
        structure: options,
      },
    }),
  )
  const postTree: StructurePreviewTreeNode = {
    kind: "folder",
    name: postFolderNamePreview.status === "success" ? postFolderNamePreview.text : post.logNo,
    defaultOpen: true,
    items: [
      {
        kind: "file",
        name: "index.md",
      },
    ],
  }

  if (!options.groupByCategory) {
    items.push(postTree)
    return
  }

  let currentLevel = items

  for (const segment of post.categoryPath) {
    const folderName = formatCategorySegment({
      value: segment,
      slugStyle: options.slugStyle,
      slugWhitespace: options.slugWhitespace,
    })
    const existingFolder = currentLevel.find(
      (node): node is Extract<StructurePreviewTreeNode, { kind: "folder" }> =>
        node.kind === "folder" && node.name === folderName,
    )

    if (existingFolder) {
      currentLevel = existingFolder.items
      continue
    }

    const nextFolder: StructurePreviewTreeNode = {
      kind: "folder",
      name: folderName,
      defaultOpen: true,
      items: [],
    }

    currentLevel.push(nextFolder)
    currentLevel = nextFolder.items
  }

  currentLevel.push(postTree)
}

export const buildStructurePreviewTree = ({
  outputDir,
  options,
}: {
  outputDir: string
  options: ExportOptions
}): StructurePreviewTreeNode => {
  const rootName = outputDir.trim() || "./output"
  const rootItems: StructurePreviewTreeNode[] = []

  structurePreviewSample.posts.forEach((post) => {
    appendStructurePreviewPost({
      items: rootItems,
      post,
      options: options.structure,
    })
  })

  if (
    options.assets.imageHandlingMode !== "remote" &&
    (options.assets.downloadImages || options.assets.downloadThumbnails)
  ) {
    const publicItems: StructurePreviewTreeNode[] = []

    if (options.assets.downloadImages) {
      publicItems.push({
        kind: "file",
        name: "b7d3f1-cover.jpg",
      })
    }

    if (options.assets.downloadThumbnails && options.assets.thumbnailSource !== "none") {
      publicItems.push({
        kind: "file",
        name: "18ce42-thumb.jpg",
      })
    }

    if (publicItems.length > 0) {
      rootItems.push({
        kind: "folder",
        name: "public",
        items: publicItems,
      })
    }
  }

  rootItems.push({
    kind: "file",
    name: "manifest.json",
  })

  return {
    kind: "folder",
    name: rootName,
    defaultOpen: true,
    items: rootItems,
  }
}

export const StructurePreviewTree = ({
  node,
  depth = 0,
}: {
  node: StructurePreviewTreeNode
  depth?: number
}) => {
  if (node.kind === "file") {
    return (
      <Box
        data-tree-kind="file"
        sx={{
          alignItems: "center",
          borderRadius: 2,
          color: "fg.muted",
          display: "flex",
          gap: 2,
          minHeight: 28,
          ml: depth > 0 ? 2 : 0,
          px: 2,
          py: 1,
        }}
      >
        <FileIcon size={14} />
        <Text
          sx={{
            fontFamily: "mono",
            fontSize: 0,
            lineHeight: "20px",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.name}
        </Text>
      </Box>
    )
  }

  return (
    <Details open sx={{ display: "grid", gap: 1 }}>
      <Details.Summary>
        <Box
          sx={{
            alignItems: "center",
            borderRadius: 2,
            color: "fg.default",
            cursor: "default",
            display: "flex",
            gap: 2,
            minHeight: 28,
            ml: depth > 0 ? 2 : 0,
            px: 2,
            py: 1,
          }}
        >
          <ChevronDownIcon size={14} fill="var(--fgColor-muted)" />
          <FileDirectoryIcon size={14} fill="var(--fgColor-accent)" />
          <Text
            sx={{
              fontFamily: "mono",
              fontSize: 0,
              fontWeight: "semibold",
              lineHeight: "20px",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {node.name}
          </Text>
        </Box>
      </Details.Summary>
      <Box
        sx={{
          borderLeft: depth > 0 ? "1px solid" : undefined,
          borderColor: "border.default",
          display: "grid",
          gap: 1,
          pl: depth > 0 ? 2 : 0,
        }}
      >
        {node.items.map((child, index) => (
          <StructurePreviewTree
            key={`${node.name}:${child.name}:${index}`}
            node={child}
            depth={depth + 1}
          />
        ))}
      </Box>
    </Details>
  )
}
