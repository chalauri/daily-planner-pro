import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronsUpDown, Download, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppHeader } from "@/components/AppHeader";
import { formatMonthYear, useLang } from "@/lib/i18n";
import { CURRENCIES, currentUserId, downloadFile, money, toCsv } from "@/lib/finance";

type Saving = Database["public"]["Tables"]["savings"]["Row"];
type Kind = Database["public"]["Enums"]["saving_type"];
const KINDS: Kind[] = ["CASH", "STOCKS", "RETIREMENT"];

const T = {
  en: {
    title: "Savings", add: "Add saving", edit: "Edit saving", month: "Month", year: "Year", type: "Type",
    currency: "Currency", amount: "Amount", company: "Company", note: "Note", from: "From", to: "To",
    all: "All", CASH: "Cash", STOCKS: "Stocks", RETIREMENT: "Retirement", save: "Save", cancel: "Cancel",
    entries: "Entries", monthly: "Monthly", yearly: "Yearly", total: "Total", empty: "No savings match these filters.",
    period: "Period", del: "Delete this saving?", delYes: "Delete", companyReq: "Enter company name",
    amountReq: "Enter an amount greater than 0", saved: "Saved", reset: "Reset filters", csv: "Export CSV",
    totalsHint: "Totals are shown per currency — different currencies are never added together.",
    emptySub: "Add a cash, stock, or retirement saving to start tracking your progress.",
  },
  ka: {
    title: "დანაზოგი", add: "დანაზოგის დამატება", edit: "დანაზოგის რედაქტირება", month: "თვე", year: "წელი", type: "ტიპი",
    currency: "ვალუტა", amount: "თანხა", company: "კომპანია", note: "შენიშვნა", from: "დან", to: "მდე",
    all: "ყველა", CASH: "ნაღდი", STOCKS: "აქციები", RETIREMENT: "საპენსიო", save: "შენახვა", cancel: "გაუქმება",
    entries: "ჩანაწერები", monthly: "თვიური", yearly: "წლიური", total: "ჯამი", empty: "ფილტრებს დანაზოგი არ ემთხვევა.",
    period: "პერიოდი", del: "წავშალოთ ეს დანაზოგი?", delYes: "წაშლა", companyReq: "შეიყვანეთ კომპანიის სახელი",
    amountReq: "შეიყვანეთ 0-ზე მეტი თანხა", saved: "შენახულია", reset: "ფილტრების გასუფთავება", csv: "CSV ექსპორტი",
    totalsHint: "ჯამები ნაჩვენებია ვალუტების მიხედვით — სხვადასხვა ვალუტა არ იკრიბება.",
    emptySub: "დაამატეთ ნაღდი, აქციების ან საპენსიო დანაზოგი პროგრესის სანახავად.",
  },
  pl: {
    title: "Oszczędności", add: "Dodaj oszczędność", edit: "Edytuj oszczędność", month: "Miesiąc", year: "Rok", type: "Typ",
    currency: "Waluta", amount: "Kwota", company: "Firma", note: "Notatka", from: "Od", to: "Do",
    all: "Wszystkie", CASH: "Gotówka", STOCKS: "Akcje", RETIREMENT: "Emerytalne", save: "Zapisz", cancel: "Anuluj",
    entries: "Wpisy", monthly: "Miesięcznie", yearly: "Rocznie", total: "Suma", empty: "Brak oszczędności dla tych filtrów.",
    period: "Okres", del: "Usunąć tę oszczędność?", delYes: "Usuń", companyReq: "Podaj nazwę firmy",
    amountReq: "Podaj kwotę większą od 0", saved: "Zapisano", reset: "Wyczyść filtry", csv: "Eksport CSV",
    totalsHint: "Sumy są pokazane dla każdej waluty osobno — różne waluty nie są sumowane.",
    emptySub: "Dodaj oszczędność gotówkową, akcyjną lub emerytalną, aby śledzić postępy.",
  },
};
type SKey = keyof typeof T.en;

