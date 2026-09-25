import { useEffect, useMemo, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFT } from "@/lib/finance-i18n";
import {
  budgetState,
  currentUserId,
  money,
  ymRange,
  type Category,
  type Transaction,
  type TxKind,
  type YM,
} from "@/lib/finance";

const MAX = 60;
const NONE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ym: YM;
  categories: Category[];
  currency: string;
  editing?: Transaction | null;
  defaultCategoryId?: string | null;
  onSaved: () => void;
}

function defaultDate(ym: YM) {
  const now = new Date();
  if (now.getFullYear() === ym.year && now.getMonth() + 1 === ym.month) return format(now, "yyyy-MM-dd");
  return ymRange(ym).from;
}

export function TransactionDialog({ open, onOpenChange, ym, categories, currency, editing, defaultCategoryId, onSaved }: Props) {
  const { ft, lang } = useFT();
  const [categoryId, setCategoryId] = useState<string>(NONE);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate(ym));
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [until, setUntil] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCategoryId(editing.category_id ?? NONE);
      setAmount(String(editing.amount));
      setDate(editing.tx_date);
      setNote(editing.note ?? "");
    } else {
      const cat = categories.find((c) => c.id === defaultCategoryId);
      setCategoryId(cat?.id ?? NONE);
      setAmount("");
      const d = defaultDate(ym);
      setDate(d);
      setNote("");
      setUntil(format(addMonths(parseISO(d), 11), "yyyy-MM-dd"));
    }
    setFile(null);
    setRepeat(false);
  }, [open, editing, ym, defaultCategoryId, categories]);

  const kind: TxKind = "EXPENSE";
  const cats = categories.filter((c) => c.kind === "EXPENSE");

  const dates = useMemo(() => {
    if (!repeat || !date || !until) return [date];
    const out: string[] = [];
    const start = parseISO(date);
    for (let i = 0; i < MAX; i++) {
      const d = addMonths(start, i);
      const s = format(d, "yyyy-MM-dd");
      if (s > until) break;
      out.push(s);
    }
    return out.length ? out : [date];
  }, [repeat, date, until]);

  async function checkBudget(catId: string, txDate: string) {
    const cat = categories.find((c) => c.id === catId);
    if (!cat || cat.kind !== "EXPENSE") return;
    const d = parseISO(txDate);
    const m: YM = { year: d.getFullYear(), month: d.getMonth() + 1 };
    const { from, to } = ymRange(m);
    const [b, t] = await Promise.all([
      supabase.from("budgets").select("amount").eq("category_id", catId).eq("year", m.year).eq("month", m.month).maybeSingle(),
      supabase.from("transactions").select("amount").eq("category_id", catId).eq("kind", "EXPENSE").gte("tx_date", from).lt("tx_date", to),
    ]);
    const planned = Number(b.data?.amount ?? 0);
    if (planned <= 0) return;
    const spent = (t.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const st = budgetState(planned, spent);
    const params = { cat: cat.name, spent: money(spent, currency, lang), planned: money(planned, currency, lang) };
    if (st === "over") toast.error(ft("f.alertOver", params), { duration: 8000 });
    else if (st === "near") toast.warning(ft("f.alertNear", params), { duration: 8000 });
  }

  async function save() {
    const value = Number(amount);
    if (!value || value <= 0 || !date) return;
    setSaving(true);
    try {
      const userId = await currentUserId();
      let receipt_path: string | undefined;
      if (file) {
        const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("receipts").upload(path, file);
        if (error) toast.error(ft("f.uploadFail"));
        else receipt_path = path;
      }
      const category_id = categoryId === NONE ? null : categoryId;
      if (editing) {
        const { error } = await supabase
          .from("transactions")
          .update({ kind, category_id, amount: value, tx_date: date, note: note.trim() || null, ...(receipt_path ? { receipt_path } : {}) })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success(ft("f.saved"));
      } else {
        const series_id = dates.length > 1 ? crypto.randomUUID() : null;
        const rows = dates.map((d) => ({
          user_id: userId,
          kind,
          category_id,
          amount: value,
          tx_date: d,
          note: note.trim() || null,
          receipt_path: receipt_path ?? null,
          series_id,
          recurrence: dates.length > 1 ? "MONTHLY" : "NONE",
        }));
        const { error } = await supabase.from("transactions").insert(rows);
        if (error) throw error;
        toast.success(rows.length > 1 ? ft("f.addedN", { n: rows.length }) : ft("f.added"));
      }
      if (category_id && kind === "EXPENSE") await checkBudget(category_id, date);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? ft("f.editTx") : ft("f.addTx")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-amount">{ft("f.amount")} ({currency})</Label>
              <Input id="tx-amount" type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">{ft("f.date")}</Label>
              <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{ft("f.category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger aria-label={ft("f.category")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{ft("f.none")}</SelectItem>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-note">{ft("f.note")}</Label>
            <Textarea id="tx-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx-receipt">{ft("f.receipt")}</Label>
            <Input id="tx-receipt" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {!editing && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="tx-repeat">{ft("f.repeat")}</Label>
                <Switch id="tx-repeat" checked={repeat} onCheckedChange={setRepeat} />
              </div>
              {repeat && (
                <div className="space-y-1.5">
                  <Label htmlFor="tx-until">{ft("f.until")}</Label>
                  <Input id="tx-until" type="date" value={until} min={date} onChange={(e) => setUntil(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{ft("f.createsN", { n: dates.length })}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !amount || Number(amount) <= 0}>
            {ft("f.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
