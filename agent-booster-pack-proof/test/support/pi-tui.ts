// Test double for the Pi TUI width helpers used by rendering specs.

/** Return the visible width of plain test strings. */
export function visibleWidth(value: string): number {
  return value.length;
}

/** Truncate plain test strings to the requested visible width. */
export function truncateToWidth(value: string, width: number): string {
  return value.length <= width ? value : value.slice(0, Math.max(0, width));
}
