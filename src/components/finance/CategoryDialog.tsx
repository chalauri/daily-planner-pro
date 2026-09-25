import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFT } from "@/lib/finance-i18n";
import { currentUserId, type TxKind, type YM } from "@/lib/finance";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ym: YM;
  monthName: string;
  onSaved: () => void;
}

export function CategoryDialog({ open, onOpenChange, ym, monthName, onSaved }: Props) {
  const { ft } = useFT();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TxKind>("EXPENSE");
  const [planned, setPlanned] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setKind("EXPENSE");
      setPlanned("");
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
          .insert({ user_id, category_id: data.id, year: ym.year, month: ym.month, amount });
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
            <div className="space-y-1.5">
              <Label htmlFor="cat-planned">{ft("f.plannedFor", { m: monthName })}</Label>
              <Input id="cat-planned" type="number" min="0" step="0.01" value={planned} onChange={(e) => setPlanned(e.target.value)} />
            </div>
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
