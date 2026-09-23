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
      toast.error("Your session expired. Please sign in again.");
      return;
    }
    const dates = buildDates(date, repeat, until);
    if (repeat !== "NONE" && dates.length < 2) {
      setSaving(false);
      toast.error("Pick an end date after the start date.");
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
    toast.success(dates.length > 1 ? `${dates.length} plans added` : "Plan added");
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
          Add plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New plan</DialogTitle>
            <DialogDescription>It starts as open until you mark it later.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-title">Title</Label>
              <Input
                id="plan-title"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Call the accountant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description">Description (optional)</Label>
              <Textarea
                id="plan-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-date">Date</Label>
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
                <Label htmlFor="plan-repeat">Repeat</Label>
                <select
                  id="plan-repeat"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as Repeat)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="NONE">Does not repeat</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              {repeat !== "NONE" && (
                <div className="space-y-2">
                  <Label htmlFor="plan-until">Until</Label>
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
                Creates {buildDates(date, repeat, until).length} plans (max {MAX_OCCURRENCES}).
              </p>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? "Saving…" : "Add plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
