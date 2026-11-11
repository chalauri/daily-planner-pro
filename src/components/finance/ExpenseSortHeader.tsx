import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SortDirection, SortState } from "@/lib/expense-sort";

export function ExpenseSortHeader<K extends string>({ children, column, sort, onSort, right = false }: {
  children: ReactNode;
  column: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  right?: boolean;
}) {
  const active = sort.key === column;
  const Icon = active ? sort.direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
  return (
    <th className={`px-4 py-3 ${right ? "text-right" : "text-left"}`} aria-sort={active ? sort.direction === "asc" ? "ascending" : "descending" : "none"}>
      <Button variant="ghost" size="sm" className={`h-auto min-h-8 whitespace-nowrap px-0 font-inherit text-inherit uppercase hover:bg-transparent hover:text-foreground ${right ? "ml-auto" : ""}`} onClick={() => onSort(column)}>
        {children}<Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
      </Button>
    </th>
  );
}

export type { SortDirection };
