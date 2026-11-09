import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFT } from "@/lib/finance-i18n";
import { formatMonthYear } from "@/lib/i18n";
import type { Category } from "@/lib/finance";

type Tx = { kind: string; amount: number; category_id: string | null; period: string | null; tx_date: string };
type Bu = { amount: number; month: number; category_id: string };

function useYearFinance(year: number) {
  return useQuery({
    queryKey: ["fin", "stats", year],
    queryFn: async () => {
      const txs: Tx[] = [];
      for (let o = 0; ; o += 1000) {
        const { data, error } = await supabase.from("transactions")
          .select("kind,amount,category_id,period,tx_date")
          .gte("period", `${year}-01-01`).lt("period", `${year + 1}-01-01`)
          .order("id").range(o, o + 999);
        if (error) throw error;
        txs.push(...((data ?? []) as Tx[]));
        if ((data?.length ?? 0) < 1000) break;
      }
      const { data: bu, error } = await supabase.from("budgets").select("amount,month,category_id").eq("year", year);
      if (error) throw error;
      return { txs, budgets: (bu ?? []) as Bu[] };
    },
  });
}

const fmtNum = (v: number) => Math.round(v * 100) / 100;

function ChartCard({ title, children, height = 288 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="surface-card p-4">
      <h3 className="mb-3 font-display text-lg font-semibold">{title}</h3>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

export function FinanceStatistics({ categories, initialYear }: { categories: Category[]; initialYear: number }) {
  const { ft, lang } = useFT();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const q = useYearFinance(year);
  const kind = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const data = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      label: formatMonthYear(year, i + 1, lang).replace(` ${year}`, ""),
      planned: 0, actual: 0, incomeTx: 0, incomePlan: 0,
      cats: new Map<string, { name: string; planned: number; actual: number }>(),
    }));
    const cat = (m: (typeof months)[number], id: string) => {
      let r = m.cats.get(id);
      if (!r) { r = { name: kind.get(id)?.name ?? ft("f.unplanned"), planned: 0, actual: 0 }; m.cats.set(id, r); }
      return r;
    };
    for (const b of q.data?.budgets ?? []) {
      const m = months[b.month - 1]; const c = kind.get(b.category_id);
      if (!m || !c) continue;
      if (c.kind === "INCOME") m.incomePlan += Number(b.amount);
      else { m.planned += Number(b.amount); cat(m, c.id).planned += Number(b.amount); }
    }
    for (const t of q.data?.txs ?? []) {
      const m = months[Number((t.period ?? t.tx_date).slice(5, 7)) - 1];
      if (!m) continue;
      if (t.kind === "INCOME") m.incomeTx += Number(t.amount);
      else { m.actual += Number(t.amount); cat(m, t.category_id ?? "none").actual += Number(t.amount); }
    }
    return months.map((m) => ({
      label: m.label,
      planned: fmtNum(m.planned),
      actual: fmtNum(m.actual),
      income: fmtNum(m.incomePlan > 0 ? m.incomePlan : m.incomeTx),
      cats: [...m.cats.values()].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ ...c, planned: fmtNum(c.planned), actual: fmtNum(c.actual) })),
    }));
  }, [q.data, kind, year, lang, ft]);

  const axis = { tick: { fontSize: 11 }, stroke: "var(--muted-foreground)" };
  const selMonth = data[month - 1] ?? data[0] ?? { label: "", cats: [] };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label htmlFor="fin-stats-year">{ft("f.year")}</Label>
        <Input id="fin-stats-year" type="number" min={2000} max={2100} value={year} className="w-28"
          onChange={(e) => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 2000 && n <= 2100) setYear(n); }} />
      </div>
      {q.isError ? <p role="alert" className="text-destructive">{ft("f.statsError")}</p>
        : q.isPending ? <p role="status" className="py-16 text-center text-muted-foreground">{ft("f.loading")}</p> : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={ft("f.pvaMonthly")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" interval={0} angle={-35} textAnchor="end" height={50} {...axis} />
                  <YAxis {...axis} /><Tooltip /><Legend />
                  <Bar dataKey="planned" name={ft("f.planned")} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name={ft("f.spent")} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={ft("f.incomeByMonth")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" interval={0} angle={-35} textAnchor="end" height={50} {...axis} />
                  <YAxis {...axis} /><Tooltip />
                  <Bar dataKey="income" name={ft("f.income")} fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title={ft("f.expensesByMonth")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" interval={0} angle={-35} textAnchor="end" height={50} {...axis} />
                  <YAxis {...axis} /><Tooltip />
                  <Bar dataKey="actual" name={ft("f.expenses")} fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <h3 className="font-display text-xl font-semibold">{ft("f.byCategory")}</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="fin-stats-month" className="shrink-0 text-sm font-normal">{ft("f.month")}</Label>
              <select
                id="fin-stats-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {data.map((m, i) => <option key={m.label} value={i + 1}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <ChartCard title={selMonth.label} height={Math.max(288, selMonth.cats.length * 34 + 60)}>
            {selMonth.cats.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{ft("f.noData")}</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selMonth.cats} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" {...axis} />
                  <YAxis type="category" dataKey="name" width={190} interval={0} {...axis} />
                  <Tooltip /><Legend verticalAlign="top" height={24} />
                  <Bar dataKey="planned" name={ft("f.planned")} fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" name={ft("f.spent")} fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </>
      )}
    </div>
  );
}
