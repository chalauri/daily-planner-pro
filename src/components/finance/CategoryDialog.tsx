import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function CategoryDialog({ open, onOpenChange, kind, categories, onSaved }: Props) {
  const { ft } = useFT();
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [planned, setPlanned] = useState("");
  const [planYm, setPlanYm] = useState<YM>(() => shiftYM({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, 1));
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  useEffect(() => {
    if (open) {
      setName("");
      setPlanned("");
      // Default to planning the next month (e.g. in September plan October)
      setPlanYm(shiftYM({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, 1));
    }
  }, [open]);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const user_id = await currentUserId();
      const existing = categories.find((c) => c.kind === kind && c.name.trim().toLowerCase() === name.trim().toLowerCase());
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
          .upsert(
            { user_id, category_id: categoryId, year: planYm.year, month: planYm.month, amount },
            { onConflict: "category_id,year,month" },
          );
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
          <DialogTitle>{kind === "INCOME" ? ft("f.addIncome") : ft("f.addExpense")}</DialogTitle>
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
          {(
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
    </Dialog>
  );
}
