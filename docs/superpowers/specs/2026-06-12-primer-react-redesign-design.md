# Primer React UI Redesign Design

## 결론

Exitpress 웹 UI를 shadcn/Radix/remix icon/Tailwind 중심 구조에서 Primer React, Octicons, Primer 스타일링 중심 구조로 전면 재설계한다.

이 작업은 기존 UI 컨벤션을 보존하는 교체가 아니다. GitHub 제품 UI처럼 보이고 동작하도록 앱 셸, 주요 화면, 폼, 결과표, 오버레이, 문서화 기준을 새 Primer 디자인 시스템으로 다시 정렬한다.

## 목표

- 모든 사용자 화면이 GitHub Primer 제품 UI처럼 조밀하고 기능 중심으로 보이게 한다.
- 기존 shadcn/Radix/remix icon 기반 UI 흔적을 제거한다.
- Tailwind 기반 스타일링은 제거 가능하며, 최종 UI는 Primer React `sx`, Primer 컴포넌트 props, 필요한 최소 CSS를 기준으로 한다.
- 라이트와 다크 두 테마를 유지한다.
- 주요 화면 전체와 기존 UI 컴포넌트 21개를 실제 브라우저에서 검증한다.
- 디자인 시스템 지식 문서를 Primer 기준으로 다시 작성한다.

## 제외 범위

- export engine, parser, provider, server API 동작 변경은 제외한다.
- 사용자 플로우의 도메인 의미 변경은 제외한다.
- GitHub 인증, 업로드, 파일 열기 같은 비 UI 기능의 계약 변경은 제외한다.
- 이전 shadcn/Radix API 호환 shim은 남기지 않는다.

## 현재 UI 인벤토리

서브에이전트 `Rawls`가 읽기 전용으로 조사했다.

- UI 래퍼 파일: 21개
- Radix 계열 래퍼: 10개
- Remix Icon 직접 import 파일: 8개
- 실제 미사용 UI export: `Skeleton`, `Tabs*`, `DialogClose`
- Tailwind/shadcn 핵심 결합 지점: `packages/web/src/styles/globals.css`, `packages/web/src/lib/Cn.ts`

## 컴포넌트 전환 표

