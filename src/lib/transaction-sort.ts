import { nextSort, type SortState } from "./expense-sort";

export type TxSortKey = "date" | "category" | "amount" | "note";
export type TxSort = SortState<TxSortKey>;

export type SortableTransaction = {
  date: string;
  category: string;
  /** Signed like the table shows it: income positive, expense negative. */
  amount: number;
  note: string;
};

/** Newest first, the order the transactions are loaded in. */
export const DEFAULT_TX_SORT: TxSort = { key: "date", direction: "desc" };

export function nextTxSort(current: TxSort, key: TxSortKey): TxSort {
  return nextSort(current, key);
}

type TxLike = {
  tx_date: string;
  amount: string | number;
  kind: string;
  note: string | null;
  category_id: string | null;
};

/** Turns a stored transaction into the values the table sorts on. */
export function transactionSortValues(tx: TxLike, catName: (id: string | null) => string): SortableTransaction {
  const amount = Number(tx.amount);
  return {
    date: tx.tx_date,
    category: catName(tx.category_id),
    amount: tx.kind === "INCOME" ? amount : -amount,
    note: tx.note ?? "",
  };
}

export function sortTransactions<T>(
  rows: readonly T[],
  sort: TxSort,
  values: (row: T) => SortableTransaction,
  locale: string,
): T[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const date = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  return [...rows].sort((a, b) => {
    const x = values(a), y = values(b);
    const primary =
      sort.key === "date" ? date(x.date, y.date)
      : sort.key === "amount" ? x.amount - y.amount
      : sort.key === "category" ? collator.compare(x.category, y.category)
      : collator.compare(x.note, y.note);
    return (
      primary * (sort.direction === "asc" ? 1 : -1) ||
      collator.compare(x.category, y.category) ||
      date(x.date, y.date) ||
      collator.compare(x.note, y.note)
    );
  });
}
