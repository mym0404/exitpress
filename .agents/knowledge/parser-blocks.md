# Parser Blocks

## Role
- Parser blocks identify one blog/editor block shape and convert it into a parsed block.
- Blocks should preserve user-visible content and avoid adding renderer-specific policy.
- Block output should be deterministic for the same HTML and parser options.

## Block Contract
- Match logic should be narrow enough to avoid stealing another block's HTML.
- Convert logic should return parsed block props and asset metadata only.
- Container blocks may delegate nested content to child parsing.
- Leaf blocks should not parse unrelated surrounding editor structure.
- Each parser block must expose a `templateDefinition`.
- Blocks that intentionally produce no Markdown use the `무시` preset with an empty template.
- Link-like and widget-like blocks expose structured props that name the content being parsed, such as URL, title, caption, file metadata, schedule fields, place lists, or media identifiers. Do not collapse these blocks into a single opaque `text` prop.
- A block exists for one product/content responsibility. If one parser can only extract some props for one content shape and different props for another, split the parser block instead of widening one block.

## Templates
- Template definitions describe available Markdown output presets and interpolation props.
- Template keys are stable contracts used by UI options, generated Storybook catalog, and renderer tests.
- Output option behavior belongs to parser/editor tests, not shallow UI tests.
- Preset labels describe the actual output shape. Do not use generic labels.
- Empty templates are valid templates when the block intentionally outputs nothing.
- Group media blocks expose arrays, such as `images[]`, and templates render the array into Markdown strings instead of printing the object directly.

## Utilities
- Editor-local helpers stay in that editor's `util/` folder.
- Shared utilities must have a clear owner and current import path.
- Utility files with one export use the function name.
- Do not centralize block parsing, block output, or block template helpers across block files. Keep block-specific template strings and parsed-output construction inside the owning block file, even when this creates small duplication.
- Core parser dispatch, shared schema contracts, and generic template evaluation may remain shared infrastructure.

## Quality Criteria
- Preserve source links, captions, table text, code, media metadata, and visible fallback text when available.
- Do not fail normal export just because an optional block detail is missing.
- Keep unsupported behavior observable through diagnostics and evidence tools.

## Verification
- Block implementation changes require offline tests that cover the changed block behavior.
- Output contract changes require offline tests and Storybook catalog checks.
- Fixture changes must prove current live HTML still matches expected Markdown.