export const Route = createFileRoute("/_authenticated/savings")({
  head: () => ({
    meta: [
      { title: "Savings — Personal planner" },
      { name: "description", content: "Track cash, stock and retirement savings in several currencies with monthly and yearly reports." },
      { property: "og:title", content: "Savings — Personal planner" },
      { property: "og:description", content: "Track cash, stock and retirement savings with monthly and yearly reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavingsPage,
});

const ymKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

function SavingsPage() {
  const { t, lang } = useLang();
  const s = (k: SKey) => (T[lang as keyof typeof T] ?? T.en)[k];
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["savings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("savings").select("*").order("year", { ascending: false }).order("month", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const rows = list.data ?? [];
  const companies = useMemo(
    () => [...new Set(rows.map((r) => r.company).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fKind, setFKind] = useState<string[]>([]);
  const [fCur, setFCur] = useState<string[]>([]);
  const [fCo, setFCo] = useState<string[]>([]);
  const [view, setView] = useState<"entries" | "monthly" | "yearly">("entries");
  const [dialog, setDialog] = useState<Saving | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Saving | null>(null);

  const filtered = rows.filter((r) => {
    const k = ymKey(r.year, r.month);
    if (from && k < from) return false;
    if (to && k > to) return false;
    if (fKind.length && !fKind.includes(r.kind)) return false;
    if (fCur.length && !fCur.includes(r.currency)) return false;
    if (fCo.length && (r.company ? !fCo.includes(r.company) : true)) return false;
    return true;
  });

  const fmt = (n: number, c: string) => money(n, c, lang);
  const totals = new Map<string, number>();
  for (const r of filtered) totals.set(r.currency, (totals.get(r.currency) ?? 0) + Number(r.amount));

  // grouped: period -> currency -> sum
  const grouped = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const r of filtered) {
      const p = view === "yearly" ? String(r.year) : ymKey(r.year, r.month);
      const inner = m.get(p) ?? new Map<string, number>();
      inner.set(r.currency, (inner.get(r.currency) ?? 0) + Number(r.amount));
      m.set(p, inner);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered, view]);
  const usedCurrencies = CURRENCIES.filter((c) => totals.has(c));
  const periodLabel = (p: string) => (p.length === 4 ? p : formatMonthYear(Number(p.slice(0, 4)), Number(p.slice(5)), lang));

  async function remove() {
    if (!toDelete) return;
    const { error } = await supabase.from("savings").delete().eq("id", toDelete.id);
    setToDelete(null);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["savings"] });
  }

  function exportCsv() {
    const data: (string | number)[][] = [[s("period"), s("type"), s("company"), s("currency"), s("amount"), s("note")]];
    for (const r of filtered) data.push([ymKey(r.year, r.month), s(r.kind), r.company ?? "", r.currency, Number(r.amount), r.note ?? ""]);
    for (const [c, v] of totals) data.push([s("total"), "", "", c, v, ""]);
    downloadFile("savings.csv", toCsv(data), "text/csv;charset=utf-8");
  }
  return (
    <main className="min-h-screen bg-background">
      <AppHeader />

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold">{s("title")}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" />{s("csv")}</Button>
            <Button onClick={() => setDialog("new")}><Plus className="h-4 w-4" />{s("add")}</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(usedCurrencies.length ? usedCurrencies : ["GEL"]).map((c, index) => (
            <div
              key={c}
              className={`rounded-xl border border-border border-l-4 p-4 shadow-sm ${
                index % 3 === 0
                  ? "border-l-success bg-success-soft/45"
                  : index % 3 === 1
                    ? "border-l-primary bg-secondary/65"
                    : "border-l-warning bg-warning-soft/45"
              }`}
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{s("total")} · {c}</div>
              <div className="mt-1 font-display text-3xl font-semibold tabular-nums">{fmt(totals.get(c) ?? 0, c)}</div>
            </div>
          ))}
        </div>

        <div className="surface-card grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1.5"><Label>{s("from")}</Label><Input className="h-8" type="month" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>{s("to")}</Label><Input className="h-8" type="month" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <MultiFilter label={s("type")} allLabel={s("all")} options={KINDS.map((k) => ({ value: k, label: s(k) }))} selected={fKind} onChange={setFKind} />
          <MultiFilter label={s("currency")} allLabel={s("all")} options={CURRENCIES.map((c) => ({ value: c, label: c }))} selected={fCur} onChange={setFCur} />
          <MultiFilter label={s("company")} allLabel={s("all")} options={companies.map((c) => ({ value: c, label: c }))} selected={fCo} onChange={setFCo} />
          <div className="flex items-end">
            <Button variant="ghost" className="w-full" onClick={() => { setFrom(""); setTo(""); setFKind([]); setFCur([]); setFCo([]); }}>{s("reset")}</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-md border border-border bg-card p-1" role="tablist">
            {(["entries", "monthly", "yearly"] as const).map((v) => (
              <Button key={v} size="sm" role="tab" aria-selected={view === v} variant={view === v ? "default" : "ghost"} onClick={() => setView(v)}>
                {s(v)}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{s("totalsHint")}</p>
        </div>

        <div className="surface-card overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-secondary text-primary">
                <PiggyBank className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl">{list.isLoading ? "…" : s("empty")}</h2>
              {!list.isLoading && <p className="mt-2 max-w-md text-sm text-muted-foreground">{s("emptySub")}</p>}
              {!list.isLoading && (
                <Button className="mt-6" onClick={() => setDialog("new")}>
                  <Plus className="h-4 w-4" />{s("add")}
                </Button>
              )}
            </div>
          ) : view === "entries" ? (
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr><th className="p-3">{s("period")}</th><th className="p-3">{s("type")}</th><th className="p-3">{s("company")}</th><th className="p-3">{s("note")}</th><th className="p-3 text-right">{s("amount")}</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-l-4 border-border last:border-b-0 ${
                      r.kind === "CASH"
                        ? "border-l-warning bg-warning-soft/30 hover:bg-warning-soft/50"
                        : r.kind === "STOCKS"
                          ? "border-l-success bg-success-soft/30 hover:bg-success-soft/50"
                          : "border-l-primary bg-secondary/50 hover:bg-secondary/75"
                    }`}
                  >
                    <td className="p-3">{formatMonthYear(r.year, r.month, lang)}</td>
                    <td className="p-3">{s(r.kind)}</td>
                    <td className="p-3">{r.company ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{r.note ?? ""}</td>
                    <td className="p-3 text-right text-base font-semibold tabular-nums">{fmt(Number(r.amount), r.currency)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" onClick={() => setDialog(r)} aria-label={s("edit")}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setToDelete(r)} aria-label={s("delYes")}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border font-semibold">
                {usedCurrencies.map((c) => (
                  <tr key={c}><td className="p-3" colSpan={4}>{s("total")} · {c}</td><td className="p-3 text-right text-base tabular-nums">{fmt(totals.get(c) ?? 0, c)}</td><td /></tr>
                ))}
              </tfoot>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr><th className="p-3">{s("period")}</th>{usedCurrencies.map((c) => <th key={c} className="p-3 text-right">{c}</th>)}</tr>
              </thead>
              <tbody>
                {grouped.map(([p, m]) => (
                  <tr key={p} className="border-b border-l-4 border-border border-l-primary bg-secondary/35 last:border-b-0 hover:bg-secondary/60">
                    <td className="p-3">{periodLabel(p)}</td>
                    {usedCurrencies.map((c) => {
                      const amount = m.get(c);
                      return <td key={c} className="p-3 text-right text-base font-medium tabular-nums">{amount === undefined ? "—" : fmt(amount, c)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border font-semibold">
                <tr><td className="p-3">{s("total")}</td>{usedCurrencies.map((c) => <td key={c} className="p-3 text-right text-base tabular-nums">{fmt(totals.get(c) ?? 0, c)}</td>)}</tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {dialog && (
        <SavingDialog
          initial={dialog === "new" ? null : dialog}
          companies={companies}
          s={s}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); toast.success(s("saved")); qc.invalidateQueries({ queryKey: ["savings"] }); }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{s("del")}</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{s("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>{s("delYes")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function SavingDialog({ initial, companies, s, onClose, onSaved }: {
  initial: Saving | null; companies: string[]; s: (k: SKey) => string; onClose: () => void; onSaved: () => void;
}) {
  const { lang } = useLang();
  const now = new Date();
  const [year, setYear] = useState(initial?.year ?? now.getFullYear());
  const [month, setMonth] = useState(initial?.month ?? now.getMonth() + 1);
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "CASH");
  const [currency, setCurrency] = useState(initial?.currency ?? "PLN");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const needsCompany = kind !== "CASH";

  async function save() {
    const amt = Number(amount.replace(",", "."));
    if (!(amt > 0)) { toast.error(s("amountReq")); return; }
    const co = company.trim();
    if (needsCompany && !co) { toast.error(s("companyReq")); return; }
    // reuse existing spelling if it matches case-insensitively
    const existing = companies.find((c) => c.toLowerCase() === co.toLowerCase());
    setBusy(true);
    const payload = {
      year, month, kind, currency, amount: amt,
      company: needsCompany ? existing ?? co : null,
      note: note.trim() || null,
    };
    const { error } = initial
      ? await supabase.from("savings").update(payload).eq("id", initial.id)
      : await supabase.from("savings").insert({ ...payload, user_id: await currentUserId() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? s("edit") : s("add")}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>{s("month")}</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>{formatMonthYear(2000, m, lang).replace(/\s*2000\s*/, "")}</SelectItem>
              ))}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label>{s("year")}</Label>
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={1990} max={2100} />
          </div>
          <div className="space-y-1"><Label>{s("type")}</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as Kind)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{s(k)}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label>{s("currency")}</Label>
            <Select value={currency} onValueChange={setCurrency}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1 sm:col-span-2"><Label>{s("amount")}</Label>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          {needsCompany && (
            <div className="space-y-1 sm:col-span-2"><Label>{s("company")}</Label>
              <Input list="saving-companies" value={company} onChange={(e) => setCompany(e.target.value)} />
              <datalist id="saving-companies">{companies.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
          )}
          <div className="space-y-1 sm:col-span-2"><Label>{s("note")}</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>{s("cancel")}</Button>
          <Button onClick={save} disabled={busy}>{s("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MultiFilter({ label, allLabel, options, selected, onChange }: {
  label: string; allLabel: string; options: { value: string; label: string }[];
  selected: string[]; onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const summary = selected.length === 0
    ? allLabel
    : options.filter((o) => selected.includes(o.value)).map((o) => o.label).join(", ");
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="h-8 w-full justify-between font-normal">
            <span className="truncate">{summary}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 max-h-72 overflow-y-auto p-2">
          {options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
              <Checkbox checked={selected.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
              <span className="truncate">{o.label}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => onChange([])}>{allLabel}</Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
