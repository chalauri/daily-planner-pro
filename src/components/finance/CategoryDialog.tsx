import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFT } from "@/lib/finance-i18n";
import { useLang } from "@/lib/i18n";
import { currentUserId, monthLabel, shiftYM, type TxKind, type YM } from "@/lib/finance";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: TxKind;
  categories: { id: string; name: string; kind: TxKind }[];
  ym: YM;
  monthName: string;
  onSaved: () => void;
  /** When set, the dialog edits this category's name and its planned amount for `ym`. */
  edit?: { id: string; name: string; amount: number } | null;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function CategoryDialog({ open, onOpenChange, kind, categories, ym, onSaved, edit }: Props) {
  const { ft } = useFT();
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [planned, setPlanned] = useState("");
  const [planYm, setPlanYm] = useState<YM>(() => shiftYM({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, 1));
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  useEffect(() => {
    if (open && edit) {
      setName(edit.name);
      setPlanned(edit.amount ? String(edit.amount) : "");
      setPlanYm(ym);
    } else if (open) {
      setName("");
      setPlanned("");
      // Default to planning the next month (e.g. in September plan October)
      setPlanYm(shiftYM({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, 1));
    }
  }, [open, edit, ym]);

  async function saveEdit() {
    if (!edit || !name.trim()) return;
    setSaving(true);
    try {
      const user_id = await currentUserId();
      const clash = categories.find((c) => c.id !== edit.id && c.kind === kind && c.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (clash) throw new Error(ft("f.alreadyPlanned", { n: name.trim(), m: monthLabel(planYm, lang) }));
      if (name.trim() !== edit.name) {
        const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", edit.id);
        if (error) throw error;
      }
      const amount = Number(planned || 0);
      const { error: be } = await supabase
        .from("budgets")
        .upsert({ user_id, category_id: edit.id, year: planYm.year, month: planYm.month, amount }, { onConflict: "category_id,year,month" });
      if (be) throw be;
      toast.success(ft("f.saved"));
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  }

  async function save() {
    if (edit) { setConfirmOpen(true); return; }
    if (!name.trim()) return;
    setSaving(true);
    try {
      const user_id = await currentUserId();
      const existing = categories.find((c) => c.kind === kind && c.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        const { data: dup, error: de } = await supabase
          .from("budgets").select("id").eq("category_id", existing.id).eq("year", planYm.year).eq("month", planYm.month).limit(1);
        if (de) throw de;
        const { count } = await supabase
          .from("transactions").select("id", { count: "exact", head: true })
          .eq("category_id", existing.id).gte("tx_date", `${planYm.year}-${String(planYm.month).padStart(2, "0")}-01`)
          .lt("tx_date", planYm.month === 12 ? `${planYm.year + 1}-01-01` : `${planYm.year}-${String(planYm.month + 1).padStart(2, "0")}-01`);
        if ((dup && dup.length > 0) || (kind === "INCOME" && (count ?? 0) > 0)) {
          toast.error(ft("f.alreadyPlanned", { n: existing.name, m: monthLabel(planYm, lang) }));
          return;
        }
      }
      let categoryId = existing?.id;
      if (!categoryId) {
        const { data, error } = await supabase
          .from("categories")
          .insert({ user_id, name: name.trim(), kind })
          .select()
          .single();
        if (error) throw error;
        categoryId = data.id;
      }
      const amount = Number(planned);
      if (amount > 0) {
        const { error: be } = await supabase
          .from("budgets")
          .insert({ user_id, category_id: categoryId, year: planYm.year, month: planYm.month, amount });
        if (be) throw be;
      }
      toast.success(ft("f.saved"));
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit ? ft("f.editCat") : kind === "INCOME" ? ft("f.addIncome") : ft("f.addExpense")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">{ft("f.catName")}</Label>
            <Input id="cat-name" list="cat-options" autoComplete="off" placeholder={ft("f.catHint")} value={name} onChange={(e) => setName(e.target.value)} />
            <datalist id="cat-options">
              {categories.filter((c) => c.kind === kind).map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          {!edit && (
            <>
              <div className="space-y-1.5">
                <Label>{ft("f.planMonth")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={String(planYm.month)} onValueChange={(v) => setPlanYm((p) => ({ ...p, month: Number(v) }))}>
                    <SelectTrigger aria-label="Month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {monthLabel({ year: planYm.year, month: m }, lang).replace(/\s*\d{4}\s*$/, "")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(planYm.year)} onValueChange={(v) => setPlanYm((p) => ({ ...p, year: Number(v) }))}>
                    <SelectTrigger aria-label="Year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          {(
            <>
              <div className="space-y-1.5">
                <Label htmlFor="cat-planned">{ft("f.plannedFor", { m: monthLabel(planYm, lang) })}</Label>
                <Input id="cat-planned" type="number" min="0" step="0.01" value={planned} onChange={(e) => setPlanned(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving || !name.trim()}>
            {ft("f.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{ft("f.confirmEditTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{ft("f.confirmEditBody", { n: edit?.name ?? "", m: monthLabel(planYm, lang) })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ft("f.cancel2")}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void saveEdit(); }} disabled={saving}>{ft("f.confirmYes")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
