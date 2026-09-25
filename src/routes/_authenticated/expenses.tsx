import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ChevronLeft, ChevronRight, Copy, Download, FileText, LogOut, Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppTabs } from "@/components/AppTabs";
import { LanguageToggle, useLang } from "@/lib/i18n";
import { useFT } from "@/lib/finance-i18n";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { CategoryDialog } from "@/components/finance/CategoryDialog";
import { FinanceReports } from "@/components/finance/FinanceReports";
import {
  CURRENCIES,
  budgetState,
  buildCategoryRows,
  currentUserId,
  downloadFile,
  money,
  monthLabel,
  shiftYM,
  toCsv,
  useCategories,
  useCurrency,
  useInvalidateFinance,
  useMonthData,
  useYearTrend,
  type Transaction,
  type YM,
} from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Personal planner" },
      { name: "description", content: "Track income and expenses, plan monthly budgets and see reports." },
      { property: "og:title", content: "Expenses — Personal planner" },
      { property: "og:description", content: "Track income and expenses, plan monthly budgets and see reports." },
    ],
  }),
  component: ExpensesPage,
});

function nowYM(): YM {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function ExpensesPage() {
  const { t } = useLang();
  const { ft, lang } = useFT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refresh = useInvalidateFinance();
  const [ym, setYM] = useState<YM>(nowYM);
  const cats = useCategories();
  const month = useMonthData(ym);
  const trend = useYearTrend(ym);
  const cur = useCurrency(ym);
  const currency = cur.data?.effective ?? "GEL";
  const fmt = (n: number) => money(n, currency, lang);
  const mName = monthLabel(ym, lang);

  const [txOpen, setTxOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [txDefaultCat, setTxDefaultCat] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState<null | "INCOME" | "EXPENSE">(null);
  const [details, setDetails] = useState<string | null>(null);
  const [delTx, setDelTx] = useState<Transaction | null>(null);
  const [delCat, setDelCat] = useState<string | null>(null);
  const [editCat, setEditCat] = useState<null | { id: string; name: string; amount: number; kind: "INCOME" | "EXPENSE" }>(null);

  const categories = cats.data ?? [];
  const txs = month.data?.transactions ?? [];
  const budgets = month.data?.budgets ?? [];
  const rows = useMemo(() => buildCategoryRows(categories, budgets, txs), [categories, budgets, txs]);
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? ft("f.unplanned");

  const expense = txs.filter((x) => x.kind === "EXPENSE").reduce((s, x) => s + Number(x.amount), 0);
  const plannedTotal = rows.reduce((s, r) => s + r.planned, 0);
  const uncategorized = txs.filter((x) => x.kind === "EXPENSE" && !x.category_id).reduce((s, x) => s + Number(x.amount), 0);
  const over = rows.filter((r) => r.planned > 0 && r.spent > r.planned);
  const incomeRows = categories
    .filter((c) => c.kind === "INCOME")
    .map((c) => ({
      c,
      total: txs.filter((x) => x.category_id === c.id).reduce((s, x) => s + Number(x.amount), 0),
      expected: Number(budgets.find((b) => b.category_id === c.id)?.amount ?? 0),
    }));
  const categorizedIncomeIds = new Set(incomeRows.map((r) => r.c.id));
  const income =
    incomeRows.reduce((s, r) => s + (r.expected > 0 ? r.expected : r.total), 0) +
    txs
      .filter((x) => x.kind === "INCOME" && (!x.category_id || !categorizedIncomeIds.has(x.category_id)))
      .reduce((s, x) => s + Number(x.amount), 0);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function savePlanned(categoryId: string, value: string, current: number) {
    const amount = Number(value || 0);
    if (Number.isNaN(amount) || amount < 0 || amount === current) return;
    const user_id = await currentUserId();
    const { error } = await supabase
      .from("budgets")
      .upsert({ user_id, category_id: categoryId, year: ym.year, month: ym.month, amount }, { onConflict: "category_id,year,month" });
    if (error) { toast.error(error.message); return; }
    toast.success(ft("f.saved"));
    refresh();
  }

  async function copyPrev() {
    const prev = shiftYM(ym, -1);
    const { data, error } = await supabase.from("budgets").select("category_id, amount").eq("year", prev.year).eq("month", prev.month);
    if (error) { toast.error(error.message); return; }
    if (!data.length) { toast.info(ft("f.nothingToCopy")); return; }
    const user_id = await currentUserId();
    const { error: e2 } = await supabase.from("budgets").upsert(
      data.map((b) => ({ user_id, category_id: b.category_id, amount: b.amount, year: ym.year, month: ym.month })),
      { onConflict: "category_id,year,month" },
    );
    if (e2) { toast.error(e2.message); return; }
    toast.success(ft("f.copied", { n: data.length }));
    refresh();
  }

  async function setDefaultCurrency(c: string) {
    const user_id = await currentUserId();
    const { error } = await supabase.from("finance_settings").upsert({ user_id, currency: c });
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  async function setMonthCurrency(c: string) {
    const user_id = await currentUserId();
    const { error } =
      c === "default"
        ? await supabase.from("month_settings").delete().eq("year", ym.year).eq("month", ym.month)
        : await supabase.from("month_settings").upsert({ user_id, year: ym.year, month: ym.month, currency: c }, { onConflict: "user_id,year,month" });
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  async function openReceipt(path: string) {
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 300);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function confirmDeleteTx() {
    if (!delTx) return;
    const { error } = await supabase.from("transactions").delete().eq("id", delTx.id);
    if (error) toast.error(error.message);
    else toast.success(ft("f.deleted"));
    setDelTx(null);
    refresh();
  }

  async function confirmDeleteCat() {
    if (!delCat) return;
    const { error } = await supabase.from("categories").delete().eq("id", delCat);
    if (error) toast.error(error.message);
    else toast.success(ft("f.deleted"));
    setDelCat(null);
    refresh();
  }

  function summaryTable(): (string | number)[][] {
    const out: (string | number)[][] = [[ft("f.category"), ft("f.planned"), ft("f.spent"), ft("f.difference"), ""]];
    for (const r of rows) {
      const st = budgetState(r.planned, r.spent);
      out.push([r.category.name, r.planned.toFixed(2), r.spent.toFixed(2), (r.planned - r.spent).toFixed(2), st === "over" ? ft("f.over") : ""]);
    }
    if (uncategorized > 0) out.push([ft("f.unplanned"), "0.00", uncategorized.toFixed(2), (-uncategorized).toFixed(2), ""]);
    out.push([ft("f.total"), plannedTotal.toFixed(2), expense.toFixed(2), (plannedTotal - expense).toFixed(2), ""]);
    return out;
  }

  function exportCsv() {
    const key = `${ym.year}-${String(ym.month).padStart(2, "0")}`;
    const out: (string | number)[][] = [
      [ft("f.title"), mName, currency],
      [ft("f.income"), income.toFixed(2)],
      [ft("f.expenses"), expense.toFixed(2)],
      [ft("f.savings"), (income - plannedTotal).toFixed(2)],
      [],
      [ft("f.summary")],
      ...summaryTable(),
      [],
      [ft("f.tab.tx")],
      [ft("f.date"), ft("f.type"), ft("f.category"), ft("f.amount"), ft("f.note")],
      ...txs.map((x) => [x.tx_date, x.kind === "INCOME" ? ft("f.income") : ft("f.expenses"), catName(x.category_id), Number(x.amount).toFixed(2), x.note ?? ""]),
    ];
    downloadFile(`report-${key}.csv`, toCsv(out), "text/csv;charset=utf-8");
  }

  function exportPdf() {
    const esc = (s: string | number) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
    const table = (data: (string | number)[][], highlight?: (row: (string | number)[]) => boolean) =>
      `<table><thead><tr>${(data[0] ?? []).map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${data
        .slice(1)
        .map((r) => `<tr class="${highlight?.(r) ? "over" : ""}">${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(mName)}</title><style>
      body{font-family:system-ui,sans-serif;padding:24px;color:#222}h1{margin:0 0 4px}table{border-collapse:collapse;width:100%;margin:12px 0 24px}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:12px}th{background:#f3f3f3}.over td{background:#fde2e2;color:#9b1c1c}
      .kpi{display:flex;gap:24px;margin:12px 0}.kpi div{border:1px solid #ccc;padding:8px 12px;border-radius:6px}</style></head><body>
      <h1>${esc(ft("f.title"))} — ${esc(mName)}</h1>
      <div class="kpi"><div>${esc(ft("f.income"))}: <b>${esc(fmt(income))}</b></div><div>${esc(ft("f.expenses"))}: <b>${esc(fmt(expense))}</b></div><div>${esc(ft("f.savings"))}: <b>${esc(fmt(income - plannedTotal))}</b></div></div>
      <h2>${esc(ft("f.summary"))}</h2>${table(summaryTable(), (r) => r[4] === ft("f.over"))}
      <h2>${esc(ft("f.tab.tx"))}</h2>${table([
        [ft("f.date"), ft("f.type"), ft("f.category"), ft("f.amount"), ft("f.note")],
        ...txs.map((x) => [x.tx_date, x.kind === "INCOME" ? ft("f.income") : ft("f.expenses"), catName(x.category_id), fmt(Number(x.amount)), x.note ?? ""]),
      ])}
      <script>window.onload=()=>{window.print()}</script></body></html>`);
    w.document.close();
  }

  const detailRow = rows.find((r) => r.category.id === details);
  const detailTxs = txs.filter((x) => x.category_id === details);
  const loading = cats.isLoading || month.isLoading;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl font-semibold">{t("app.name")}</span>
            <AppTabs />
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              {t("sign.out")}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => setYM(shiftYM(ym, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="min-w-48 text-center font-display text-3xl font-semibold capitalize">{mName}</h1>
            <Button variant="outline" size="icon" aria-label="Next month" onClick={() => setYM(shiftYM(ym, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{ft("f.defaultCurrency")}</p>
              <Select value={cur.data?.def ?? "GEL"} onValueChange={setDefaultCurrency}>
                <SelectTrigger className="w-28" aria-label={ft("f.defaultCurrency")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{ft("f.monthCurrency")}</p>
              <Select value={cur.data?.override ?? "default"} onValueChange={setMonthCurrency}>
                <SelectTrigger className="w-40" aria-label={ft("f.monthCurrency")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{ft("f.useDefault", { c: cur.data?.def ?? "GEL" })}</SelectItem>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setCatOpen("INCOME")}>
              <Plus className="h-4 w-4" />
              {ft("f.addIncome")}
            </Button>
            <Button variant="outline" onClick={() => setCatOpen("EXPENSE")}>
              <Plus className="h-4 w-4" />
              {ft("f.addExpense")}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setTxDefaultCat(null);
                setTxOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {ft("f.addTx")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: ft("f.income"), value: fmt(income), tone: "text-success" },
            { label: ft("f.expenses"), value: fmt(expense), tone: "text-destructive" },
            { label: ft("f.savings"), value: fmt(income - plannedTotal), tone: income - plannedTotal >= 0 ? "text-primary" : "text-destructive" },
            { label: ft("f.planned"), value: fmt(plannedTotal), tone: "text-foreground" },
          ].map((k) => (
            <div key={k.label} className="surface-card px-4 py-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{k.label}</p>
              <p className={`mt-1 font-display text-2xl font-semibold ${k.tone}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {over.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {ft("f.overBanner", { cats: over.map((r) => r.category.name).join(", ") })}
          </div>
        )}

        <Tabs defaultValue="budget">
          <TabsList>
            <TabsTrigger value="budget">{ft("f.tab.budget")}</TabsTrigger>
            <TabsTrigger value="tx">{ft("f.tab.tx")}</TabsTrigger>
            <TabsTrigger value="reports">{ft("f.tab.reports")}</TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{ft("f.budgetHint")}</p>
              <Button variant="outline" size="sm" onClick={copyPrev}>
                <Copy className="h-4 w-4" />
                {ft("f.copyPrev")}
              </Button>
            </div>
            <div className="surface-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">{ft("f.category")}</th>
                    <th className="px-4 py-3">{ft("f.planned")} ({currency})</th>
                    <th className="px-4 py-3">{ft("f.spent")}</th>
                    <th className="px-4 py-3">{ft("f.remaining")}</th>
                    <th className="px-4 py-3">{ft("f.progress")}</th>
                    <th className="px-4 py-3 text-right">{ft("f.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">{ft("f.loading")}</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">{ft("f.noCats")}</td></tr>
                  ) : (
                    rows.map((r) => {
                      const st = budgetState(r.planned, r.spent);
                      const pct = r.planned > 0 ? Math.min(100, Math.round((r.spent / r.planned) * 100)) : r.spent > 0 ? 100 : 0;
                      const bar = st === "over" ? "bg-destructive" : st === "near" ? "bg-warning" : "bg-success";
                      return (
                        <tr key={r.category.id} className={`border-b border-border last:border-0 ${st === "over" ? "bg-destructive/5" : ""}`}>
                          <td className="px-4 py-3 font-medium">{r.category.name}</td>
                          <td className="px-4 py-3">
                            {r.planned ? fmt(r.planned) : "—"}
                          </td>
                          <td className="px-4 py-3">{fmt(r.spent)}</td>
                          <td className={`px-4 py-3 ${r.planned - r.spent < 0 ? "font-semibold text-destructive" : ""}`}>{fmt(r.planned - r.spent)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-xs ${st === "over" ? "text-destructive" : st === "near" ? "text-warning" : "text-muted-foreground"}`}>
                                {st === "over" ? ft("f.over") : st === "near" ? ft("f.near") : `${pct}%`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button variant="outline" size="sm" onClick={() => setDetails(r.category.id)}>
                                {ft("f.details")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`${ft("f.addTx")} ${r.category.name}`}
                                onClick={() => {
                                  setEditing(null);
                                  setTxDefaultCat(r.category.id);
                                  setTxOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" aria-label={`${ft("f.editCat")} ${r.category.name}`} onClick={() => setEditCat({ id: r.category.id, name: r.category.name, amount: r.planned, kind: "EXPENSE" })}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" aria-label={`Delete ${r.category.name}`} onClick={() => setDelCat(r.category.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {incomeRows.length > 0 && (
              <div className="surface-card overflow-x-auto">
                <h3 className="px-4 pt-4 font-display text-lg font-semibold">{ft("f.incomeBySource")}</h3>
                <table className="w-full text-sm">
                    <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">{ft("f.category")}</th>
                      <th className="px-4 py-2 font-medium">{ft("f.income")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {incomeRows.map(({ c, total, expected }) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-success">{fmt(expected > 0 ? expected : total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" aria-label={`${ft("f.editCat")} ${c.name}`} onClick={() => setEditCat({ id: c.id, name: c.name, amount: expected > 0 ? expected : total, kind: "INCOME" })}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`} onClick={() => setDelCat(c.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tx">
            <TxTable
              txs={txs}
              catName={catName}
              fmt={fmt}
              onEdit={(x) => {
                setEditing(x);
                setTxOpen(true);
              }}
              onDelete={setDelTx}
              onReceipt={openReceipt}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-4 w-4" />
                {ft("f.exportCsv")}
              </Button>
              <Button variant="outline" size="sm" onClick={exportPdf}>
                <FileText className="h-4 w-4" />
                {ft("f.exportPdf")}
              </Button>
            </div>
            <div className="surface-card overflow-x-auto">
              <h3 className="px-4 pt-4 font-display text-lg font-semibold">{ft("f.summary")}</h3>
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">{ft("f.category")}</th>
                    <th className="px-4 py-3">{ft("f.planned")}</th>
                    <th className="px-4 py-3">{ft("f.spent")}</th>
                    <th className="px-4 py-3">{ft("f.difference")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isOver = budgetState(r.planned, r.spent) === "over";
                    return (
                      <tr key={r.category.id} className={`border-b border-border ${isOver ? "bg-destructive/10 text-destructive" : ""}`}>
                        <td className="px-4 py-2 font-medium">
                          {r.category.name}
                          {isOver && <span className="ml-2 text-xs font-semibold">({ft("f.over")})</span>}
                        </td>
                        <td className="px-4 py-2">{fmt(r.planned)}</td>
                        <td className="px-4 py-2">{fmt(r.spent)}</td>
                        <td className="px-4 py-2">{fmt(r.planned - r.spent)}</td>
                      </tr>
                    );
                  })}
                  {uncategorized > 0 && (
                    <tr className="border-b border-border text-muted-foreground">
                      <td className="px-4 py-2">{ft("f.unplanned")}</td>
                      <td className="px-4 py-2">{fmt(0)}</td>
                      <td className="px-4 py-2">{fmt(uncategorized)}</td>
                      <td className="px-4 py-2">{fmt(-uncategorized)}</td>
                    </tr>
                  )}
                  <tr className="font-semibold">
                    <td className="px-4 py-2">{ft("f.total")}</td>
                    <td className="px-4 py-2">{fmt(plannedTotal)}</td>
                    <td className="px-4 py-2">{fmt(expense)}</td>
                    <td className={`px-4 py-2 ${plannedTotal - expense < 0 ? "text-destructive" : ""}`}>{fmt(plannedTotal - expense)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <FinanceReports trend={trend.data ?? []} rows={rows} />
          </TabsContent>
        </Tabs>
      </div>

      <TransactionDialog
        open={txOpen}
        onOpenChange={setTxOpen}
        ym={ym}
        categories={categories}
        currency={currency}
        editing={editing}
        defaultCategoryId={txDefaultCat}
        onSaved={refresh}
      />
      <CategoryDialog open={catOpen !== null} kind={catOpen ?? "EXPENSE"} onOpenChange={(o) => !o && setCatOpen(null)} categories={categories} ym={ym} monthName={mName} onSaved={refresh} />
      <CategoryDialog open={editCat !== null} kind={editCat?.kind ?? "EXPENSE"} edit={editCat} onOpenChange={(o) => !o && setEditCat(null)} categories={categories} ym={ym} monthName={mName} onSaved={refresh} />

      <Dialog open={details !== null} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {ft("f.txIn", { cat: catName(details) })} — <span className="capitalize">{mName}</span>
            </DialogTitle>
          </DialogHeader>
          {detailRow && (
            <p className="text-sm text-muted-foreground">
              {ft("f.planned")}: {fmt(detailRow.planned)} · {ft("f.spent")}: {fmt(detailRow.spent)} · {ft("f.remaining")}: {fmt(detailRow.planned - detailRow.spent)}
            </p>
          )}
          <TxTable
            txs={detailTxs}
            catName={catName}
            fmt={fmt}
            onEdit={(x) => {
              setEditing(x);
              setTxOpen(true);
            }}
            onDelete={setDelTx}
            onReceipt={openReceipt}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={delTx !== null} onOpenChange={(o) => !o && setDelTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ft("f.deleteTx")}</AlertDialogTitle>
            <AlertDialogDescription>{t("pl.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTx}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={delCat !== null} onOpenChange={(o) => !o && setDelCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{catName(delCat)}</AlertDialogTitle>
            <AlertDialogDescription>{ft("f.deleteCat")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCat}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function TxTable({
  txs,
  catName,
  fmt,
  onEdit,
  onDelete,
  onReceipt,
}: {
  txs: Transaction[];
  catName: (id: string | null) => string;
  fmt: (n: number) => string;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  onReceipt: (path: string) => void;
}) {
  const { ft } = useFT();
  return (
    <div className="surface-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-xs text-muted-foreground uppercase">
          <tr>
            <th className="px-4 py-3">{ft("f.date")}</th>
            <th className="px-4 py-3">{ft("f.category")}</th>
            <th className="px-4 py-3">{ft("f.amount")}</th>
            <th className="px-4 py-3">{ft("f.note")}</th>
            <th className="px-4 py-3 text-right">{ft("f.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {txs.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">{ft("f.noTx")}</td></tr>
          ) : (
            txs.map((x) => (
              <tr key={x.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 whitespace-nowrap">{x.tx_date}</td>
                <td className="px-4 py-3">
                  {catName(x.category_id)}
                  {x.recurrence === "MONTHLY" && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{ft("f.recurring")}</span>}
                </td>
                <td className={`px-4 py-3 font-medium whitespace-nowrap ${x.kind === "INCOME" ? "text-success" : "text-destructive"}`}>
                  {x.kind === "INCOME" ? "+" : "−"}
                  {fmt(Number(x.amount))}
                </td>
                <td className="max-w-56 truncate px-4 py-3 text-muted-foreground">{x.note}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {x.receipt_path && (
                      <Button variant="ghost" size="icon" aria-label={ft("f.viewReceipt")} onClick={() => onReceipt(x.receipt_path!)}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" aria-label={ft("f.editTx")} onClick={() => onEdit(x)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete transaction" onClick={() => onDelete(x)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
