# Block Template Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Markdown-shaped AST body pipeline with parser-owned block templates, safe expression evaluation, pre-render asset resolution, and per-post export pipelines.

**Architecture:** Parser blocks produce `BlockRenderInput` and `AssetCandidate` instead of `AstBlock`. A template renderer evaluates only whitelisted expressions, while a pre-render asset resolver injects final URLs into props and a job-scoped upload registry prevents duplicate uploads. The export job runs post pipelines independently and records stage-level failures without a post-export Markdown rewrite phase.

**Tech Stack:** Node.js ESM, TypeScript, Bun runtime, React, Vitest, Testing Library, Oxc parser, existing Naver parser/export/upload modules.

**VCS Rule:** Do not commit unless the user explicitly asks. This repository's project instruction overrides the generic frequent-commit guidance.

---

## File Structure

- Create `src/domain/template/Types.ts`
  - Owns `TemplateValue`, `BlockRenderInput`, `AssetCandidate`, `BlockTemplateDefinition`, `PostPipelineFailure`, and upload registry domain types.
- Create `src/domain/template/TemplateExpression.spec.ts`
  - Focused tests for allowed and blocked template expression behavior.
- Create `src/domain/template/TemplateExpression.ts`
  - Parses `${...}` expression bodies with Oxc and evaluates only supported AST nodes.
- Create `src/markdown/BlockTemplateRenderer.spec.ts`
  - Tests full template string rendering, caller error wrapping, and body joining.
- Create `src/markdown/BlockTemplateRenderer.ts`
  - Renders `BlockRenderInput[]` into Markdown body text.
- Create `src/exporting/assets/AssetCandidateResolver.spec.ts`
  - Tests final URL injection, missing target path failure, and `assetRole` option handling.
- Create `src/exporting/assets/AssetCandidateResolver.ts`
  - Applies asset options, calls `AssetStore`, and mutates cloned props at `targetPropPath`.
- Create `src/exporting/upload/UploadRegistry.spec.ts`
  - Tests same-asset upload dedupe, in-flight sharing, resume seed, and failure fan-out.
- Create `src/exporting/upload/UploadRegistry.ts`
  - Job-scoped upload registry used by post pipelines.
- Create `src/exporting/post/PostPipeline.ts`
  - Runs `fetch -> preprocess -> asset-download -> asset-upload -> render -> write` for one post.
- Create `src/exporting/post/PostPipeline.spec.ts`
  - Unit tests for stage order, stage failure recording, and independent post failure shape.
- Modify `src/domain/ast/Types.ts`
  - Remove body AST contracts from the main parser/export path and re-home remaining post-level types that are still needed.
- Modify `src/domain/export-options/Types.ts`
  - Keep `blockOutputs.templates` as the only block output option shape.
- Modify `src/domain/export-options/ExportOptions.ts`
  - Clone only template strings.
- Modify `src/domain/export-options/PersistedExportOptions.ts`
  - Persist the new `blockOutputs.templates` shape only.
- Modify `src/domain/export-options/DefaultExportOptions.ts`
  - Default `blockOutputs` to `{ templates: {} }`.
- Modify `src/parsing/naver-blog/core/BaseBlock.ts`
  - Change parser block conversion return contract to `ParsedBlockOutput`.
- Modify `src/parsing/naver-blog/core/BaseEditor.ts`
  - Collect `renderInputs`, `assetCandidates`, tags, videos, and block evidence from parser blocks.
- Modify `src/parsing/naver-blog/core/PostParser.ts`
  - Return `ParsedPost` with `renderInputs` and `assetCandidates`.
- Modify `src/parsing/naver-blog/NaverBlog.ts`
  - Expose `getBlockTemplateDefinitions()`.
- Modify `src/parsing/naver-blog/se2/**/*Block.ts`, `src/parsing/naver-blog/se3/**/*Block.ts`, `src/parsing/naver-blog/se4/**/*Block.ts`
  - Convert each supported block to named props, default preset template, and asset candidates.
- Modify `src/markdown/MarkdownRenderer.ts`
  - Keep frontmatter assembly but call the template renderer after assets are resolved.
- Remove or stop importing `src/markdown/AstMarkdownRenderer.ts`
  - Delete only after all imports are gone.
- Modify `src/exporting/assets/AssetStore.ts`
  - Accept `assetRole` instead of `kind`, keep source/hash download cache, and expose local asset path needed by upload registry.
- Modify `src/exporting/workflow/NaverBlogExporter.ts`
  - Create one `AssetStore` and one `UploadRegistry` per export job, run post pipelines, and remove post-export upload-ready handoff.
- Modify `src/exporting/post/PostExportUnit.ts`
  - Replace with `PostPipeline` or keep as a thin wrapper around `PostPipeline`.
- Modify `src/exporting/manifest/ExportManifestProgress.ts`
  - Record upload registry progress and post pipeline stage failures.
- Modify `src/exporting/post/PostExportResult.ts`
  - Add stage failure fields and remove rewrite status from post-level success output.
- Modify `src/exporting/upload/ImageUploadPhase.ts`
  - Keep the runtime upload client boundary, but let `UploadRegistry` call it per unique local asset.
- Remove or stop using `src/exporting/upload/ImageUploadRewriter.ts`
  - No Markdown rewrite after upload.
- Modify `src/domain/export-job/Types.ts`
  - Add per-post pipeline status and remove upload rewrite state from active output contracts.
- Modify `src/domain/export-job/ExportJobState.ts`
  - Remove `upload-ready` as a terminal handoff state for new jobs.
- Modify `src/server/routes/ExportRoutes.ts`
  - Accept upload provider payload in `POST /api/export` when `download-and-upload` is selected.
- Modify `src/server/routes/UploadRoutes.ts`
  - Remove `POST /api/export/:jobId/upload`; keep `GET /api/upload-providers`.
- Modify `src/server/upload/HttpUploadConfig.ts`
  - Normalize provider fields for export request runtime use without persisting secrets.
- Modify `src/server/jobs/HttpExportJobRunner.ts`
  - Pass runtime upload config into `NaverBlogExporter`.
- Modify `src/server/jobs/JobStore.ts`, `src/server/jobs/JobStoreFactory.ts`, `src/server/jobs/ExportJobManifest.ts`
  - Store sanitized job state, upload registry summaries, and stage failures.
- Modify `src/exporting/workflow/DetectedBlockTemplateScanner.ts`
  - Return template definition keys and representative props detected from parsed post content.
- Modify `src/domain/block-scan/Types.ts`
  - Rename detected output types to template definition types.
- Modify `src/ui/features/options/BlockTemplateOptions.tsx`
  - Replace output variant controls with block template cards.
- Create `src/ui/features/options/BlockTemplateEditor.tsx`
  - Shows preset buttons, textarea, variable list, preview, and validation errors.
- Create `src/ui/features/options/BlockTemplateEditor.spec.tsx`
  - Component coverage for preset-to-textarea behavior and validation.
- Modify `src/ui/features/options/ExportOptionsPanel.tsx`
  - Mount the block template editor in the markdown step.
- Modify `src/ui/features/options/ExportOptionsPanel.spec.tsx`
  - Verify block template option state through `blockOutputs.templates`.
- Modify `src/ui/features/job-results/UploadPanel.tsx`
  - Remove manual upload start form from result state.
- Modify `src/ui/features/job-results/JobResultsPanel.tsx`
  - Show per-post stage and failure reason during and after export.
