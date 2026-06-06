# Parser Blocks

## Role
- Parser blocks identify one Naver editor block shape and convert it into a parsed block.
- Blocks should preserve user-visible content and avoid adding renderer-specific policy.
- Block output should be deterministic for the same HTML and parser options.

## Block Contract
- Match logic should be narrow enough to avoid stealing another block's HTML.
- Convert logic should return parsed block props and asset metadata only.
- Container blocks may delegate nested content to child parsing.
- Leaf blocks should not parse unrelated surrounding editor structure.

## Templates
- Template definitions describe available Markdown output presets and interpolation props.
- Template keys are stable contracts used by UI options, generated Storybook catalog, and renderer tests.
- Output option behavior belongs to parser/editor tests, not shallow UI tests.

## Utilities
- Editor-local helpers stay in that editor's `util/` folder.
- Shared utilities must have a clear owner and current import path.
- Utility files with one export use the function name.

## Quality Criteria
- Preserve source links, captions, table text, code, media metadata, and visible fallback text when available.
- Do not fail normal export just because an optional block detail is missing.
- Keep unsupported behavior observable through diagnostics and evidence tools.

## Verification
- Block implementation changes require parser block tests.
- Output contract changes require offline tests and Storybook catalog checks.
- Fixture changes must prove current live HTML still matches expected Markdown.
