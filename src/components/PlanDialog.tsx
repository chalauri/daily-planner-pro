import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/plan-types";
import { addDays, addMonths, addWeeks, format, parseISO } from "date-fns";
import { useLang } from "@/lib/i18n";

type Repeat = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
const MAX_OCCURRENCES = 366;

function buildDates(start: string, repeat: Repeat, until: string): string[] {
  if (repeat === "NONE" || !until) return [start];
  const s = parseISO(start);
  const end = parseISO(until);
  const out: string[] = [];
  for (let i = 0; out.length < MAX_OCCURRENCES; i++) {
    const d = repeat === "DAILY" ? addDays(s, i) : repeat === "WEEKLY" ? addWeeks(s, i) : addMonths(s, i);
    if (d > end) break;
    out.push(format(d, "yyyy-MM-dd"));
  }
  return out;
}

export function PlanDialog({ defaultDate, onCreated }: { defaultDate: string; onCreated: () => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || todayISO());
  const [repeat, setRepeat] = useState<Repeat>("NONE");
  const [until, setUntil] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setSaving(false);
      toast.error(t("d.errSession"));
      return;
    }
    const dates = buildDates(date, repeat, until);
    if (repeat !== "NONE" && dates.length < 2) {
      setSaving(false);
      toast.error(t("d.errUntil"));
      return;
    }
    const seriesId = repeat === "NONE" ? null : crypto.randomUUID();
    const { error } = await supabase.from("plans").insert(
      dates.map((d) => ({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        plan_date: d,
        status: "OPEN" as const,
        recurrence: repeat,
        series_id: seriesId,
      })),
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(dates.length > 1 ? t("d.addedN", { n: dates.length }) : t("d.addedOne"));
    setRepeat("NONE");
    setTitle("");
    setDescription("");
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDate(defaultDate || todayISO());
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          {t("pl.add")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t("d.newTitle")}</DialogTitle>
            <DialogDescription>{t("d.newDesc")}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-title">{t("d.title")}</Label>
              <Input
                id="plan-title"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("d.titlePh")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description">{t("d.desc")}</Label>
              <Textarea
                id="plan-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-date">{t("d.date")}</Label>
              <Input
                id="plan-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="plan-repeat">{t("d.repeat")}</Label>
                <select
                  id="plan-repeat"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as Repeat)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="NONE">{t("d.repeat.none")}</option>
                  <option value="DAILY">{t("d.repeat.daily")}</option>
                  <option value="WEEKLY">{t("d.repeat.weekly")}</option>
                  <option value="MONTHLY">{t("d.repeat.monthly")}</option>
                </select>
              </div>
              {repeat !== "NONE" && (
                <div className="space-y-2">
                  <Label htmlFor="plan-until">{t("d.until")}</Label>
                  <Input
                    id="plan-until"
                    type="date"
                    required
                    min={date}
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </div>
              )}
            </div>
            {repeat !== "NONE" && (
              <p className="text-xs text-muted-foreground">
                {t("d.creates", { n: buildDates(date, repeat, until).length })}
              </p>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? t("d.saving") : t("d.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