- Modify `src/ui/app/App.tsx`, `src/ui/app/AppStepView.tsx`, `src/ui/features/common/shell/WizardFlow.tsx`
  - Move upload provider input before export start for `download-and-upload`.
- Modify `tests/e2e/scenarios/ui-smoke.ts`, `tests/e2e/scenarios/ui-live-upload.ts`, `tests/e2e/scenarios/ui-resume-smoke.ts`
  - Update wizard, upload, and resume smoke flows.
- Modify `.agents/knowledge/architecture.md`, `.agents/knowledge/parser-architecture.md`, `.agents/knowledge/upload.md`, `.agents/knowledge/domain.md`
  - Record the new parser output, asset, upload, and export pipeline contracts.
- Modify root `AGENTS.md`
  - Update project overview/runtime notes only if the implementation changes persistent architecture or validation routes.

## Task 1: Domain Contracts And Export Option Shape

**Files:**
- Create: `src/domain/template/Types.ts`
- Modify: `src/domain/ast/Types.ts`
- Modify: `src/domain/export-options/Types.ts`
- Modify: `src/domain/export-options/DefaultExportOptions.ts`
- Modify: `src/domain/export-options/ExportOptions.ts`
- Modify: `src/domain/export-options/PersistedExportOptions.ts`
- Test: `src/domain/export-options/ExportOptions.spec.ts`

- [ ] **Step 1: Write failing option-shape tests**

Add these tests to `src/domain/export-options/ExportOptions.spec.ts`:

```ts
it("stores block output templates as plain strings", () => {
  const options = cloneExportOptions({
    blockOutputs: {
      templates: {
        "naver-se4:image": "![${alt}](${url})",
      },
    },
  })

  expect(options.blockOutputs.templates).toEqual({
    "naver-se4:image": "![${alt}](${url})",
  })
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
mise exec -- pnpm test:offline -- src/domain/export-options/ExportOptions.spec.ts
```

Expected:

```text
FAIL src/domain/export-options/ExportOptions.spec.ts
```

The failure should mention `templates` missing.

- [ ] **Step 3: Add template domain types**

Create `src/domain/template/Types.ts`:

```ts
export type TemplateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TemplateValue[]
  | { [key: string]: TemplateValue }

export type BlockRenderInput = {
  template: string
  props: Record<string, TemplateValue>
}

export type AssetCandidate = {
  assetRole: "image" | "thumbnail"
  sourceUrl: string
  targetPropPath: string[]
  dedupKey: string
  required: boolean
}

export type TemplatePropDefinition = {
  label: string
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "string?"
    | "number?"
    | "boolean?"
    | "object?"
    | "array?"
}

export type BlockTemplateDefinition = {
  key: string
  label: string
  presets: {
    id: string
    label: string
    template: string
  }[]
  props: Record<string, TemplatePropDefinition>
}

export type ParsedPost = {
  tags: string[]
  renderInputs: BlockRenderInput[]
  assetCandidates: AssetCandidate[]
  videos: {
    title: string
    thumbnailUrl: string | null
    sourceUrl: string
    vid: string | null
    inkey: string | null
    width: number | null
    height: number | null
  }[]
}

export type PostPipelineFailure = {
  stage: "fetch" | "preprocess" | "asset-download" | "asset-upload" | "render" | "write"
  message: string
}

export type UploadRegistryEntry = {
  uploadKey: string
  status: "pending" | "uploading" | "uploaded" | "failed"
  localPath: string
  uploadedUrl?: string
  message?: string
}

export type UploadRegistrySnapshot = Record<string, UploadRegistryEntry>
```

- [ ] **Step 4: Define export option types**

In `src/domain/export-options/Types.ts`, define the `blockOutputs` field as:

```ts
  blockOutputs: {
    templates: Partial<Record<string, string>>
  }
```

In `src/domain/export-options/DefaultExportOptions.ts`, change the default to:

```ts
  blockOutputs: {
    templates: {},
  },
```

- [ ] **Step 5: Clone template strings**

In `src/domain/export-options/ExportOptions.ts`, add:

```ts
const pickBlockTemplates = (blockOutputs?: PartialExportOptions["blockOutputs"]) =>
  Object.fromEntries(
    Object.entries(blockOutputs?.templates ?? {}).filter(
      (entry): entry is [string, string] =>
        Boolean(entry[0].trim()) && typeof entry[1] === "string",
    ),
  ) satisfies ExportOptions["blockOutputs"]["templates"]
```

Then set cloned options to:

```ts
    blockOutputs: {
      templates: pickBlockTemplates(options?.blockOutputs),
    },
```

- [ ] **Step 6: Update persisted option type**

In `src/domain/export-options/PersistedExportOptions.ts`, make the persisted `blockOutputs` shape:

```ts
  blockOutputs?: {
    templates?: Record<string, string>
  }
```

Make the sanitizer return only valid string templates:

```ts
blockOutputs:
  options.blockOutputs && typeof options.blockOutputs === "object"
    ? {
        templates: Object.fromEntries(
          Object.entries(options.blockOutputs.templates ?? {}).filter(
            (entry): entry is [string, string] =>
              typeof entry[0] === "string" && typeof entry[1] === "string",
          ),
        ),
      }
    : undefined,
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/domain/export-options/ExportOptions.spec.ts
```

Expected:

```text
PASS src/domain/export-options/ExportOptions.spec.ts
```

## Task 2: Safe Template Expression Evaluator

**Files:**
- Create: `src/domain/template/TemplateExpression.ts`
- Create: `src/domain/template/TemplateExpression.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Add Oxc dependency**

Run:

```bash
mise exec -- pnpm add oxc-parser
```

Expected:

```text
dependencies:
+ oxc-parser
```

- [ ] **Step 2: Write evaluator tests**

Create `src/domain/template/TemplateExpression.spec.ts`:

```ts
import { describe, expect, it } from "vitest"

import { evaluateTemplateExpression } from "./TemplateExpression.js"

const props = {
  name: "The Mayor of Casterbridge",
  author: "Thomas Hardy",
  rating: 4,
  tags: ["classic", "novel"],
  book: {
    publisher: "Moonji",
  },
}

describe("evaluateTemplateExpression", () => {
  it("evaluates identifiers, member access, array methods, and template literals", () => {
    expect(evaluateTemplateExpression("name", props)).toBe("The Mayor of Casterbridge")
    expect(evaluateTemplateExpression("book.publisher", props)).toBe("Moonji")
    expect(evaluateTemplateExpression("tags.map(tag => tag.toUpperCase()).join(', ')", props)).toBe(
      "CLASSIC, NOVEL",
    )
    expect(evaluateTemplateExpression("`${name} / ${author}`", props)).toBe(
      "The Mayor of Casterbridge / Thomas Hardy",
    )
  })

  it("requires users to handle nullable output explicitly", () => {
    expect(evaluateTemplateExpression("missing ?? 'unknown'", props)).toBe("unknown")
    expect(() => evaluateTemplateExpression("missing", props)).toThrow(/missing identifier/)
  })

  it("blocks globals, constructors, arbitrary calls, and mutation", () => {
    expect(() => evaluateTemplateExpression("process.env", props)).toThrow(/blocked identifier/)
    expect(() => evaluateTemplateExpression("name.constructor", props)).toThrow(/blocked property/)
    expect(() => evaluateTemplateExpression("Date.now()", props)).toThrow(/blocked call/)
    expect(() => evaluateTemplateExpression("rating++", props)).toThrow(/unsupported expression/)
  })

  it("rejects object and array final values", () => {
    expect(() => evaluateTemplateExpression("tags", props)).toThrow(/unsupported final value/)
    expect(() => evaluateTemplateExpression("book", props)).toThrow(/unsupported final value/)
  })
})
```

- [ ] **Step 3: Run the focused failing test**

Run:

```bash
mise exec -- pnpm test:offline -- src/domain/template/TemplateExpression.spec.ts
```

Expected:

```text
FAIL src/domain/template/TemplateExpression.spec.ts
```

The failure should mention `Cannot find module './TemplateExpression.js'`.

- [ ] **Step 4: Implement the evaluator**

Create `src/domain/template/TemplateExpression.ts` with these exported functions and guards:

```ts
import { parseSync } from "oxc-parser"

