# Primer Verification Matrix

| Existing UI wrapper | Final state | Primer replacement | Verification screen | Browser evidence | Result |
| ------------------- | ----------- | ------------------ | ------------------- | ---------------- | ------ |
| Accordion | 완료 | Primer `Box` tree/list disclosure, Octicon chevron | Storybook route | `/tmp/exitpress-task7-primer/storybook-desktop-dark.png`, `/tmp/exitpress-task7-primer/storybook-mobile-light-verified.png` | Storybook tree 이질감 없음 |
| Alert | 완료 | Primer `Flash` | Blog input, Frontmatter, Resume, Results | `/tmp/exitpress-task6-options-fixed/frontmatter-desktop-dark.png`, `/tmp/exitpress-task7-primer/result-resume-dialog-dark.png` | 경고/안내 표면 Primer 전환 |
| Badge | 완료 | Primer `Label` | Header, Category, Results, Storybook | `/tmp/exitpress-task7-primer/result-panel-dark.png`, `/tmp/exitpress-task7-primer/storybook-desktop-dark.png` | 상태/메타 label 일관 |
| Button | 완료 | Primer `Button`, `IconButton`, `SegmentedControl` | All major screens | `/tmp/exitpress-task7-primer/result-panel-light.png`, `/tmp/exitpress-task7-primer/storybook-mobile-light-verified.png` | 액션 버튼 Primer 전환 |
| Card | 완료 | Primer `Box`, local `PrimerPanel` | App shell, Blog input, Category, Options, Results, Storybook | `/tmp/exitpress-task7-primer/result-panel-dark.png`, `/tmp/exitpress-task7-primer/storybook-desktop-dark.png` | shadcn card 표면 제거 |
| Checkbox | 완료 | Primer `Checkbox`, `FormControl` | Category, Frontmatter, Upload | `/tmp/exitpress-task5-scan/category-mobile-dark-fixed-bottom-no-success-toast.png`, `/tmp/exitpress-task6-options-fixed/upload-desktop-dark.png` | form control Primer 전환 |
| Collapsible | 완료 | Primer `Details`, Storybook disclosure `Box` | Structure preview, Storybook tree | `/tmp/exitpress-task6-options-fixed/structure-desktop-dark.png`, `/tmp/exitpress-task7-primer/storybook-desktop-dark.png` | 접힘 구조 전환 |
| Dialog | 완료 | Primer `Dialog` | Resume, Template help | `/tmp/exitpress-task6-options-fixed/template-help-dialog-dark.png`, `/tmp/exitpress-task7-primer/result-resume-dialog-dark.png` | overlay 이질감 없음 |
| DropdownMenu | 완료 | Primer `ActionMenu`, `ActionList` | Results, Template editor | `/tmp/exitpress-task7-primer/result-panel-dark.png`; `rg "components/ui|radix-ui" packages/web/src` 0건 | 메뉴 의존 제거 |
| Field | 완료 | Primer `FormControl`, `Box` field layout | Blog input, Category, Options, Upload | `/tmp/exitpress-task6-options-fixed/*.png`, `/tmp/exitpress-task7-primer/result-panel-light.png` | field layout 통일 |
| Input | 완료 | Primer `TextInput` | Blog input, Category, Options, Upload | `/tmp/exitpress-task5-scan/blog-input-desktop-light-fixed.png`, `/tmp/exitpress-task6-options-fixed/frontmatter-desktop-dark.png` | 입력 컴포넌트 전환 |
| Progress | 완료 | Primer `ProgressBar` | Block scan, Running, Upload | `/tmp/exitpress-task7-primer/result-panel-dark.png`; `mise exec -- pnpm check:type` 통과 | Progress wrapper 제거 |
| ScrollArea | 완료 | Primer `Box` native overflow | Category, Results, Logs, Storybook | `/tmp/exitpress-task7-primer/result-panel-mobile-light-restored.png`, `/tmp/exitpress-task7-primer/storybook-mobile-light-verified.png` | desktop/mobile overflow 없음 |
| Select | 완료 | Primer `Select`, `ActionMenu` where needed | Category, Options, Upload provider | `/tmp/exitpress-task6-options-fixed/{structure,assets,upload,diagnostics}-desktop-dark.png` | Radix Select 제거 |
| Separator | 완료 | Primer `Box` border | Logs, panels, Storybook | `/tmp/exitpress-task7-primer/result-panel-dark.png`, `/tmp/exitpress-task7-primer/storybook-desktop-dark.png` | separator wrapper 제거 |
| Skeleton | 완료 | Removed | rg check | `rg --files packages/web/src/components/ui` 0건 | 미사용 primitive 삭제 |
| Sonner | 완료 | Primer toast adapter with `Flash` styling | Notifications | `/tmp/exitpress-task4-primer/{toast-light-fixed,toast-dark-fixed,mobile-toast-dark}.png` | toast adapter 유지 |
| Table | 완료 | Primer `Box` table pattern | Category, Results | `/tmp/exitpress-task7-primer/result-panel-dark.png`, `/tmp/exitpress-task7-primer/result-panel-mobile-light-restored.png` | 결과표 Primer 전환 |
| Tabs | 완료 | Removed, Primer `SegmentedControl` where selection is needed | rg check, header theme | `rg --files packages/web/src/components/ui` 0건; `/tmp/exitpress-task7-primer/storybook-desktop-dark.png` | 미사용 primitive 삭제 |
| ToggleGroup | 완료 | Primer `SegmentedControl` | Theme, Upload auth | `/tmp/exitpress-task3-shell/{desktop-light,desktop-dark,mobile-light,mobile-dark}.png`; `mise exec -- pnpm vitest run packages/web/src/features/upload/UploadProviderSettingsForm.spec.tsx --configLoader runner --silent` | toggle 전환 |
| Tooltip | 완료 | Primer `Tooltip` | Results row path tooltip | `/tmp/exitpress-task7-primer/result-panel-dark.png`; `rg "components/ui|radix-ui" packages/web/src` 0건 | Radix Tooltip 제거 |

## Final Removal Checks

- `rg -n "components/ui|@remixicon/react|@radix-ui|radix-ui|class-variance-authority|tailwind-merge|@tailwindcss/vite|tailwindcss|lib/Cn|Cn.js" packages/web/src packages/web/package.json pnpm-workspace.yaml packages/web/vite.config.ts vitest.config.ts scripts/maintenance/check-unused.ts -g '!*.md'` returns no matches.
- `mise exec -- pnpm check:type` passed.
- `mise exec -- pnpm check:fmt` passed.
- `mise exec -- pnpm check:lint` passed.
- `mise exec -- pnpm check:unused` passed.
- `mise exec -- pnpm build:ui` passed with the existing large chunk warning.