| 기존 파일 | 기존 export | 현재 의존 | Primer 목표 | 처리 |
|---|---|---|---|---|
| `packages/web/src/components/ui/Accordion.tsx` | `Accordion`, `AccordionContent`, `AccordionItem`, `AccordionTrigger` | Radix | `Details`, `ActionList`, 화면별 접힘 구조 | 실제 사용처 기준 재구성 |
| `packages/web/src/components/ui/Alert.tsx` | `Alert`, `AlertDescription`, `AlertTitle` | cva, Tailwind | `Flash` | Primer `Flash`로 대체 |
| `packages/web/src/components/ui/Badge.tsx` | `Badge` | cva, Tailwind | `Label`, `Token` | 상태·메타 성격별 분리 |
| `packages/web/src/components/ui/Button.tsx` | `Button` | Radix Slot, cva, Tailwind | `Button`, `IconButton` | `asChild` 패턴 제거 |
| `packages/web/src/components/ui/Card.tsx` | `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` | cva, Tailwind | `Box`, `PageLayout`, `BorderBox` | 화면 구조와 함께 재작성 |
| `packages/web/src/components/ui/Checkbox.tsx` | `Checkbox` | Radix, Remix Icon, Tailwind | `Checkbox`, `FormControl` | 폼 행 단위로 재작성 |
| `packages/web/src/components/ui/Collapsible.tsx` | `Collapsible`, `CollapsibleContent` | Radix | `Details` | 구조 미리보기에서 대체 |
| `packages/web/src/components/ui/Dialog.tsx` | `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`, `DialogTrigger` | Radix, Remix Icon, Tailwind | `Dialog` | Trigger 조합 재작성 |
| `packages/web/src/components/ui/DropdownMenu.tsx` | `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` | Radix, Tailwind | `ActionMenu`, `ActionList` | 행 액션과 템플릿 메뉴 재작성 |
| `packages/web/src/components/ui/Field.tsx` | `Field`, `FieldDescription`, `FieldGroup`, `FieldLabel` | Tailwind | `FormControl` | 폼 구조로 흡수 |
| `packages/web/src/components/ui/Input.tsx` | `Input` | Tailwind | `TextInput` | Primer 입력 컴포넌트로 대체 |
| `packages/web/src/components/ui/Progress.tsx` | `Progress` | Tailwind | `ProgressBar` | 실행·업로드 진행률에 적용 |
| `packages/web/src/components/ui/ScrollArea.tsx` | `ScrollArea` | Radix ScrollArea, Tailwind | `Box` overflow | 네이티브 스크롤 구조로 대체 |
| `packages/web/src/components/ui/Select.tsx` | `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectTrigger`, `SelectValue` | Radix, Remix Icon, Tailwind | `Select`, 필요 시 `SelectPanel` | 단순 선택과 복합 선택 분리 |
| `packages/web/src/components/ui/Separator.tsx` | `Separator` | Radix, Tailwind | `Box` border | 별도 컴포넌트 제거 |
| `packages/web/src/components/ui/Skeleton.tsx` | `Skeleton` | Tailwind | 없음 | 미사용이면 제거 |
| `packages/web/src/components/ui/Sonner.tsx` | `Toaster`, `toast` | sonner, Tailwind | `Flash`, 최소 toast adapter | 알림 UX 재설계 |
| `packages/web/src/components/ui/Table.tsx` | `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` | Tailwind | Primer table pattern | 결과·카테고리 표 재작성 |
| `packages/web/src/components/ui/Tabs.tsx` | `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` | Radix, cva, Tailwind | `UnderlineNav`, `SegmentedControl` | 미사용이면 제거 |
| `packages/web/src/components/ui/ToggleGroup.tsx` | `ToggleGroup`, `ToggleGroupItem` | Tailwind | `SegmentedControl` | 테마·인증 방식 선택에 적용 |
| `packages/web/src/components/ui/Tooltip.tsx` | `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` | Radix, Tailwind | `Tooltip` | 결과표 액션 설명에 적용 |

## 직접 의존성 제거 기준

- `@radix-ui/react-slot`: 제거
- `@radix-ui/react-scroll-area`: 제거
- `radix-ui`: 제거
- `@remixicon/react`: 제거
- `class-variance-authority`: shadcn variant 용도로만 남아 있으면 제거
- `tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`: UI 전환 후 잔여 사용이 없으면 제거

## 주요 화면 검증 범위