import type { TemplateValue } from "./Types.js"

const blockedIdentifiers = new Set(["process", "require", "globalThis", "window", "document"])
const blockedProperties = new Set(["constructor", "prototype", "__proto__"])
const allowedArrayMethods = new Set(["map", "filter", "join", "slice"])
const allowedStringMethods = new Set(["trim", "replace", "toLowerCase", "toUpperCase"])

type PlainObject = Record<string, TemplateValue>

const isPlainObject = (value: TemplateValue): value is PlainObject =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype

const assertPropertyAllowed = (propertyName: string) => {
  if (blockedProperties.has(propertyName)) {
    throw new Error(`blocked property: ${propertyName}`)
  }
}

const getProperty = (target: TemplateValue, propertyName: string): TemplateValue => {
  assertPropertyAllowed(propertyName)

  if (Array.isArray(target)) {
    if (propertyName === "length") {
      return target.length
    }
    throw new Error(`missing property: ${propertyName}`)
  }

  if (typeof target === "string") {
    if (propertyName === "length") {
      return target.length
    }
    throw new Error(`missing property: ${propertyName}`)
  }

  if (!isPlainObject(target) || !(propertyName in target)) {
    throw new Error(`missing property: ${propertyName}`)
  }

  return target[propertyName]
}

const toFinalValue = (value: TemplateValue) => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (value === null || value === undefined) {
    throw new Error("unsupported final value: nullish")
  }

  throw new Error("unsupported final value: object")
}

export const evaluateTemplateExpression = (
  expression: string,
  props: Record<string, TemplateValue>,
): string | number | boolean => {
  const parsed = parseSync("template-expression.ts", `(${expression})`, {
    sourceType: "script",
  })
  const statement = parsed.program.body[0]

  if (!statement || statement.type !== "ExpressionStatement") {
    throw new Error("unsupported expression")
  }

  const evaluate = (node: unknown, scope: Record<string, TemplateValue>): TemplateValue => {
    if (!node || typeof node !== "object" || !("type" in node)) {
      throw new Error("unsupported expression")
    }

    const expressionNode = node as {
      type: string
      [key: string]: unknown
    }

    switch (expressionNode.type) {
      case "Identifier": {
        const name = String(expressionNode.name)
        if (blockedIdentifiers.has(name)) {
          throw new Error(`blocked identifier: ${name}`)
        }
        if (!(name in scope)) {
          throw new Error(`missing identifier: ${name}`)
        }
        return scope[name]
      }
      case "StringLiteral":
      case "NumericLiteral":
      case "BooleanLiteral":
        return expressionNode.value as string | number | boolean
      case "NullLiteral":
        return null
      case "TemplateLiteral":
        return (expressionNode.quasis as Array<{ value: { cooked: string } }>).reduce(
          (text, quasi, index) => {
            const expressionValue =
              index < (expressionNode.expressions as unknown[]).length
                ? String(evaluate((expressionNode.expressions as unknown[])[index], scope))
                : ""
            return `${text}${quasi.value.cooked}${expressionValue}`
          },
          "",
        )
      case "MemberExpression": {
        const target = evaluate(expressionNode.object, scope)
        const propertyName =
          expressionNode.computed === true
            ? String(evaluate(expressionNode.property, scope))
            : String((expressionNode.property as { name?: string }).name)
        return getProperty(target, propertyName)
      }
      case "ChainExpression":
        return evaluate(expressionNode.expression, scope)
      case "LogicalExpression": {
        const left = evaluate(expressionNode.left, scope)
        if (expressionNode.operator === "??") {
          return left === null || left === undefined ? evaluate(expressionNode.right, scope) : left
        }
        if (expressionNode.operator === "&&") {
          return left ? evaluate(expressionNode.right, scope) : left
        }
        if (expressionNode.operator === "||") {
          return left || evaluate(expressionNode.right, scope)
        }
        throw new Error("unsupported expression")
      }
      case "ConditionalExpression":
        return evaluate(expressionNode.test, scope)
          ? evaluate(expressionNode.consequent, scope)
          : evaluate(expressionNode.alternate, scope)
      default:
        throw new Error(`unsupported expression: ${expressionNode.type}`)
    }
  }

  return toFinalValue(evaluate(statement.expression, props))
}
```

This first implementation intentionally fails the method-call cases. Keep it small, then extend it in the next step.

- [ ] **Step 5: Add whitelisted method evaluation**

In `TemplateExpression.ts`, handle `CallExpression` with these rules:

```ts
case "CallExpression": {
  const callee = expressionNode.callee as { type?: string; object?: unknown; property?: unknown }
  if (callee.type !== "MemberExpression") {
    throw new Error("blocked call")
  }

  const target = evaluate(callee.object, scope)
  const methodName = String((callee.property as { name?: string }).name)
  const args = (expressionNode.arguments as unknown[]).map((argument) => evaluate(argument, scope))

  if (typeof target === "string" && allowedStringMethods.has(methodName)) {
    if (methodName === "trim") {
      return target.trim()
    }
    if (methodName === "replace") {
      return target.replace(String(args[0] ?? ""), String(args[1] ?? ""))
    }
    if (methodName === "toLowerCase") {
      return target.toLowerCase()
    }
    if (methodName === "toUpperCase") {
      return target.toUpperCase()
    }
  }

  if (Array.isArray(target) && allowedArrayMethods.has(methodName)) {
    if (methodName === "join") {
      return target.map(String).join(String(args[0] ?? ","))
    }
    if (methodName === "slice") {
      return target.slice(Number(args[0] ?? 0), args[1] === undefined ? undefined : Number(args[1]))
    }
  }

  throw new Error(`blocked call: ${methodName}`)
}
```

Then add `ArrowFunctionExpression` support only inside array `map` and `filter`. Do not execute functions from props.

- [ ] **Step 6: Run evaluator tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/domain/template/TemplateExpression.spec.ts
```

Expected:

```text
PASS src/domain/template/TemplateExpression.spec.ts
```

## Task 3: Block Template Renderer

**Files:**
- Create: `src/markdown/BlockTemplateRenderer.ts`
- Create: `src/markdown/BlockTemplateRenderer.spec.ts`

- [ ] **Step 1: Write renderer tests**

Create `src/markdown/BlockTemplateRenderer.spec.ts`:

```ts
import { describe, expect, it } from "vitest"

import { renderBlockTemplates } from "./BlockTemplateRenderer.js"

describe("renderBlockTemplates", () => {
  it("renders plain text and expressions from props", () => {
    const markdown = renderBlockTemplates([
      {
        template: "## ${title}",
        props: {
          title: "Hello",
        },
      },
      {
        template: "![${alt}](${url})",
        props: {
          alt: "cover",
          url: "assets/cover.png",
        },
      },
    ])

    expect(markdown).toBe("## Hello\n\n![cover](assets/cover.png)")
  })

  it("fails without fallback when an expression cannot be evaluated", () => {
    expect(() =>
      renderBlockTemplates([
        {
          template: "${missing}",
          props: {},
        },
      ]),
    ).toThrow(/missing identifier/)
  })
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
mise exec -- pnpm test:offline -- src/markdown/BlockTemplateRenderer.spec.ts
```

