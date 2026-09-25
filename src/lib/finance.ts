import { formatMonthYear } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TxKind = Database["public"]["Enums"]["tx_kind"];

export const CURRENCIES = ["GEL", "USD", "EUR", "PLN"] as const;
export type Currency = (typeof CURRENCIES)[number];

export interface YM {
  year: number;
  month: number; // 1..12
}

export function ymRange({ year, month }: YM) {
  const start = new Date(year, month - 1, 1);
  return { from: format(start, "yyyy-MM-dd"), to: format(addMonths(start, 1), "yyyy-MM-dd") };
}

export function shiftYM(ym: YM, delta: number): YM {
  const d = addMonths(new Date(ym.year, ym.month - 1, 1), delta);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function monthLabel(ym: YM, lang: string) {
  return formatMonthYear(ym.year, ym.month, lang);
}

export function money(n: number, currency: string, lang: string) {
  try {
    return new Intl.NumberFormat(lang === "ka" ? "ka-GE" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}
export { uid as currentUserId };

export function useCategories() {
  return useQuery({
    queryKey: ["fin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useMonthData(ym: YM) {
  return useQuery({
    queryKey: ["fin", "month", ym.year, ym.month],
    queryFn: async () => {
      const { from, to } = ymRange(ym);
      const [tx, bu] = await Promise.all([
        supabase.from("transactions").select("*").gte("tx_date", from).lt("tx_date", to).order("tx_date", { ascending: false }),
        supabase.from("budgets").select("*").eq("year", ym.year).eq("month", ym.month),
      ]);
      if (tx.error) throw tx.error;
      if (bu.error) throw bu.error;
      return { transactions: tx.data, budgets: bu.data };
    },
  });
}

export function useYearTrend(ym: YM) {
  return useQuery({
    queryKey: ["fin", "trend", ym.year, ym.month],
    queryFn: async () => {
      const start = shiftYM(ym, -11);
      const { from } = ymRange(start);
      const { to } = ymRange(ym);
      const { data, error } = await supabase
        .from("transactions")
        .select("kind, amount, tx_date")
        .gte("tx_date", from)
        .lt("tx_date", to);
      if (error) throw error;
      const rows: { key: string; ym: YM; income: number; expense: number }[] = [];
      for (let i = 0; i < 12; i++) {
        const m = shiftYM(start, i);
        rows.push({ key: `${m.year}-${String(m.month).padStart(2, "0")}`, ym: m, income: 0, expense: 0 });
      }
      for (const r of data) {
        const row = rows.find((x) => x.key === r.tx_date.slice(0, 7));
        if (!row) continue;
        if (r.kind === "INCOME") row.income += Number(r.amount);
        else row.expense += Number(r.amount);
      }
      return rows;
    },
  });
}

export function useCurrency(ym: YM) {
  const q = useQuery({
    queryKey: ["fin", "currency", ym.year, ym.month],
    queryFn: async () => {
      const [s, m] = await Promise.all([
        supabase.from("finance_settings").select("currency").maybeSingle(),
        supabase.from("month_settings").select("currency").eq("year", ym.year).eq("month", ym.month).maybeSingle(),
      ]);
      const def = (s.data?.currency ?? "GEL") as Currency;
      const override = (m.data?.currency ?? null) as Currency | null;
      return { def, override, effective: override ?? def };
    },
  });
  return q;
}

export function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["fin"] });
}

export interface CategoryRow {
  category: Category;
  planned: number;
  spent: number;
  budgetId: string | null;
}

export function buildCategoryRows(cats: Category[], budgets: Budget[], txs: Transaction[]): CategoryRow[] {
  return cats
    .filter((c) => c.kind === "EXPENSE")
    .map((c) => {
      const b = budgets.find((x) => x.category_id === c.id);
      const spent = txs
        .filter((t) => t.kind === "EXPENSE" && t.category_id === c.id)
        .reduce((s, t) => s + Number(t.amount), 0);
      return { category: c, planned: b ? Number(b.amount) : 0, spent, budgetId: b?.id ?? null };
    });
}

export function budgetState(planned: number, spent: number): "over" | "near" | "ok" | "none" {
  if (planned <= 0) return spent > 0 ? "over" : "none";
  if (spent > planned) return "over";
  if (spent >= planned * 0.8) return "near";
  return "ok";
}

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: (string | number)[][]) {
  return (
    "\uFEFF" +
    rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n")
  );
}