| 화면 | 대상 파일 | 검증 기준 |
|---|---|---|
| 앱 셸 | `packages/web/src/app/AppShell.tsx`, `packages/web/src/features/common/shell/WizardHeader.tsx`, `packages/web/src/features/common/shell/WizardDock.tsx` | GitHub 제품 UI처럼 보이는 header, status, footer action |
| 블로그 입력 | `packages/web/src/features/scan/BlogInputPanel.tsx` | Primer form, input, status message |
| 카테고리 선택 | `packages/web/src/features/scan/CategoryPanel.tsx` | Primer table, checkbox, search, filter |
| 구조 옵션 | `packages/web/src/features/options/StructureOptionsStep.tsx`, `packages/web/src/features/options/StructurePreview.tsx` | 파일 트리, Details, form controls |
| Frontmatter 옵션 | `packages/web/src/features/options/FrontmatterOptionsStep.tsx` | checkbox grid, text input, validation flash |
| Assets 옵션 | `packages/web/src/features/options/AssetsOptionsStep.tsx` | mode selection, nested settings |
| 업로드 옵션 | `packages/web/src/features/options/UploadProviderOptionsStep.tsx`, `packages/web/src/features/upload/UploadProviderSettingsForm.tsx`, `packages/web/src/features/upload/UploadGithubOptions.tsx` | provider select, segmented control, token form |
| 링크·진단 옵션 | `packages/web/src/features/options/LinksOptionsStep.tsx`, `packages/web/src/features/options/DiagnosticsOptionsStep.tsx` | select, checkbox, copy density |
| Markdown 옵션 | `packages/web/src/features/options/BlockTemplateOptions.tsx`, `packages/web/src/features/options/BlockTemplateCard.tsx`, `packages/web/src/features/options/TemplateEditorCard.tsx` | template editor shell, menu, dialog |
| 실행 중 | `packages/web/src/app/AppStepView.tsx`, `packages/web/src/features/job-results/ProgressSections.tsx` | GitHub Actions/Checks 스타일 진행 상태 |
| 업로드 진행 | `packages/web/src/features/job-results/UploadPanel.tsx` | progress, flash, upload metrics |
| 결과 | `packages/web/src/features/job-results/JobResultsPanel.tsx`, `packages/web/src/features/job-results/JobResultsTable.tsx` | table, row action menu, tooltip, links |
| 로그 | `packages/web/src/features/job-results/JobLogsPanel.tsx` | GitHub Actions 로그처럼 조밀한 log view |
| Resume dialog | `packages/web/src/features/resume/ResumeDialogPanel.tsx` | Primer Dialog focus, close, action buttons |
| Storybook route | `packages/web/src/features/storybook/StorybookPage.tsx` | accordion/card 잔여감 제거 |
| Bootstrap loading | `packages/web/src/app/BootstrapLoadingOverlay.tsx` | Primer spinner/loading surface |

## 마일스톤

### M0. UI 인벤토리 확정

작업:
- 21개 UI 래퍼와 실제 사용처를 표로 확정한다.
- 직접 라이브러리 import를 확정한다.
- Tailwind와 shadcn 전제에 묶인 파일을 확정한다.

성공 조건:
- 모든 기존 UI 래퍼가 전환 표에 존재한다.
- 미사용 export도 제거 대상으로 표시된다.
- 주요 화면별 검증 후보가 빠짐없이 나열된다.

검증:
- `rg --files packages/web/src/components/ui`
- `rg -n "@radix-ui/|radix-ui|@remixicon/react" packages/web/src`
- `rg -n "tailwindcss|tailwind-merge|@tailwindcss" packages/web package.json pnpm-workspace.yaml pnpm-lock.yaml`

### M1. Primer 기반 도입

작업:
- `@primer/react`, `@primer/octicons-react`를 도입한다.
- `ThemeProvider`, `BaseStyles`를 앱 루트에 적용한다.
- 라이트/다크 테마 선택 상태를 Primer color mode와 연결한다.
- Tailwind 전역 토큰에 의존하지 않는 최소 global CSS로 축소한다.

성공 조건:
- 앱이 Primer theme 안에서 렌더링된다.
- 라이트/다크 전환이 기존 사용자 설정과 연결된다.
- 첫 렌더에서 배경, 텍스트, 기본 form control이 Primer 색상으로 보인다.

검증:
- `mise exec -- pnpm check:type`
- `mise exec -- pnpm build:ui`
- 브라우저 데스크톱 라이트 스크린샷
- 브라우저 데스크톱 다크 스크린샷
- 브라우저 모바일 라이트 스크린샷
- 브라우저 모바일 다크 스크린샷

### M2. 앱 셸 전면 재구성

작업:
- Header, status summary, navigation links, theme switcher를 GitHub 제품 UI 구조로 재작성한다.
- floating dock을 Primer button bar 또는 footer action region으로 재설계한다.
- loading overlay를 Primer spinner/loading pattern으로 바꾼다.

성공 조건:
- 기존 rounded card dashboard 느낌이 사라진다.
- Header와 action area가 GitHub settings/actions 계열처럼 보인다.
- 주요 action button은 Primer `Button` 또는 `IconButton`으로 렌더링된다.

검증:
- `mise exec -- pnpm check:type`
- `mise exec -- pnpm build:ui`
- 첫 화면 데스크톱/모바일 스크린샷
- 라이트/다크 각각 스크린샷
- 브라우저에서 테마 토글 조작
- 브라우저에서 다음/이전 action 버튼 조작