Expected:

```text
FAIL src/markdown/BlockTemplateRenderer.spec.ts
```

- [ ] **Step 3: Implement template rendering**

Create `src/markdown/BlockTemplateRenderer.ts`:

```ts
import type { BlockRenderInput } from "../domain/template/Types.js"

import { evaluateTemplateExpression } from "../domain/template/TemplateExpression.js"

const expressionPattern = /\$\{([^}]*)\}/g

export const renderBlockTemplate = ({ template, props }: BlockRenderInput) =>
  template.replace(expressionPattern, (_match, expression: string) =>
    String(evaluateTemplateExpression(expression.trim(), props)),
  )

export const renderBlockTemplates = (inputs: BlockRenderInput[]) =>
  inputs
    .map(renderBlockTemplate)
    .filter((section) => section.trim().length > 0)
    .join("\n\n")
    .trim()
```

- [ ] **Step 4: Run renderer tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/markdown/BlockTemplateRenderer.spec.ts
```

Expected:

```text
PASS src/markdown/BlockTemplateRenderer.spec.ts
```

## Task 4: Parser Block Template Definitions And Stable Keys

**Files:**
- Modify: `src/parsing/naver-blog/core/BaseBlock.ts`
- Modify: `src/parsing/naver-blog/core/BaseEditor.ts`
- Modify: `src/parsing/naver-blog/core/PostParser.ts`
- Modify: `src/parsing/naver-blog/NaverBlog.ts`
- Modify: `src/parsing/naver-blog/core/PostParser.spec.ts`
- Modify: representative parser specs:
  - `src/parsing/naver-blog/se4/blocks/ImageBlock.spec.ts`
  - `src/parsing/naver-blog/se4/blocks/TableBlock.spec.ts`
  - `src/parsing/naver-blog/se3/blocks/SubjectMatterBlock.spec.ts`

- [ ] **Step 1: Write parser contract tests**

In `src/parsing/naver-blog/core/PostParser.spec.ts`, add:

```ts
it("returns render inputs and asset candidates instead of AST blocks", () => {
  const parsed = parsePostHtml({
    html: '<div class="se-main-container"><p class="se-text-paragraph">Hello</p></div>',
    sourceUrl: "https://blog.naver.com/test/1",
    options: {
      blockOutputs: {
        templates: {},
      },
    },
  })

  expect(parsed).not.toHaveProperty("blocks")
  expect(parsed.renderInputs).toEqual([
    {
      template: "${text}",
      props: {
        text: "Hello",
      },
    },
  ])
  expect(parsed.assetCandidates).toEqual([])
})
```

In `src/parsing/naver-blog/se4/blocks/ImageBlock.spec.ts`, add a focused image test:

```ts
it("returns final-url props and an asset candidate without sourceUrl props", () => {
  const parsed = parseImageBlock({
    html: '<img src="https://example.com/a.png" alt="A" />',
    blockOutputs: {
      templates: {},
    },
  })

  expect(parsed.renderInputs[0]).toMatchObject({
    props: {
      url: "",
      alt: "A",
    },
  })
  expect(parsed.renderInputs[0]?.props).not.toHaveProperty("sourceUrl")
  expect(parsed.assetCandidates).toEqual([
    {
      assetRole: "image",
      sourceUrl: "https://example.com/a.png",
      targetPropPath: ["url"],
      dedupKey: "https://example.com/a.png",
      required: true,
    },
  ])
})
```

- [ ] **Step 2: Run the focused failing tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/parsing/naver-blog/core/PostParser.spec.ts src/parsing/naver-blog/se4/blocks/ImageBlock.spec.ts
```

Expected:

```text
FAIL
```

The failure should show `blocks` still present and `renderInputs` missing.

- [ ] **Step 3: Change parser block contracts**

In `src/parsing/naver-blog/core/BaseBlock.ts`, replace the AST return contract with:

```ts
import type {
  AssetCandidate,
  BlockRenderInput,
  BlockTemplateDefinition,
} from "../../../domain/template/Types.js"

export type ParsedBlockOutput = {
  renderInputs: BlockRenderInput[]
  assetCandidates?: AssetCandidate[]
}

export abstract class BaseBlock {
  abstract readonly id: string
  abstract readonly key: string
  abstract readonly label: string
  abstract readonly templateDefinition: BlockTemplateDefinition
  readonly story?: ParserBlockStoryMetadata

  abstract match(context: ParserBlockContext): boolean

  abstract convert(context: ParserBlockConvertContext): ParsedBlockOutput
}
```

Container blocks should combine child outputs:

```ts
override convert({ $node, matchNode, path }: ParserBlockConvertContext) {
  return $node
    .contents()
    .toArray()
    .map((node, index) => matchNode(node, `${path}.${index}`))
    .reduce(
      (merged, output) => ({
        renderInputs: [...merged.renderInputs, ...output.renderInputs],
        assetCandidates: [...merged.assetCandidates, ...(output.assetCandidates ?? [])],
      }),
      { renderInputs: [], assetCandidates: [] } satisfies Required<ParsedBlockOutput>,
    )
}
```

- [ ] **Step 4: Change editor aggregation**

In `src/parsing/naver-blog/core/BaseEditor.ts`, make `matchNode` return `ParsedBlockOutput`, and aggregate top-level results into:

```ts
return nodes
  .map((node, index) => matchNode(node, String(index)))
  .reduce(
    (parsedPost, output) => ({
      renderInputs: [...parsedPost.renderInputs, ...output.renderInputs],
      assetCandidates: [...parsedPost.assetCandidates, ...(output.assetCandidates ?? [])],
    }),
    { renderInputs: [], assetCandidates: [] },
  )
```

Keep block evidence, but record `templateDefinitionKey: block.key` instead of AST `blockType`.

- [ ] **Step 5: Expose template definitions**

In `src/parsing/naver-blog/NaverBlog.ts`, add:

```ts
getBlockTemplateDefinitions() {
  return this.editors.flatMap((editor) => editor.getBlockTemplateDefinitions())
}
```

Add the corresponding editor method in `BaseEditor`:

```ts
getBlockTemplateDefinitions() {
  return this.supportedBlocks.map((block) => block.templateDefinition)
}
```

- [ ] **Step 6: Convert representative blocks first**

Start with paragraph, image, table, and subject matter blocks. The paragraph default pattern is:

```ts
readonly key = "naver-se4:paragraph"
readonly templateDefinition = {
  key: this.key,
  label: this.label,
  presets: [
    {
      id: "paragraph",
      label: "Paragraph",
      template: "${text}",
    },
  ],
  props: {
    text: { label: "본문", type: "string" },
  },
} satisfies BlockTemplateDefinition
```

The image default pattern is:

```ts
readonly key = "naver-se4:image"
readonly templateDefinition = {
  key: this.key,
  label: this.label,
  presets: [
    {
      id: "markdown-image",
      label: "Markdown Image",
      template: "![${alt}](${url})",
    },
  ],
  props: {
    url: { label: "이미지 URL", type: "string" },
    alt: { label: "대체 텍스트", type: "string?" },
    caption: { label: "캡션", type: "string?" },
  },
} satisfies BlockTemplateDefinition
```

Each image block conversion must return:

