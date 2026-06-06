export const tableTemplate =
  "${rows.length > 0 ? '| ' + rows[0].map((cell) => cell.text).join(' | ') + ' |\\n| ' + rows[0].map((cell) => '---').join(' | ') + ' |\\n' + rows.slice(1).map((row) => '| ' + row.map((cell) => cell.text).join(' | ') + ' |').join('\\n') : html}"
