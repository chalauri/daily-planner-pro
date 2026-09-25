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
  ym: YM;
  monthName: string;
  onSaved: () => void;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function CategoryDialog({ open, onOpenChange, onSaved }: Props) {
  const { ft } = useFT();
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TxKind>("EXPENSE");
  const [planned, setPlanned] = useState("");
  const [planYm, setPlanYm] = useState<YM>(() => shiftYM({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, 1));
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  useEffect(() => {
    if (open) {
      setName("");
      setKind("EXPENSE");
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
      const { data, error } = await supabase
        .from("categories")
        .insert({ user_id, name: name.trim(), kind })
        .select()
        .single();
      if (error) throw error;
      const amount = Number(planned);
      if (kind === "EXPENSE" && amount > 0) {
        const { error: be } = await supabase
          .from("budgets")
          .insert({ user_id, category_id: data.id, year: planYm.year, month: planYm.month, amount });
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
          <DialogTitle>{ft("f.addCat")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["EXPENSE", "INCOME"] as const).map((k) => (
              <Button key={k} type="button" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>
                {k === "EXPENSE" ? ft("f.expenses") : ft("f.income")}
              </Button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">{ft("f.catName")}</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {kind === "EXPENSE" && (
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
