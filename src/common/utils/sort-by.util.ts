export function validateSortBy<T extends string>(
  sortBy: string | undefined,
  allowedColumns: readonly T[],
  defaultColumn: T,
): T {
  if (!sortBy) return defaultColumn;
  return allowedColumns.includes(sortBy as T) ? (sortBy as T) : defaultColumn;
}