```ts
{
  renderInputs: [
    {
      template,
      props: {
        url: "",
        alt,
        caption,
      },
    },
  ],
  assetCandidates: [
    {
      assetRole: "image",
      sourceUrl,
      targetPropPath: ["url"],
      dedupKey: normalizedSourceUrl,
      required: true,
    },
  ],
}
```

- [ ] **Step 7: Run parser tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/parsing/naver-blog/core/PostParser.spec.ts src/parsing/naver-blog/se4/blocks/ImageBlock.spec.ts src/parsing/naver-blog/se4/blocks/TableBlock.spec.ts src/parsing/naver-blog/se3/blocks/SubjectMatterBlock.spec.ts
```

Expected:

```text
PASS
```

## Task 5: Asset Candidate Resolution Before Render

**Files:**
- Create: `src/exporting/assets/AssetCandidateResolver.ts`
- Create: `src/exporting/assets/AssetCandidateResolver.spec.ts`
- Modify: `src/exporting/assets/AssetStore.ts`
- Modify: `src/exporting/assets/AssetStore.spec.ts`

- [ ] **Step 1: Write resolver tests**

Create `src/exporting/assets/AssetCandidateResolver.spec.ts`:

```ts
import { describe, expect, it, vi } from "vitest"

import type { AssetCandidate, BlockRenderInput } from "../../domain/template/Types.js"

import { resolveAssetCandidatesForRender } from "./AssetCandidateResolver.js"

const renderInputs = (): BlockRenderInput[] => [
  {
    template: "![${alt}](${url})",
    props: {
      url: "",
      alt: "cover",
    },
  },
]

const candidates = (): AssetCandidate[] => [
  {
    assetRole: "image",
    sourceUrl: "https://example.com/cover.png",
    targetPropPath: ["0", "url"],
    dedupKey: "https://example.com/cover.png",
    required: true,
  },
]

describe("resolveAssetCandidatesForRender", () => {
  it("injects final URLs before rendering", async () => {
    const resolveAsset = vi.fn(async () => ({
      reference: "assets/cover.png",
      record: {
        kind: "image" as const,
        sourceUrl: "https://example.com/cover.png",
        reference: "assets/cover.png",
        relativePath: "assets/cover.png",
        storageMode: "relative" as const,
        uploadCandidate: null,
      },
    }))

    const result = await resolveAssetCandidatesForRender({
      renderInputs: renderInputs(),
      assetCandidates: candidates(),
      resolveAsset,
    })

    expect(result.renderInputs[0]?.props.url).toBe("assets/cover.png")
    expect(resolveAsset).toHaveBeenCalledWith({
      assetRole: "image",
      sourceUrl: "https://example.com/cover.png",
      dedupKey: "https://example.com/cover.png",
    })
  })
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
mise exec -- pnpm test:offline -- src/exporting/assets/AssetCandidateResolver.spec.ts
```

Expected:

```text
FAIL
```

- [ ] **Step 3: Implement resolver**

Create `src/exporting/assets/AssetCandidateResolver.ts`:

```ts
import type { AssetRecord } from "../../domain/export-job/Types.js"
import type {
  AssetCandidate,
  BlockRenderInput,
  TemplateValue,
} from "../../domain/template/Types.js"

type ResolveAsset = (input: {
  assetRole: AssetCandidate["assetRole"]
  sourceUrl: string
  dedupKey: string
}) => Promise<{
  reference: string
  record: AssetRecord
}>

const cloneTemplateValue = (value: TemplateValue): TemplateValue => {
  if (Array.isArray(value)) {
    return value.map(cloneTemplateValue)
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, cloneTemplateValue(child)]),
    )
  }
  return value
}

const setPathValue = ({
  renderInputs,
  path,
  value,
}: {
  renderInputs: BlockRenderInput[]
  path: string[]
  value: string
}) => {
  const [inputIndexText, ...propPath] = path
  const inputIndex = Number(inputIndexText)
  const renderInput = renderInputs[inputIndex]

  if (!Number.isInteger(inputIndex) || !renderInput || propPath.length === 0) {
    throw new Error(`Invalid asset target path: ${path.join(".")}`)
  }

  let target: TemplateValue = renderInput.props
  for (const segment of propPath.slice(0, -1)) {
    if (!target || typeof target !== "object" || Array.isArray(target)) {
      throw new Error(`Invalid asset target path: ${path.join(".")}`)
    }
    target = target[segment]
  }

  if (!target || typeof target !== "object" || Array.isArray(target)) {
    throw new Error(`Invalid asset target path: ${path.join(".")}`)
  }

  target[propPath[propPath.length - 1]!] = value
}

