export type SortDirection = "asc" | "desc";
export type SortState<K extends string> = { key: K; direction: SortDirection };

export type ExpenseSortKey = "name" | "month" | "planned" | "spent" | "remaining" | "progress";
export type ExpenseSort = SortState<ExpenseSortKey>;
export type SortableExpense = { name: string; planned: number; spent: number; year?: number; month?: number };

export const DEFAULT_EXPENSE_SORT: ExpenseSort = { key: "name", direction: "asc" };

/** Same column is clicked again -> reverse; a new column -> ascending. */
export function nextSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
  return { key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" };
}

export function nextExpenseSort(current: ExpenseSort, key: ExpenseSortKey): ExpenseSort {
  return nextSort(current, key);
}

export function expenseProgress(row: SortableExpense): number {
  return row.planned > 0 ? Math.min(100, Math.round(row.spent / row.planned * 100)) : row.spent > 0 ? 100 : 0;
}

export function sortExpenses<T>(rows: readonly T[], sort: ExpenseSort, values: (row: T) => SortableExpense, locale: string): T[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const value = (r: SortableExpense): number => {
    switch (sort.key) {
      case "month": return (r.year ?? 0) * 100 + (r.month ?? 0);
      case "planned": return r.planned;
      case "spent": return r.spent;
      case "remaining": return r.planned - r.spent;
      case "progress": return expenseProgress(r);
      default: return 0;
    }
  };
  return [...rows].sort((a, b) => {
    const x = values(a), y = values(b);
    const result = sort.key === "name" ? collator.compare(x.name, y.name) : value(x) - value(y);
    return result * (sort.direction === "asc" ? 1 : -1) || collator.compare(x.name, y.name) || ((x.year ?? 0) * 100 + (x.month ?? 0)) - ((y.year ?? 0) * 100 + (y.month ?? 0));
  });
}