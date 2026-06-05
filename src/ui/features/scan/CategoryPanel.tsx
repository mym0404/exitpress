import type { ScanResult } from "../../../domain/blog/Types.js"

import { Badge } from "../../components/ui/Badge.js"
import { Card, CardContent } from "../../components/ui/Card.js"
import { Checkbox } from "../../components/ui/Checkbox.js"
import { Field, FieldGroup, FieldLabel } from "../../components/ui/Field.js"
import { Input } from "../../components/ui/Input.js"
import { ScrollArea } from "../../components/ui/ScrollArea.js"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table.js"
import { cn } from "../../lib/Cn.js"

import { getCategoryCheckboxState, orderCategoriesHierarchically } from "./CategorySelection.js"

export const CategoryPanel = ({
  scanResult,
  selectedCategoryIds,
  categorySearch,
  categoryStatus,
  categoryMode,
  dateFrom,
  dateTo,
  selectedCount,
  selectedPostCount,
  totalPostCount,
  onCategorySearchChange,
  onCategoryModeChange,
  onDateFromChange,
  onDateToChange,
  onSelectAll,
  onClearAll,
  onCategoryToggle,
}: {
  scanResult: ScanResult | null
  selectedCategoryIds: number[]
  categorySearch: string
  categoryStatus: string
  categoryMode: "selected-and-descendants" | "exact-selected"
  dateFrom: string | null
  dateTo: string | null
  selectedCount: number
  selectedPostCount: number
  totalPostCount: number
  onCategorySearchChange: (value: string) => void
  onCategoryModeChange: (value: "selected-and-descendants" | "exact-selected") => void
  onDateFromChange: (value: string | null) => void
  onDateToChange: (value: string | null) => void
  onSelectAll: () => void
  onClearAll: () => void
  onCategoryToggle: (categoryId: number, checked: boolean) => void
}) => {
  const categories = scanResult?.categories ?? []
  const orderedCategories = orderCategoriesHierarchically(categories)
  const keyword = categorySearch.trim().toLowerCase()
  const filteredCategories = orderedCategories.filter((category) => {
    if (!keyword) {
      return true
    }

    const haystack = `${category.path.join(" / ")} ${category.name}`.toLowerCase()
    return haystack.includes(keyword)
  })
  const bulkSelectionState =
    selectedCount === 0 ? false : selectedCount === categories.length ? true : "indeterminate"

  return (
    <Card variant="panel" className="board-card overflow-hidden" id="category-panel">
      <CardContent className="panel-body grid gap-4 p-5">
        <p id="category-status" className="panel-description max-w-2xl text-sm leading-7">
          {categoryStatus}
        </p>

        <FieldGroup className="gap-3 xl:grid xl:grid-cols-3 xl:items-start">
          <Field className="field-card min-h-0 rounded-2xl px-3 py-3" disabled={!scanResult}>
            <FieldLabel htmlFor="scope-categoryMode">카테고리 포함 범위</FieldLabel>
            <Select
              value={categoryMode}
              disabled={!scanResult}
              onValueChange={(value) =>
                onCategoryModeChange(value as "selected-and-descendants" | "exact-selected")
              }
            >
              <SelectTrigger id="scope-categoryMode" data-value={categoryMode}>
                <SelectValue placeholder="카테고리 포함 범위 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="selected-and-descendants">
                    선택 카테고리 + 하위 카테고리
                  </SelectItem>
                  <SelectItem value="exact-selected">선택 카테고리만</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field className="field-card min-h-0 rounded-2xl px-3 py-3" disabled={!scanResult}>
            <FieldLabel htmlFor="scope-dateFrom">시작일</FieldLabel>
            <Input
              id="scope-dateFrom"
              type="date"
              value={dateFrom ?? ""}
              disabled={!scanResult}
              onChange={(event) => onDateFromChange(event.target.value || null)}
            />
          </Field>

          <Field className="field-card min-h-0 rounded-2xl px-3 py-3" disabled={!scanResult}>
            <FieldLabel htmlFor="scope-dateTo">종료일</FieldLabel>
            <Input
              id="scope-dateTo"
              type="date"
              value={dateTo ?? ""}
              disabled={!scanResult}
              onChange={(event) => onDateToChange(event.target.value || null)}
            />
          </Field>
        </FieldGroup>

        <div className="toolbar category-toolbar grid gap-4">
          <label className="input-stack toolbar-search grid gap-2" htmlFor="category-search">
            <span className="toolbar-label wizard-kicker">검색</span>
            <Input
              id="category-search"
              placeholder="카테고리 이름 또는 경로 검색"
              disabled={!scanResult}
              value={categorySearch}
              onChange={(event) => onCategorySearchChange(event.target.value)}
            />
          </label>
        </div>

        <div className="selection-summary flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <span id="selected-category-count">
              선택한 카테고리 {selectedCount}개 / {categories.length}개
            </span>
            <span id="selected-post-count">
              대상 글 {selectedPostCount}개 / 전체 {totalPostCount}개
            </span>
          </div>
          <Badge
            variant={selectedCount > 0 ? "success" : "idle"}
            className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            {selectedCount > 0 ? "선택됨" : "미선택"}
          </Badge>
        </div>

        {!scanResult ? (
          <div
            id="category-list"
            className="category-list empty-state-surface grid min-h-24 place-items-center rounded-2xl px-4 py-6 text-center text-sm"
          >
            스캔을 진행하면 카테고리가 여기에 표시됩니다.
          </div>
        ) : filteredCategories.length === 0 ? (
          <div
            id="category-list"
            className="category-list empty-state-surface grid min-h-24 place-items-center rounded-2xl px-4 py-6 text-center text-sm"
          >
            검색 결과가 없습니다.
          </div>
        ) : (
          <div
            id="category-list"
            className="section-card category-list overflow-hidden rounded-2xl"
          >
            <ScrollArea className="h-[min(28rem,52vh)] overflow-hidden">
              <Table className="min-w-[30rem]">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14">
                      <Checkbox
                        aria-label="전체 카테고리 선택"
                        checked={bulkSelectionState}
                        data-category-bulk-selection="true"
                        disabled={!scanResult}
                        onCheckedChange={(next) => {
                          if (next === true) {
                            onSelectAll()
                            return
                          }

                          onClearAll()
                        }}
                      />
                    </TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead className="w-24">글 수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => {
                    const checked = getCategoryCheckboxState({
                      categories,
                      selectedIds: selectedCategoryIds,
                      categoryId: category.id,
                    })
                    const categoryPath = category.path.join(" / ")
                    const hasParent = category.parentId !== null
                    const indentWidth = `${Math.max(category.depth, 0) * 1.2}rem`

                    return (
                      <TableRow
                        key={category.id}
                        className={cn(
                          "category-item cursor-pointer last:border-b-0",
                          hasParent && "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                        )}
                        data-category-id={category.id}
                        data-category-level={hasParent ? "child" : "root"}
                        onClick={() => onCategoryToggle(category.id, checked !== true)}
                      >
                        <TableCell className="w-14 py-0">
                          <div className="flex h-11 items-center">
                            <Checkbox
                              checked={checked}
                              aria-label={categoryPath}
                              className="flex-none"
                              onClick={(event) => event.stopPropagation()}
                              onCheckedChange={(next) =>
                                onCategoryToggle(category.id, next === true)
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className="relative grid gap-0.5"
                            style={{ paddingLeft: indentWidth }}
                          >
                            {hasParent ? (
                              <>
                                <span
                                  aria-hidden="true"
                                  className="absolute bottom-0 top-0 w-px bg-border"
                                  data-category-tree-line="true"
                                  style={{ left: `calc(${indentWidth} - 0.65rem)` }}
                                />
                              </>
                            ) : null}
                            <span className="font-semibold text-foreground">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="category-count min-w-10 justify-center rounded-full px-2.5 py-0.5"
                            variant="idle"
                          >
                            {category.postCount}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