export const resolveAssetCandidatesForRender = async ({
  renderInputs,
  assetCandidates,
  resolveAsset,
}: {
  renderInputs: BlockRenderInput[]
  assetCandidates: AssetCandidate[]
  resolveAsset: ResolveAsset
}) => {
  const nextRenderInputs = renderInputs.map((input) => ({
    ...input,
    props: cloneTemplateValue(input.props) as Record<string, TemplateValue>,
  }))
  const assetRecords: AssetRecord[] = []

  for (const candidate of assetCandidates) {
    const resolved = await resolveAsset({
      assetRole: candidate.assetRole,
      sourceUrl: candidate.sourceUrl,
      dedupKey: candidate.dedupKey,
    })

    setPathValue({
      renderInputs: nextRenderInputs,
      path: candidate.targetPropPath,
      value: resolved.reference,
    })
    assetRecords.push(resolved.record)
  }

  return {
    renderInputs: nextRenderInputs,
    assetRecords,
  }
}
```

- [ ] **Step 4: Update AssetStore naming**

In `src/exporting/assets/AssetStore.ts`, rename `kind` to `assetRole` at the public boundary:

```ts
async saveAsset({
  assetRole,
  sourceUrl,
  markdownFilePath,
}: {
  assetRole: "image" | "thumbnail"
  sourceUrl: string
  markdownFilePath: string
}) {
  const shouldDownload =
    this.options.assets.imageHandlingMode !== "remote" &&
    ((assetRole === "image" && this.options.assets.downloadImages) ||
      (assetRole === "thumbnail" && this.options.assets.downloadThumbnails))
```

Keep persisted `AssetRecord.kind` only if downstream manifest contracts still use that name.

- [ ] **Step 5: Run asset tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/exporting/assets/AssetCandidateResolver.spec.ts src/exporting/assets/AssetStore.spec.ts
```

Expected:

```text
PASS
```

## Task 6: Upload Registry And Per-Post Upload Deduplication

**Files:**
- Create: `src/exporting/upload/UploadRegistry.ts`
- Create: `src/exporting/upload/UploadRegistry.spec.ts`
- Modify: `src/exporting/upload/ImageUploadPhase.ts`
- Modify: `src/exporting/upload/ImageUploadPhase.spec.ts`

- [ ] **Step 1: Write upload registry tests**

Create `src/exporting/upload/UploadRegistry.spec.ts`:

```ts
import { describe, expect, it, vi } from "vitest"

import { createUploadRegistry } from "./UploadRegistry.js"

describe("createUploadRegistry", () => {
  it("uploads the same local asset once while concurrent callers wait", async () => {
    let resolveUpload!: (value: string) => void
    const upload = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveUpload = resolve
        }),
    )
    const registry = createUploadRegistry({ upload })

    const first = registry.resolveUploadedUrl({
      uploadKey: "public/hash.png",
      localPath: "public/hash.png",
    })
    const second = registry.resolveUploadedUrl({
      uploadKey: "public/hash.png",
      localPath: "public/hash.png",
    })

    resolveUpload("https://cdn.example.com/hash.png")

    await expect(first).resolves.toBe("https://cdn.example.com/hash.png")
    await expect(second).resolves.toBe("https://cdn.example.com/hash.png")
    expect(upload).toHaveBeenCalledTimes(1)
  })

  it("seeds uploaded entries from resume state", async () => {
    const upload = vi.fn()
    const registry = createUploadRegistry({
      upload,
      seed: {
        "public/hash.png": {
          uploadKey: "public/hash.png",
          status: "uploaded",
          localPath: "public/hash.png",
          uploadedUrl: "https://cdn.example.com/hash.png",
        },
      },
    })

    await expect(
      registry.resolveUploadedUrl({
        uploadKey: "public/hash.png",
        localPath: "public/hash.png",
      }),
    ).resolves.toBe("https://cdn.example.com/hash.png")
    expect(upload).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
mise exec -- pnpm test:offline -- src/exporting/upload/UploadRegistry.spec.ts
```

Expected:

```text
FAIL
```

- [ ] **Step 3: Implement upload registry**

Create `src/exporting/upload/UploadRegistry.ts`:

```ts
import type { UploadRegistryEntry, UploadRegistrySnapshot } from "../../domain/template/Types.js"

type UploadOne = (input: { localPath: string }) => Promise<string>

export const createUploadRegistry = ({
  upload,
  seed = {},
}: {
  upload: UploadOne
  seed?: UploadRegistrySnapshot
}) => {
  const entries = new Map<string, UploadRegistryEntry>(Object.entries(seed))
  const inFlight = new Map<string, Promise<string>>()

  const resolveUploadedUrl = async ({
    uploadKey,
    localPath,
  }: {
    uploadKey: string
    localPath: string
  }) => {
    const existing = entries.get(uploadKey)

    if (existing?.status === "uploaded" && existing.uploadedUrl) {
      return existing.uploadedUrl
    }

    const existingUpload = inFlight.get(uploadKey)
    if (existingUpload) {
      return existingUpload
    }

    const uploadPromise = (async () => {
      entries.set(uploadKey, {
        uploadKey,
        localPath,
        status: "uploading",
      })

      try {
        const uploadedUrl = await upload({ localPath })
        entries.set(uploadKey, {
          uploadKey,
          localPath,
          status: "uploaded",
          uploadedUrl,
        })
        return uploadedUrl
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        entries.set(uploadKey, {
          uploadKey,
          localPath,
          status: "failed",
          message,
        })
        throw new Error(message)
      } finally {
        inFlight.delete(uploadKey)
      }
    })()

    inFlight.set(uploadKey, uploadPromise)
    return uploadPromise
  }

  const snapshot = () => Object.fromEntries(entries)

  return {
    resolveUploadedUrl,
    snapshot,
  }
}
```

- [ ] **Step 4: Run upload registry tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/exporting/upload/UploadRegistry.spec.ts
```

Expected:

```text
PASS
```

## Task 7: Post Pipeline And Export Workflow

**Files:**
- Create: `src/exporting/post/PostPipeline.ts`
- Create: `src/exporting/post/PostPipeline.spec.ts`
- Modify: `src/exporting/post/PostExportUnit.ts`
- Modify: `src/exporting/workflow/NaverBlogExporter.ts`
- Modify: `src/exporting/workflow/NaverBlogExporter.spec.ts`
- Modify: `src/exporting/manifest/ExportManifestProgress.ts`
- Modify: `src/exporting/post/PostExportResult.ts`

- [ ] **Step 1: Write post pipeline failure tests**

Create `src/exporting/post/PostPipeline.spec.ts`:

```ts
import { describe, expect, it, vi } from "vitest"

import { runPostPipeline } from "./PostPipeline.js"

describe("runPostPipeline", () => {
  it("records the stage that failed", async () => {
    const result = await runPostPipeline({
      post: {
        blogId: "blog",
        logNo: "1",
        title: "Post",
        source: "https://blog.naver.com/blog/1",
        categoryId: 1,
        categoryName: "Category",
        publishedAt: "2026-06-05",
        thumbnailUrl: null,
      },
      fetchHtml: vi.fn(async () => {
        throw new Error("network failed")
      }),
      preprocess: vi.fn(),
      resolveAssets: vi.fn(),
      render: vi.fn(),
      write: vi.fn(),
    })

    expect(result.status).toBe("failed")
    expect(result.failure).toEqual({
      stage: "fetch",
      message: "network failed",
    })
  })
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
mise exec -- pnpm test:offline -- src/exporting/post/PostPipeline.spec.ts
```

Expected:

```text
FAIL
```

- [ ] **Step 3: Implement pipeline stage wrapper**

Create `src/exporting/post/PostPipeline.ts` with this public shape:

```ts
import type { PostSummary } from "../../domain/blog/Types.js"
import type { PostPipelineFailure } from "../../domain/template/Types.js"

type PipelineStage = PostPipelineFailure["stage"]

type PipelineResult =
  | {
      status: "completed"
      markdown: string
      assetPaths: string[]
    }
  | {
      status: "failed"
      failure: PostPipelineFailure
    }

const runStage = async <T>(stage: PipelineStage, action: () => Promise<T>) => {
  try {
    return await action()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw { stage, message } satisfies PostPipelineFailure
  }
}

export const runPostPipeline = async ({
  fetchHtml,
  preprocess,
  resolveAssets,
  render,
  write,
}: {
  post: PostSummary
  fetchHtml: () => Promise<string>
  preprocess: (html: string) => Promise<unknown>
  resolveAssets: (parsed: unknown) => Promise<unknown>
  render: (resolved: unknown) => Promise<{ markdown: string; assetPaths: string[] }>
  write: (rendered: { markdown: string; assetPaths: string[] }) => Promise<void>
}): Promise<PipelineResult> => {
  try {
    const html = await runStage("fetch", fetchHtml)
    const parsed = await runStage("preprocess", () => preprocess(html))
    const resolved = await runStage("asset-download", () => resolveAssets(parsed))
    const rendered = await runStage("render", () => render(resolved))
    await runStage("write", () => write(rendered))
    return {
      status: "completed",
      ...rendered,
    }
  } catch (failure) {
    return {
      status: "failed",
      failure: failure as PostPipelineFailure,
    }
  }
}
```

Later in this task, split `resolveAssets` internally into `asset-download` and `asset-upload` when upload mode is active.

- [ ] **Step 4: Wire pipeline into exporter**

In `src/exporting/workflow/NaverBlogExporter.ts`:

- Create one `AssetStore` per export job.
- Create one `UploadRegistry` per export job when `download-and-upload` is active.
- Pass both to each `runPostPipeline` call.
- Remove the export result state that ends in `upload-ready`.
- Keep `mapConcurrent` by post.

Use this call shape inside the existing `mapConcurrent` mapper:

```ts
const result = await runPostPipeline({
  post,
  fetchHtml: () => fetcher.fetchPostHtml(post.logNo),
  preprocess: async (html) =>
    parsePostHtml({
      html,
      sourceUrl: post.source,
      options: {
        blockOutputs: options.blockOutputs,
        resolveLinkUrl,
      },
    }),
  resolveAssets: async (parsedPost) =>
    resolveAssetCandidatesForRender({
      renderInputs: parsedPost.renderInputs,
      assetCandidates: parsedPost.assetCandidates,
      resolveAsset: async (candidate) => {
        const asset = await assetStore.saveAsset({
          assetRole: candidate.assetRole,
          sourceUrl: candidate.sourceUrl,
          markdownFilePath,
        })
        return {
          reference: asset.reference,
          record: asset,
        }
      },
    }),
  render: async (resolved) => renderMarkdownPostFromTemplates({ post, category, resolved, options }),
  write: async ({ markdown }) => {
    await ensureDir(path.dirname(markdownFilePath))
    await writeFile(markdownFilePath, markdown, "utf8")
  },
})
```

- [ ] **Step 5: Run post pipeline and exporter tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/exporting/post/PostPipeline.spec.ts src/exporting/workflow/NaverBlogExporter.spec.ts
```

Expected:

```text
PASS
```

## Task 8: Server Upload Request And Secret Safety

**Files:**
- Modify: `src/domain/export-job/Types.ts`
- Modify: `src/server/routes/ExportRoutes.ts`
- Modify: `src/server/routes/UploadRoutes.ts`
- Modify: `src/server/upload/HttpUploadConfig.ts`
- Modify: `src/server/upload/HttpServer.upload-start.spec.ts`
- Modify: `src/server/upload/HttpServer.upload-security.spec.ts`
- Modify: `src/server/routes/HttpServer.routes.spec.ts`

- [ ] **Step 1: Write export-start upload tests**

In `src/server/upload/HttpServer.upload-start.spec.ts`, replace manual upload start expectations with:

```ts
it("accepts upload provider fields in the export request without persisting secrets", async () => {
  const response = await fetch(`${baseUrl}/api/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
    body: JSON.stringify({
      blogIdOrUrl: "test-blog",
      outputDir: createTestPath("http-server", "pre-export-upload-output"),
      options,
      scanResult,
      upload: {
        providerKey: "github",
        providerFields: {
          token: "ghp_test_upload_token",
          repo: "owner/repo",
          branch: "main",
        },
      },
    }),
  })

  expect(response.status).toBe(202)

  const job = await waitForJob({
    baseUrl,
    jobId: ((await response.json()) as { jobId: string }).jobId,
    accept: (current) => current.status === "completed" || current.status === "failed",
  })

  expect(JSON.stringify(job)).not.toContain("ghp_test_upload_token")
})
```

- [ ] **Step 2: Run focused failing tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/server/upload/HttpServer.upload-start.spec.ts src/server/upload/HttpServer.upload-security.spec.ts
```

