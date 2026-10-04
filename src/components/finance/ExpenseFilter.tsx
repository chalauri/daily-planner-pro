import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFT } from "@/lib/finance-i18n";
import { money, monthLabel, ymRange } from "@/lib/finance";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const ALL = "__all__";

export function ExpenseFilter({ currency }: { currency: string }) {
  const { ft, lang } = useFT();
  const cy = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => cy - 3 + i);
  const [fromM, setFromM] = useState(1);
  const [fromY, setFromY] = useState(cy);
  const [toM, setToM] = useState(12);
  const [toY, setToY] = useState(cy);
  const [cat, setCat] = useState(ALL);
  const [onlyTax, setOnlyTax] = useState(false);
  const [onlySub, setOnlySub] = useState(false);

  const fromKey = fromY * 100 + fromM;
  const toKey = toY * 100 + toM;

  const q = useQuery({
    queryKey: ["fin", "filter", fromKey, toKey],
    queryFn: async () => {
      const { from } = ymRange({ year: fromY, month: fromM });
      const { to } = ymRange({ year: toY, month: toM });
      const [b, t] = await Promise.all([
        supabase
          .from("budgets")
          .select("id, year, month, amount, is_income_tax, is_subscription, category_id, categories!inner(name, kind)")
          .eq("categories.kind", "EXPENSE")
          .gte("year", fromY)
          .lte("year", toY),
        supabase.from("transactions").select("category_id, amount, tx_date").eq("kind", "EXPENSE").gte("tx_date", from).lt("tx_date", to),
      ]);
      if (b.error) throw b.error;
      if (t.error) throw t.error;
      return { budgets: b.data, txs: t.data };
    },
  });

  const inRange = useMemo(
    () => (q.data?.budgets ?? []).filter((b) => {
      const k = b.year * 100 + b.month;
      return k >= fromKey && k <= toKey;
    }),
    [q.data, fromKey, toKey],
  );

  const catOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of inRange) m.set(b.category_id, b.categories.name);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [inRange]);

  const rows = useMemo(() => {
    return inRange
      .filter((b) => (cat === ALL || b.category_id === cat) && (!onlyTax || b.is_income_tax) && (!onlySub || b.is_subscription))
      .map((b) => {
        const prefix = `${b.year}-${String(b.month).padStart(2, "0")}`;
        const spent = (q.data?.txs ?? [])
          .filter((t) => t.category_id === b.category_id && t.tx_date.startsWith(prefix))
          .reduce((s, t) => s + Number(t.amount), 0);
        return { ...b, planned: Number(b.amount), spent };
      })
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month) || a.categories.name.localeCompare(b.categories.name));
  }, [inRange, cat, onlyTax, onlySub, q.data]);

  const totals = rows.reduce((s, r) => ({ planned: s.planned + r.planned, spent: s.spent + r.spent }), { planned: 0, spent: 0 });
  const fmt = (n: number) => money(n, currency, lang);
  const mName = (m: number) => monthLabel({ year: cy, month: m }, lang).replace(/\s*\d{4}\s*$/, "");

  const ymPicker = (label: string, m: number, setM: (n: number) => void, y: number, setY: (n: number) => void) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Select value={String(m)} onValueChange={(v) => setM(Number(v))}>
          <SelectTrigger className="h-9 w-32" aria-label={`${label} month`}><SelectValue /></SelectTrigger>
          <SelectContent>{MONTHS.map((x) => <SelectItem key={x} value={String(x)}>{mName(x)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(y)} onValueChange={(v) => setY(Number(v))}>
          <SelectTrigger className="h-9 w-24" aria-label={`${label} year`}><SelectValue /></SelectTrigger>
          <SelectContent>{years.map((x) => <SelectItem key={x} value={String(x)}>{x}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        {ymPicker(ft("f.fromMonth"), fromM, setFromM, fromY, setFromY)}
        {ymPicker(ft("f.toMonth"), toM, setToM, toY, setToY)}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{ft("f.category")}</Label>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-9 w-48" aria-label={ft("f.category")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{ft("f.allCats")}</SelectItem>
              {catOptions.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox id="flt-tax" checked={onlyTax} onCheckedChange={(v) => setOnlyTax(v === true)} />
          <Label htmlFor="flt-tax" className="cursor-pointer">{ft("f.onlyTax")}</Label>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Checkbox id="flt-sub" checked={onlySub} onCheckedChange={(v) => setOnlySub(v === true)} />
          <Label htmlFor="flt-sub" className="cursor-pointer">{ft("f.onlySub")}</Label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{ft("f.month")}</th>
              <th className="px-4 py-3">{ft("f.category")}</th>
              <th className="px-4 py-3 text-right">{ft("f.planned")}</th>
              <th className="px-4 py-3 text-right">{ft("f.spent")}</th>
              <th className="px-4 py-3 text-right">{ft("f.remaining")}</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{ft("f.loading")}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{ft("f.noResults")}</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 whitespace-nowrap">{monthLabel({ year: r.year, month: r.month }, lang)}</td>
                  <td className="px-4 py-3 font-medium">
                    {r.categories.name}
                    {r.is_income_tax && <span className="ml-2 rounded-full border border-warning/40 bg-warning-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-warning">{ft("f.taxBadge")}</span>}
                    {r.is_subscription && <span className="ml-2 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">{ft("f.subBadge")}</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(r.planned)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(r.spent)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${r.planned - r.spent < 0 ? "text-destructive" : ""}`}>{fmt(r.planned - r.spent)}</td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-border font-semibold">
              <tr>
                <td className="px-4 py-3" colSpan={2}>{ft("f.total")}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.planned)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.spent)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmt(totals.planned - totals.spent)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
