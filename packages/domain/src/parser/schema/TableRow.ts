// Normalized table cell with both text and source HTML.
export type TableCell = {
  text: string
  html: string
  colspan: number
  rowspan: number
  isHeader: boolean
}

// Row-level table structure shared by parser blocks and renderer.
export type TableRow = TableCell[]