Expected:

```text
FAIL
```

- [ ] **Step 3: Change export request type**

In `src/domain/export-job/Types.ts`, add runtime-only upload request input:

```ts
export type ExportUploadRuntimeConfig = {
  providerKey: string
  providerFields: Record<string, unknown>
}

export type ExportRequest = {
  blogIdOrUrl: string
  outputDir: string
  profile: "gfm"
  options: ExportOptions
  upload?: ExportUploadRuntimeConfig
}
```

Do not include `providerFields` in manifest serialization.

- [ ] **Step 4: Move provider normalization to export route**

In `src/server/routes/ExportRoutes.ts`, parse:

```ts
upload?: {
  providerKey?: string
  providerFields?: unknown
}
```

When `options.assets.imageHandlingMode === "download-and-upload"`, require `upload.providerKey` and normalized provider fields before creating the job:

```ts
const providerKey = payload.upload?.providerKey?.trim()
const providerFields = providerKey
  ? await uploadProviderSource.normalizeProviderFields(providerKey, payload.upload?.providerFields)
  : null

if (exportRequest.options.assets.imageHandlingMode === "download-and-upload") {
  if (!providerKey || !providerFields) {
    sendJson({
      response,
      statusCode: 400,
      body: { error: "providerKey와 providerFields는 필수입니다." },
    })
    return true
  }

  exportRequest.upload = {
    providerKey,
    providerFields: normalizeUploaderConfig({ uploaderKey: providerKey, providerFields }),
  }
}
```

- [ ] **Step 5: Remove manual upload route**

In `src/server/routes/UploadRoutes.ts`, keep only:

```ts
if (method === "GET" && url.pathname === "/api/upload-providers") {
  ...
}

return false
```

Delete imports only used by `POST /api/export/:jobId/upload`.

- [ ] **Step 6: Run server tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/server/routes/HttpServer.routes.spec.ts src/server/upload/HttpServer.upload-start.spec.ts src/server/upload/HttpServer.upload-security.spec.ts
```

Expected:

```text
PASS
```

## Task 9: Block Template Detection And UI Editor

**Files:**
- Modify: `src/domain/block-scan/Types.ts`
- Modify: `src/exporting/workflow/DetectedBlockTemplateScanner.ts`
- Modify: `src/exporting/workflow/DetectedBlockTemplateScanner.spec.ts`
- Create: `src/ui/features/options/BlockTemplateEditor.tsx`
- Create: `src/ui/features/options/BlockTemplateEditor.spec.tsx`
- Modify: `src/ui/features/options/BlockTemplateOptions.tsx`
- Modify: `src/ui/features/options/ExportOptionsPanel.tsx`
- Modify: `src/ui/features/options/ExportOptionsPanel.spec.tsx`
- Modify: `src/ui/app/App.workflow.spec.tsx`

- [ ] **Step 1: Write detection tests**

In `src/exporting/workflow/DetectedBlockTemplateScanner.spec.ts`, update expectations to:

```ts
expect(result.detectedTemplates).toEqual([
  {
    key: "naver-se4:image",
    props: {
      url: "",
      alt: "sample",
      caption: null,
    },
  },
])
```

Add failure behavior:

```ts
it("does not return partial template keys when detection parsing fails", async () => {
  await expect(scanner.scan()).rejects.toThrow(/block detection failed/)
  expect(cache.get("detectedTemplates")).toBeUndefined()
})
```

- [ ] **Step 2: Write editor component tests**

Create `src/ui/features/options/BlockTemplateEditor.spec.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { BlockTemplateEditor } from "./BlockTemplateEditor.js"

