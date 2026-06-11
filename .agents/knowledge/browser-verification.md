# Browser Verification

## When To Use
- Use browser validation when the user asks to inspect UI behavior or when a meaningful UI change affects visible flow, layout, controls, or feedback.
- Automated browser checks run through `mise exec -- pnpm check:playwright`; this document is for targeted manual browser confirmation.

## Server Rules
- Do not reuse a user's `mise exec -- pnpm dev` session for agent browser checks.
- Start isolated checks with non-default `PORT`, separate `EXITPRESS_SETTINGS_PATH`, and separate `EXITPRESS_SCAN_CACHE_PATH`.
- Keep browser verification scratch files under repo-local `tmp/`.
- Prefer test-owned servers that use `listen(0)` when available.

## What To Check
- Requested buttons, inputs, dialogs, filters, tables, progress, and upload state actually work on screen.
- UI state matches API response or `manifest.json` state.
- Export reaches `completed`, `failed`, `upload-completed`, or `upload-failed` as expected.
- `download-and-upload` shows provider setup before export and upload progress after export starts.
- Restored upload states show existing progress without re-submitting provider credentials.
- Desktop/mobile layout has no obvious horizontal overflow, clipping, or unreadable contrast.
- Storybook checks should confirm the rendered `Input HTML`, `Source Capture`, and `Markdown` areas describe the same source block.
- Storybook capture images should resolve from bundled `packages/web/src/features/storybook/assets` URLs in development or built asset URLs in production.

## Record
- URL and viewport.
- Input values.
- Final job status.
- Success or failure signal.
- Failure details from screen, API state, and manifest state when relevant.
