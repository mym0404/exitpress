// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ScanResult } from "../../../domain/blog/Types.js"

import { CategoryPanel } from "./CategoryPanel.js"

afterEach(() => {
  cleanup()
})

const scanResult: ScanResult = {
  blogId: "mym0404",
  totalPostCount: 8,
  categories: [
    {
      id: 1,
      name: "개발",
      parentId: null,
      postCount: 5,
      isDivider: false,
      isOpen: true,
      path: ["개발"],
      depth: 0,
    },
    {
      id: 2,
      name: "React",
      parentId: 1,
      postCount: 3,
      isDivider: false,
      isOpen: true,
      path: ["개발", "React"],
      depth: 1,
    },
  ],
  posts: [],
}

describe("CategoryPanel", () => {
  it("keeps child categories tagged as child rows", () => {
    render(
      <CategoryPanel
        scanResult={scanResult}
        selectedCategoryIds={[1, 2]}
        categorySearch=""
        categoryStatus="2개 카테고리"
        categoryMode="selected-and-descendants"
        dateFrom={null}
        dateTo={null}
        selectedCount={2}
        selectedPostCount={8}
        totalPostCount={8}
        onCategorySearchChange={vi.fn()}
        onCategoryModeChange={vi.fn()}
        onDateFromChange={vi.fn()}
        onDateToChange={vi.fn()}
        onSelectAll={vi.fn()}
        onClearAll={vi.fn()}
        onCategoryToggle={vi.fn()}
      />,
    )

    const rootRow = document.querySelector('[data-category-id="1"]')
    const childRow = document.querySelector('[data-category-id="2"]')
    const childTreeLine = childRow?.querySelector('[data-category-tree-line="true"]')

    expect(rootRow).toHaveAttribute("data-category-level", "root")
    expect(childRow).toHaveAttribute("data-category-level", "child")
    expect(childTreeLine).toBeInTheDocument()
  })

  it("toggles selection when the row itself is clicked", () => {
    const onCategoryToggle = vi.fn()

    render(
      <CategoryPanel
        scanResult={scanResult}
        selectedCategoryIds={[1]}
        categorySearch=""
        categoryStatus="2개 카테고리"
        categoryMode="selected-and-descendants"
        dateFrom={null}
        dateTo={null}
        selectedCount={1}
        selectedPostCount={5}
        totalPostCount={8}
        onCategorySearchChange={vi.fn()}
        onCategoryModeChange={vi.fn()}
        onDateFromChange={vi.fn()}
        onDateToChange={vi.fn()}
        onSelectAll={vi.fn()}
        onClearAll={vi.fn()}
        onCategoryToggle={onCategoryToggle}
      />,
    )

    const childRow = document.querySelector('[data-category-id="2"]')

    if (!(childRow instanceof HTMLElement)) {
      throw new Error("missing child row")
    }

    fireEvent.click(childRow)

    expect(onCategoryToggle).toHaveBeenCalledWith(2, true)
  })

  it("uses the table header checkbox for bulk selection", () => {
    const onSelectAll = vi.fn()
    const onClearAll = vi.fn()

    const { rerender } = render(
      <CategoryPanel
        scanResult={scanResult}
        selectedCategoryIds={[1]}
        categorySearch=""
        categoryStatus="2개 카테고리"
        categoryMode="selected-and-descendants"
        dateFrom={null}
        dateTo={null}
        selectedCount={1}
        selectedPostCount={5}
        totalPostCount={8}
        onCategorySearchChange={vi.fn()}
        onCategoryModeChange={vi.fn()}
        onDateFromChange={vi.fn()}
        onDateToChange={vi.fn()}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
        onCategoryToggle={vi.fn()}
      />,
    )

    expect(document.querySelector("#select-all-categories")).toBeNull()
    expect(document.querySelector("#clear-all-categories")).toBeNull()

    const bulkCheckbox = document.querySelector('[data-category-bulk-selection="true"]')

    if (!(bulkCheckbox instanceof HTMLElement)) {
      throw new Error("missing category bulk checkbox")
    }

    fireEvent.click(bulkCheckbox)
    expect(onSelectAll).toHaveBeenCalledTimes(1)

    rerender(
      <CategoryPanel
        scanResult={scanResult}
        selectedCategoryIds={[1, 2]}
        categorySearch=""
        categoryStatus="2개 카테고리"
        categoryMode="selected-and-descendants"
        dateFrom={null}
        dateTo={null}
        selectedCount={2}
        selectedPostCount={8}
        totalPostCount={8}
        onCategorySearchChange={vi.fn()}
        onCategoryModeChange={vi.fn()}
        onDateFromChange={vi.fn()}
        onDateToChange={vi.fn()}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
        onCategoryToggle={vi.fn()}
      />,
    )

    const checkedBulkCheckbox = document.querySelector('[data-category-bulk-selection="true"]')

    if (!(checkedBulkCheckbox instanceof HTMLElement)) {
      throw new Error("missing checked category bulk checkbox")
    }

    fireEvent.click(checkedBulkCheckbox)
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })
})
