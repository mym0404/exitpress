import { formatCategorySegment } from "@exitpress/domain/export-paths/PathFormat.js"
import { buildPostFolderName } from "@exitpress/domain/export-paths/PostPathTemplate.js"

import type { ExportOptions } from "@exitpress/domain/export-options/schema/ExportOptions.js"
import type { SVGProps } from "react"

import { Collapsible, CollapsibleContent } from "../../components/ui/Collapsible.js"
import { cn } from "../../lib/Cn.js"

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

const TreeChevronIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 16 16" {...props}>
    <path
      d="m6 3 5 5-5 5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
)

const TreeFolderIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 16 16" {...props}>
    <path
      d="M2 4.75c0-.97.78-1.75 1.75-1.75h2.12c.46 0 .89.18 1.22.51l.52.52c.19.19.44.29.7.29h3.94c.97 0 1.75.78 1.75 1.75v5.18c0 .97-.78 1.75-1.75 1.75H3.75A1.75 1.75 0 0 1 2 11.25z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.2"
    />
  </svg>
)

const TreeFileIcon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 16 16" {...props}>
    <path
      d="M4 2.75C4 2.34 4.34 2 4.75 2h4.94c.2 0 .39.08.53.22l1.56 1.56c.14.14.22.33.22.53v8.94c0 .41-.34.75-.75.75h-6.5A.75.75 0 0 1 4 13.25z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.2"
    />
    <path d="M9.5 2.25v2.5h2.5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
  </svg>
)

export const StructurePreviewTree = ({
  node,
  depth = 0,
}: {
  node: StructurePreviewTreeNode
  depth?: number
}) => {
  if (node.kind === "file") {
    return (
      <div
        className={cn(
          "flex min-h-7 items-center gap-1.5 rounded-md px-1.5 py-1 text-muted-foreground",
          depth > 0 && "ml-2",
        )}
        data-tree-kind="file"
      >
        <TreeFileIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate font-mono text-[0.75rem] leading-5">{node.name}</span>
      </div>
    )
  }

  return (
    <Collapsible className="grid gap-0.5" open>
      <div
        className={cn(
          "flex min-h-7 items-center gap-1.5 rounded-md px-1.5 py-1",
          depth > 0 && "ml-2",
        )}
      >
        <TreeChevronIcon className="size-3.5 shrink-0 rotate-90 text-muted-foreground" />
        <TreeFolderIcon className="size-3.5 shrink-0 text-[var(--status-running-fg)]" />
        <span className="min-w-0 truncate font-mono text-[0.75rem] leading-5 text-foreground">
          {node.name}
        </span>
      </div>
      <CollapsibleContent className="grid gap-0.5 border-l border-border pl-2.5">
        {node.items.map((child, index) => (
          <StructurePreviewTree
            key={`${node.name}:${child.name}:${index}`}
            node={child}
            depth={depth + 1}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
