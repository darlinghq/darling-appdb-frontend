/** Parses a ?page= query parameter into a 1-based page number (1 when absent or invalid). */
export function pageFromParam(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}