### M3. 입력·스캔 화면 재작성

작업:
- 블로그 입력 폼을 Primer `FormControl`, `TextInput`, `Button`, `Flash` 중심으로 재작성한다.
- 카테고리 검색, 선택, 필터, 카테고리 표를 Primer table pattern과 checkbox로 재작성한다.
- 상태 label과 count 표기를 Primer `Label` 또는 `Token`으로 정리한다.

성공 조건:
- 입력 폼이 GitHub repository/settings form처럼 보인다.
- 카테고리 표가 GitHub list/table처럼 보인다.
- 검색, 체크박스, 전체 선택, 필터가 정상 동작한다.

검증:
- `mise exec -- pnpm check:type`
- 관련 Vitest UI 테스트
- 브라우저에서 블로그 ID 입력
- 브라우저에서 출력 경로 입력
- 브라우저에서 카테고리 검색
- 브라우저에서 카테고리 체크박스 선택
- 데스크톱/모바일, 라이트/다크 스크린샷

### M4. 옵션 화면 재작성

작업:
- 구조, frontmatter, assets, upload provider, links, diagnostics, markdown 옵션 화면을 Primer form layout으로 다시 만든다.
- option card와 field card를 제거하고, Primer `Box`, `FormControl`, `Select`, `Checkbox`, `SegmentedControl` 중심으로 재배치한다.
- 구조 미리보기의 custom SVG 아이콘은 Octicons로 대체한다.

성공 조건:
- 모든 옵션 step이 같은 Primer form grammar를 따른다.
- 옵션별 nested setting이 GitHub settings UI처럼 읽힌다.
- 기존 shadcn card grid 느낌이 남지 않는다.

검증:
- `mise exec -- pnpm check:type`
- `mise exec -- pnpm build:ui`
- 옵션 step별 브라우저 이동
- 각 step 데스크톱/모바일 스크린샷
- 라이트/다크 스크린샷
- select, checkbox, segmented control 조작

### M5. 템플릿 편집·오버레이·메뉴 재작성

작업:
- Template editor 주변 toolbar, prop list, help dialog를 Primer 구조로 재작성한다.
- Dialog는 Primer `Dialog`로 대체한다.
- DropdownMenu는 `ActionMenu`와 `ActionList`로 대체한다.
- Tooltip은 Primer `Tooltip`로 대체한다.
- toast UX는 Primer `Flash` 기반 알림 또는 최소 adapter로 재설계한다.

성공 조건:
- Radix portal, trigger, close API 의존이 없다.
- 메뉴와 dialog의 focus, close, keyboard 동작이 정상이다.
- 오버레이가 GitHub UI와 이질감 없이 보인다.

검증:
- `mise exec -- pnpm check:type`
- Template editor 브라우저 스크린샷
- help dialog 열기/닫기
- action menu 열기/선택
- keyboard escape close
- focus 이동 확인
- 라이트/다크 스크린샷

### M6. 결과·로그·업로드 화면 재작성

작업:
- running, upload, result, logs 화면을 GitHub Actions/Checks 계열로 재작성한다.
- 결과 테이블 row action menu를 Primer `ActionMenu`로 바꾼다.
- 로그 패널은 GitHub Actions 로그처럼 조밀한 monospace surface로 구성한다.
- upload status와 progress를 Primer label/progress/flash 패턴으로 정리한다.

성공 조건:
- 결과 테이블이 GitHub data table/list처럼 보인다.
- 행 메뉴, preview link, local file action이 정상 동작한다.
- 로그와 progress가 시각적으로 GitHub Actions에 가깝다.

검증:
- `mise exec -- pnpm check:type`
- 관련 job results 테스트
- 브라우저에서 running 상태 fixture 확인
- 브라우저에서 upload 상태 fixture 확인
- 브라우저에서 result 상태 fixture 확인
- row action menu 조작
- tooltip 확인
- 데스크톱/모바일, 라이트/다크 스크린샷

