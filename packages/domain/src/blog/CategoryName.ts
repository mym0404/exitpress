const leadingDashPattern = /^-\s*/

export const sanitizeCategoryName = (value: string) => value.replace(leadingDashPattern, "").trim()
