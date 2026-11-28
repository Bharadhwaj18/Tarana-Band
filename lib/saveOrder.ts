interface OrderedRow {
  id: string;
  order_position?: number | null;
}

/**
 * Saves a new display order. `next` is the list in its new order (0, 1, 2, ...); only the rows whose place changed
 * are written. Throws if any save fails, so the caller can put the list back as it was.
 * Returns the list with its order_position numbers filled in.
 */
export async function saveOrder<T extends OrderedRow>(supabase: any, table: string, next: T[], previous: OrderedRow[]): Promise<T[]> {
  const before = new Map(previous.map((row) => [row.id, row.order_position]));
  const renumbered = next.map((row, index) => ({ ...row, order_position: index }));
  const changed = renumbered.filter((row) => before.get(row.id) !== row.order_position);

  const results = await Promise.all(
    changed.map((row) => supabase.from(table).update({ order_position: row.order_position }).eq('id', row.id))
  );
  const failed = results.find((result: { error: unknown }) => result.error);
  if (failed?.error) throw failed.error;
  return renumbered;
}