### M7. Storybook·Resume·edge UI 정리

작업:
- Storybook route를 Primer navigation/list/detail layout으로 재작성한다.
- Resume dialog를 Primer `Dialog`, `Flash`, `Button`으로 정리한다.
- Bootstrap loading, empty state, error state 등 edge UI를 Primer 기준으로 맞춘다.

성공 조건:
- Storybook 화면에 기존 accordion/card 스타일이 남지 않는다.
- Resume dialog focus와 action이 정상 동작한다.
- edge state가 주요 화면과 같은 디자인 언어를 쓴다.

검증:
- `mise exec -- pnpm check:type`
- Storybook route 브라우저 스크린샷
- Resume dialog 브라우저 조작
- loading overlay 스크린샷
- error/empty state 가능한 범위 확인

### M8. 의존성·스타일 제거

작업:
- shadcn/Radix/remix icon UI 래퍼를 제거하거나 Primer 기반 파일로 대체한다.
- Tailwind plugin, Tailwind import, `tailwind-merge`, shadcn variant helper 잔여물을 제거한다.
- `packages/web/package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, Vite 설정을 정리한다.

성공 조건:
- `@radix-ui`, `radix-ui`, `@remixicon/react` import가 없다.
- Tailwind 기반 `className` 스타일링이 UI 구현 기준으로 남지 않는다.
- 사용하지 않는 UI 래퍼 파일이 없다.

검증:
- `rg -n "@radix-ui/|radix-ui|@remixicon/react" packages/web package.json pnpm-lock.yaml`
- `rg -n "tailwindcss|tailwind-merge|@tailwindcss|@import \"tailwindcss\"" packages/web package.json pnpm-workspace.yaml pnpm-lock.yaml`
- `mise exec -- pnpm check:unused`
- `mise exec -- pnpm check:type`
- `mise exec -- pnpm check:lint`
- `mise exec -- pnpm build:ui`

### M9. 컴포넌트별 1:1 서브에이전트 검증

작업:
- 전환 표의 21개 기존 UI 래퍼마다 별도 검증 항목을 만든다.
- 각 항목은 담당 서브에이전트 1개가 브라우저 스크린샷 또는 제거 검증을 수행한다.
- 실제 사용 컴포넌트는 최소 1개 실제 화면에서 확인한다.
- 미사용 컴포넌트는 제거와 `rg` 결과로 확인한다.

성공 조건:
- 21개 항목 모두 `통과`, `제거 완료`, `수정 필요` 중 하나로 결과가 남는다.
- `수정 필요` 항목은 같은 마일스톤 안에서 수정 후 다시 검증한다.
- 루트 에이전트가 같은 작업트리에서 최종 재검증한다.

검증:
- 각 서브에이전트는 담당 컴포넌트명, 확인 화면, 스크린샷 경로, 판정, 남은 위험을 보고한다.
- 루트 에이전트는 전체 스크린샷과 `rg` 검증을 다시 수행한다.

### M10. 주요 화면 전체 브라우저 검증

작업:
- 주요 화면 전부를 실제 브라우저에서 확인한다.
- 각 화면은 데스크톱과 모바일, 라이트와 다크를 확인한다.
- 상호작용이 있는 화면은 클릭, 입력, 메뉴, dialog, keyboard close를 확인한다.

성공 조건:
- 모든 주요 화면이 GitHub Primer UI와 이질감 없이 보인다.
- 텍스트 겹침, 버튼 overflow, 모바일 깨짐이 없다.
- 라이트/다크 모두 동작한다.
- Playwright screenshot 또는 브라우저 screenshot 증거가 남는다.

검증:
- `mise exec -- pnpm build:ui`
- `mise exec -- pnpm check:playwright`
- 브라우저 데스크톱 라이트 전체 화면군
- 브라우저 데스크톱 다크 전체 화면군
- 브라우저 모바일 라이트 전체 화면군
- 브라우저 모바일 다크 전체 화면군

### M11. 지식 문서 갱신

작업:
- `.agents/knowledge/DESIGN.md`를 Primer React/Octicons 기준으로 전면 갱신한다.
- `AGENTS.md`의 디자인 시스템 설명이 현재 상태와 충돌하면 함께 갱신한다.
- 검증 문서에 브라우저 실검증 기준이 부족하면 보강한다.

성공 조건:
- 문서에 shadcn/Radix를 현재 기준으로 쓰라는 지시가 남지 않는다.
- 문서가 Primer 기반 컴포넌트, 스타일링, 테마, 검증 기준을 설명한다.
- 제거된 도구와 과거 전환 흔적을 유지보수 지침처럼 남기지 않는다.

검증:
- 문서 재읽기
- `rg -n "shadcn|Radix|remix icon|Tailwind" AGENTS.md .agents/knowledge docs`
- 남은 표현이 과거 상태 설명인지 현재 지시인지 구분

## 반복 기준

- UI를 수정한 마일스톤은 브라우저 실검증을 통과해야 한다.
- 정적 검증이 실패하면 브라우저 검증으로 넘어가지 않는다.
- 라이트와 다크 중 하나라도 깨지면 실패다.
- 데스크톱과 모바일 중 하나라도 겹침, 넘침, 비정상 여백이 있으면 실패다.
- 스크린샷에서 shadcn/Radix 느낌이 남으면 같은 마일스톤 안에서 수정 후 재검증한다.
- 서브에이전트 검증은 보조 근거이며, 루트 에이전트가 현재 작업트리에서 최종 재검증한다.

## 서브에이전트 운영

- M0에서는 explorer 서브에이전트가 읽기 전용 UI 인벤토리를 조사한다.
- M9에서는 컴포넌트별 검증 서브에이전트를 나눈다.
- 각 검증 서브에이전트는 파일 수정 권한 없이 담당 컴포넌트의 실제 화면, 스크린샷, 이질감 여부만 보고한다.
- 수정은 루트 에이전트 또는 명확한 파일 소유권을 받은 worker가 맡는다.
- 여러 worker가 병렬 구현을 맡는 경우 파일 소유권을 겹치지 않게 나눈다.

## 최종 완료 기준

- 21개 기존 UI 래퍼가 모두 전환 표에서 처리 완료된다.
- 주요 화면 전체가 브라우저에서 검증된다.
- 라이트/다크 테마가 유지된다.
- `@radix-ui`, `radix-ui`, `@remixicon/react`가 제거된다.
- Tailwind 기반 스타일링은 최종 UI 기준에서 제거된다.
- `.agents/knowledge/DESIGN.md`가 Primer 기준으로 갱신된다.
- `mise exec -- pnpm check:type`, `mise exec -- pnpm check:lint`, `mise exec -- pnpm build:ui`, 관련 테스트, 브라우저 검증이 통과한다.

## 위험과 대응

| 위험 | 영향 | 대응 |
|---|---|---|
| Primer API와 기존 Radix overlay API 차이 | dialog/menu/select 동작 회귀 | overlay 화면을 별도 마일스톤으로 분리하고 keyboard/focus 검증 |
| Tailwind className 제거 범위가 큼 | 레이아웃 회귀 | 화면별로 Primer layout으로 다시 구성하고 브라우저 스크린샷 반복 |
| 결과표와 스크롤 영역 회귀 | 데이터 확인 UX 저하 | table/log 전용 마일스톤과 fixture 상태 검증 |
| 테마 전환 차이 | 다크/라이트 불일치 | M1부터 color mode 연결 후 매 마일스톤에서 양쪽 검증 |
| 컴포넌트별 검증 누락 | shadcn 흔적 잔존 | M9에서 21개 항목을 서브에이전트별로 1:1 검증 |

## 승인 상태

사용자는 C 접근을 선택했다. 범위는 기존 UI 컨벤션을 유지하지 않고 Primer로 앱을 새로 만든다고 볼 만큼 크게 잡는다. 마일스톤 중간마다 기본 검증과 브라우저 실검증을 수행한다.
