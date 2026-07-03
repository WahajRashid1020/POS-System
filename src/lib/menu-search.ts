/**
 * Decides which menu items to show on the POS terminal.
 *
 * When `query` is non-empty, items are matched by name across *all* categories
 * (case-insensitive substring) so a customer can find something they can't spot
 * on screen. When `query` is empty, it falls back to the original behaviour:
 * items belonging to the active category. Unavailable items are always hidden.
 */
export function filterMenuItems<
  T extends { name: string; category: string; isAvailable: boolean },
>(items: T[], activeCategory: string, query: string): T[] {
  const trimmed = query.trim().toLowerCase();

  if (trimmed) {
    return items.filter(
      (item) => item.isAvailable && item.name.toLowerCase().includes(trimmed),
    );
  }

  return items.filter(
    (item) => item.category === activeCategory && item.isAvailable,
  );
}