describe("BlockTemplateEditor", () => {
  it("copies preset template into the textarea", async () => {
    const user = userEvent.setup()
    const onTemplateChange = vi.fn()

    render(
      <BlockTemplateEditor
        definitions={[
          {
            key: "naver-se4:image",
            label: "이미지",
            presets: [
              { id: "image", label: "Image", template: "![${alt}](${url})" },
              { id: "link", label: "Link", template: "[${alt}](${url})" },
            ],
            props: {
              url: { label: "이미지 URL", type: "string" },
              alt: { label: "대체 텍스트", type: "string?" },
            },
          },
        ]}
        templates={{ "naver-se4:image": "![${alt}](${url})" }}
        props={{ "naver-se4:image": { url: "assets/a.png", alt: "A" } }}
        onTemplateChange={onTemplateChange}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Link" }))

    expect(onTemplateChange).toHaveBeenCalledWith("naver-se4:image", "[${alt}](${url})")
  })
})
```

- [ ] **Step 3: Run focused failing UI tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/exporting/workflow/DetectedBlockTemplateScanner.spec.ts src/ui/features/options/BlockTemplateEditor.spec.tsx
```

Expected:

```text
FAIL
```

- [ ] **Step 4: Implement `BlockTemplateEditor`**

Create `src/ui/features/options/BlockTemplateEditor.tsx`:

```tsx
import type { BlockTemplateDefinition, TemplateValue } from "../../../domain/template/Types.js"

import { Textarea } from "../../components/ui/Textarea.js"
import { Button } from "../../components/ui/Button.js"

export const BlockTemplateEditor = ({
  definitions,
  templates,
  props,
  onTemplateChange,
}: {
  definitions: BlockTemplateDefinition[]
  templates: Record<string, string>
  props: Record<string, Record<string, TemplateValue>>
  onTemplateChange: (key: string, template: string) => void
}) => (
  <div className="grid gap-5">
    {definitions.map((definition) => {
      const template = templates[definition.key] ?? definition.presets[0]?.template ?? ""

      return (
        <section key={definition.key} data-block-template-card={definition.key} className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-semibold text-foreground">{definition.label}</h4>
            <div className="flex flex-wrap gap-2">
              {definition.presets.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="secondary"
                  onClick={() => onTemplateChange(definition.key, preset.template)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <Textarea
            value={template}
            aria-label={`${definition.label} template`}
            onChange={(event) => onTemplateChange(definition.key, event.target.value)}
          />
          <dl className="grid gap-2 text-sm">
            {Object.entries(definition.props).map(([name, prop]) => (
              <div key={name} className="grid grid-cols-[10rem_minmax(0,1fr)] gap-3">
                <dt className="font-mono text-muted-foreground">${`{${name}}`}</dt>
                <dd>
                  {prop.label} · {prop.type}
                </dd>
              </div>
            ))}
          </dl>
          <pre data-block-template-preview={definition.key}>
            {JSON.stringify(props[definition.key] ?? {}, null, 2)}
          </pre>
        </section>
      )
    })}
  </div>
)
```

Keep visual styling aligned with existing option components during implementation.

- [ ] **Step 5: Replace markdown options panel**

In `src/ui/features/options/BlockTemplateOptions.tsx`, export a `MarkdownOptionsStep` that renders `BlockTemplateEditor` and updates:

```ts
blockOutputs: {
  templates: {
    ...current.blockOutputs.templates,
    [key]: template,
  },
}
```

Use detected template definitions already passed into the panel.

- [ ] **Step 6: Run UI tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/ui/features/options/BlockTemplateEditor.spec.tsx src/ui/features/options/ExportOptionsPanel.spec.tsx src/ui/app/App.workflow.spec.tsx
```

Expected:

```text
PASS
```

## Task 10: Result UI, E2E Flows, Fixtures, And Knowledge

**Files:**
- Modify: `src/ui/features/job-results/UploadPanel.tsx`
- Modify: `src/ui/features/job-results/JobResultsPanel.tsx`
- Modify: `src/ui/features/job-results/JobResultsPanel.spec.tsx`
- Modify: `src/ui/app/App.upload.spec.tsx`
- Modify: `tests/e2e/scenarios/ui-smoke.ts`
- Modify: `tests/e2e/scenarios/ui-live-upload.ts`
- Modify: `tests/e2e/scenarios/ui-resume-smoke.ts`
- Modify: `tests/fixtures/samples/**/expected.md`
- Modify: `.agents/knowledge/architecture.md`
- Modify: `.agents/knowledge/parser-architecture.md`
- Modify: `.agents/knowledge/upload.md`
- Modify: `.agents/knowledge/domain.md`
- Modify: `AGENTS.md` only if source-of-truth architecture notes change.

- [ ] **Step 1: Update job result tests**

In `src/ui/features/job-results/JobResultsPanel.spec.tsx`, replace upload-ready form expectations with stage display expectations:

```tsx
it("shows post pipeline stage failures", () => {
  renderJobResults({
    mode: "result",
    job: {
      ...completedJob,
      items: [
        {
          ...completedJob.items[0]!,
          status: "failed",
          failure: {
            stage: "asset-upload",
            message: "Image upload failed.",
          },
        },
      ],
    },
  })

  expect(screen.getByText("asset-upload")).toBeInTheDocument()
  expect(screen.getByText("Image upload failed.")).toBeInTheDocument()
})
```

- [ ] **Step 2: Run focused failing UI result tests**

Run:

```bash
mise exec -- pnpm test:offline -- src/ui/features/job-results/JobResultsPanel.spec.tsx src/ui/app/App.upload.spec.tsx
```

Expected:

```text
FAIL
```

- [ ] **Step 3: Remove manual upload start UI**

In `src/ui/features/job-results/UploadPanel.tsx`, remove provider form submission. Keep read-only upload summary only if job state still exposes upload progress. In `JobResultsPanel.tsx`, show per-post stage and reason from the job item failure object.

- [ ] **Step 4: Update E2E smoke flows**

In `tests/e2e/scenarios/ui-smoke.ts`:

- Replace assertions for `upload-ready` with assertions that export request contains:

```ts
upload: {
  providerKey: "github",
  providerFields: expect.objectContaining({
    token: "ghp_upload_secret",
  }),
}
```

- Replace manual `/upload` request interception with export-start upload payload interception.
- Assert the serialized job response does not contain the token string.

- [ ] **Step 5: Update live upload flow**

In `tests/e2e/scenarios/ui-live-upload.ts`:

- Fill upload provider fields before clicking export.
- Wait for final job status directly.
- Assert markdown contains uploaded URLs without a later rewrite request.
- Assert no request is made to `/api/export/:jobId/upload`.

- [ ] **Step 6: Update fixture expected Markdown**

Run focused fixture tests after parser defaults stabilize:

```bash
mise exec -- pnpm test:offline -- tests/fixtures
```

For each failing sample, update only the expected Markdown changes caused by default presets. Record intentional output changes in the fixture description file that already belongs to that sample.

- [ ] **Step 7: Update knowledge docs**

Update these files with current facts only:

- `.agents/knowledge/architecture.md`: parser output is `BlockRenderInput` plus `AssetCandidate`.
- `.agents/knowledge/parser-architecture.md`: parser blocks own `BlockTemplateDefinition`.
- `.agents/knowledge/upload.md`: upload happens inside per-post pipeline through job-scoped `UploadRegistry`.
- `.agents/knowledge/domain.md`: `.md` output is rendered from templates, not AST.

- [ ] **Step 8: Run broad verification**

Run:

```bash
mise exec -- pnpm check:local
```

Expected:

```text
check:fmt PASS
check:lint PASS
typecheck PASS
test:offline PASS
```

Then run UI smoke because this feature changes wizard flow:

```bash
mise exec -- pnpm smoke:ui
```

Expected:

```text
PASS tests/e2e/run-ui-smoke-suite.ts
```

## Self-Review

- Spec coverage:
  - `BlockRenderInput` and removal of `AstBlock` body output: Tasks 1, 4, 7.
  - Template string option shape: Tasks 1, 9.
  - Safe expression evaluation with Oxc: Task 2.
  - Template renderer without fallback: Task 3.
  - Parser-owned template definitions and stable keys: Task 4.
  - `AssetCandidate`, `assetRole`, final URL prop injection, and no source URL props: Tasks 4, 5.
  - Job-scoped upload registry, duplicate upload prevention, resume seed, secret non-persistence: Tasks 6, 8, 10.
  - Per-post pipeline stages and failure reason: Tasks 7, 10.
  - Detection flow and UI template editor: Task 9.
  - Fixture, E2E, and knowledge docs: Task 10.
- Placeholder scan:
  - The plan intentionally does not use `TBD`, `TODO`, or "implement later".
  - Parser block migration is represented by concrete contracts and representative examples. Execution must repeat the same contract across all existing block files listed in File Structure.
- Type consistency:
  - `AssetCandidate.assetRole` is used consistently and is not part of upload dedupe.
  - `blockOutputs.templates` is used consistently in domain, parser, UI, and tests.
  - `UploadRegistryEntry.uploadKey` is separate from `AssetCandidate.dedupKey`.
