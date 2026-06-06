// Returns values in first-seen order without duplicates.
export const unique = <Type>(values: Type[]) => [...new Set(values)]
