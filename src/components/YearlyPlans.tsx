import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import type { PlanStatus } from "@/lib/plan-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface YearlyPlan {
  id: string;
  user_id: string;
  year: number;
  title: string;
  description: string | null;
  result_percent: number | null;
  status: PlanStatus;
}

interface YearlySubplan {
  id: string;
  plan_id: string;
  title: string;
  is_done: boolean;
  status: PlanStatus;
}

function planPercent(plan: YearlyPlan, subs: YearlySubplan[]): number | null {
  const own = subs.filter((s) => s.plan_id === plan.id);
  if (own.length > 0) {
    const done = own.filter((s) => s.status === "DONE").length;
    return Math.round((done / own.length) * 100);
  }
  return plan.result_percent;
}

export function YearlyPlans() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [addOpen, setAddOpen] = useState(false);
  const [addYear, setAddYear] = useState(() => new Date().getFullYear());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [subDraft, setSubDraft] = useState<Record<string, string>>({});
  const [editPercent, setEditPercent] = useState<YearlyPlan | null>(null);
  const [percentValue, setPercentValue] = useState("");
  const [toDelete, setToDelete] = useState<YearlyPlan | null>(null);
  const [editing, setEditing] = useState<
    { kind: "plan"; item: YearlyPlan } | { kind: "sub"; item: YearlySubplan } | null
  >(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["yearly_plans", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yearly_plans")
        .select("*")
        .eq("year", year)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as YearlyPlan[];
    },
  });

  const planIds = useMemo(() => plans.map((p) => p.id), [plans]);

  const { data: subplans = [] } = useQuery({
    queryKey: ["yearly_subplans", year],
    enabled: planIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("yearly_subplans")
        .select("*")
        .in("plan_id", planIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as YearlySubplan[];
    },
  });

  const successRate = useMemo(() => {
    const percents = plans
      .map((p) => planPercent(p, subplans))
      .filter((v): v is number => v !== null);
    if (percents.length === 0) return null;
    return Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);
  }, [plans, subplans]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["yearly_plans"] });
    queryClient.invalidateQueries({ queryKey: ["yearly_subplans"] });
  };

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addPlan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setSaving(false);
      toast.error(t("d.errSession"));
      return;
    }
    const newTitle = title.trim();
    const { data: existing } = await supabase
      .from("yearly_plans")
      .select("title")
      .eq("year", addYear);
    const dup = (existing ?? []).some(
      (p) => p.title.trim().toLowerCase() === newTitle.toLowerCase(),
    );
    if (dup) {
      setSaving(false);
      toast.error(t("yr.duplicate", { year: addYear }));
      return;
    }
    const { error } = await supabase.from("yearly_plans").insert({
      user_id: userId,
      year: addYear,
      title: newTitle,
      description: description.trim() || null,
      result_percent: 0,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("yr.added"));
    setTitle("");
    setDescription("");
    setAddOpen(false);
    setYear(addYear);
    refresh();
  }

  async function addSubplan(planId: string) {
    const value = (subDraft[planId] ?? "").trim();
    if (!value) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { error } = await supabase
      .from("yearly_subplans")
      .insert({ plan_id: planId, user_id: userId, title: value });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubDraft((prev) => ({ ...prev, [planId]: "" }));
    refresh();
  }

  async function setPlanStatus(plan: YearlyPlan, status: PlanStatus) {
    const next = plan.status === status ? "OPEN" : status;
    const hasSubs = subplans.some((s) => s.plan_id === plan.id);
    const update: { status: PlanStatus; result_percent?: number } = { status: next };
    if (!hasSubs && next !== "OPEN") update.result_percent = next === "DONE" ? 100 : 0;
    const { error } = await supabase.from("yearly_plans").update(update).eq("id", plan.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const newTitle = editTitle.trim();
    if (!newTitle) return;
    if (editing.kind === "plan") {
      const dup = plans.some(
        (p) =>
          p.id !== editing.item.id &&
          p.title.trim().toLowerCase() === newTitle.toLowerCase(),
      );
      if (dup) {
        toast.error(t("yr.duplicate", { year: editing.item.year }));
        return;
      }
      const { error } = await supabase
        .from("yearly_plans")
        .update({ title: newTitle, description: editDesc.trim() || null })
        .eq("id", editing.item.id);
      if (error) return void toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("yearly_subplans")
        .update({ title: newTitle })
        .eq("id", editing.item.id);
      if (error) return void toast.error(error.message);
    }
    toast.success(t("yr.updated"));
    setEditing(null);
    refresh();
  }

  async function setSubStatus(sub: YearlySubplan, status: PlanStatus) {
    const next = sub.status === status ? "OPEN" : status;
    const { error } = await supabase
      .from("yearly_subplans")
      .update({ status: next, is_done: next === "DONE" })
      .eq("id", sub.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  }

  async function removeSubplan(id: string) {
    const { error } = await supabase.from("yearly_subplans").delete().eq("id", id);
    if (error) toast.error(error.message);
    refresh();
  }

  async function savePercent() {
    if (!editPercent) return;
    const n = Number(percentValue);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      toast.error(t("yr.percentErr"));
      return;
    }
    const { error } = await supabase
      .from("yearly_plans")
      .update({ result_percent: Math.round(n) })
      .eq("id", editPercent.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditPercent(null);
    refresh();
  }

  async function removePlan(plan: YearlyPlan) {
    const { error } = await supabase.from("yearly_plans").delete().eq("id", plan.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("pl.deleted"));
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y - 1)}
            aria-label={t("yr.prevYear")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center font-display text-2xl font-semibold">
            {year}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y + 1)}
            aria-label={t("yr.nextYear")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => {
            setAddYear(year);
            setAddOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t("yr.add")}
        </Button>
      </div>

      <section className="surface-card flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("yr.success")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("yr.successHint")}</p>
        </div>
        <p className="font-display text-3xl font-semibold">
          {successRate === null ? "—" : `${successRate}%`}
        </p>
      </section>

      <section className="surface-card divide-y divide-border overflow-hidden">
        {isLoading && (
          <p className="py-10 text-center text-muted-foreground">{t("pl.loading")}</p>
        )}
        {!isLoading && plans.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">
            {t("yr.empty", { year })}
          </p>
        )}
        {plans.map((plan) => {
          const subs = subplans.filter((s) => s.plan_id === plan.id);
          const percent = planPercent(plan, subs);
          const isOpen = expanded.has(plan.id);
          const doneCount = subs.filter((s) => s.status === "DONE").length;
          return (
            <div key={plan.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => toggleExpanded(plan.id)}
                  aria-expanded={isOpen}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      !isOpen && "-rotate-90",
                    )}
                  />
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate font-medium",
                        plan.status === "DONE" && "text-success",
                        plan.status === "NOT_DONE" && "text-destructive",
                      )}
                    >
                      {plan.title}
                    </span>
                    {plan.description && (
                      <span className="block truncate text-sm text-muted-foreground">
                        {plan.description}
                      </span>
                    )}
                  </span>
                </button>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {subs.length > 0
                    ? t("yr.doneOf", { done: doneCount, total: subs.length })
                    : percent === null
                      ? t("yr.notCounted")
                      : null}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold",
                    percent === null
                      ? "bg-muted text-muted-foreground"
                      : percent >= 80
                        ? "bg-success-soft text-success"
                        : percent >= 40
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-danger-soft text-destructive",
                  )}
                >
                  {percent === null ? "—" : `${percent}%`}
                </span>
                <StatusButtons
                  status={plan.status}
                  onSet={(st) => void setPlanStatus(plan, st)}
                  t={t}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing({ kind: "plan", item: plan });
                    setEditTitle(plan.title);
                    setEditDesc(plan.description ?? "");
                  }}
                  aria-label={t("yr.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {subs.length === 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditPercent(plan);
                      setPercentValue(plan.result_percent?.toString() ?? "");
                    }}
                    aria-label={t("yr.result")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setToDelete(plan)}
                  aria-label={t("pl.aria.delete", { title: plan.title })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {isOpen && (
                <div className="space-y-2 bg-muted/40 px-4 py-3 pl-11">
                  {subs.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          sub.status === "DONE" && "font-medium text-success",
                          sub.status === "NOT_DONE" && "font-medium text-destructive",
                        )}
                      >
                        {sub.title}
                      </span>
                      <StatusButtons
                        status={sub.status}
                        onSet={(st) => void setSubStatus(sub, st)}
                        t={t}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing({ kind: "sub", item: sub });
                          setEditTitle(sub.title);
                        }}
                        aria-label={t("yr.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void removeSubplan(sub.id)}
                        aria-label={t("delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      value={subDraft[plan.id] ?? ""}
                      onChange={(e) =>
                        setSubDraft((prev) => ({ ...prev, [plan.id]: e.target.value }))
                      }
                      placeholder={t("yr.addSubPh")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void addSubplan(plan.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void addSubplan(plan.id)}
                      disabled={!(subDraft[plan.id] ?? "").trim()}
                    >
                      <Plus className="h-4 w-4" />
                      {t("yr.addSub")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={addPlan}>
            <DialogHeader>
              <DialogTitle>{t("yr.addTitle", { year: addYear })}</DialogTitle>
              <DialogDescription>{t("yr.addDesc")}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="yr-year">{t("yr.year")}</Label>
                <Input
                  id="yr-year"
                  type="number"
                  required
                  min={2000}
                  max={2100}
                  value={addYear}
                  onChange={(e) =>
                    setAddYear(Number(e.target.value) || new Date().getFullYear())
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yr-title">{t("d.title")}</Label>
                <Input
                  id="yr-title"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("yr.titlePh")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yr-desc">{t("d.desc")}</Label>
                <Textarea
                  id="yr-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={saving || !title.trim()}>
                {saving ? t("d.saving") : t("d.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPercent} onOpenChange={(o) => !o && setEditPercent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("yr.result")}</DialogTitle>
            <DialogDescription>{t("yr.resultSet")}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={percentValue}
              onChange={(e) => setPercentValue(e.target.value)}
              className="w-28"
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <DialogFooter className="mt-6">
            <Button onClick={() => void savePercent()}>{t("yr.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form onSubmit={saveEdit}>
            <DialogHeader>
              <DialogTitle>
                {editing?.kind === "sub" ? t("yr.editSub") : t("yr.editTitle")}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="yr-edit-title">{t("d.title")}</Label>
                <Input
                  id="yr-edit-title"
                  required
                  maxLength={200}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              {editing?.kind === "plan" && (
                <div className="space-y-2">
                  <Label htmlFor="yr-edit-desc">{t("d.desc")}</Label>
                  <Textarea
                    id="yr-edit-desc"
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={!editTitle.trim()}>
                {t("yr.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("yr.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("yr.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) void removePlan(toDelete);
                setToDelete(null);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusButtons({
  status,
  onSet,
  t,
}: {
  status: PlanStatus;
  onSet: (s: PlanStatus) => void;
  t: (k: string) => string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        size="sm"
        variant={status === "DONE" ? "default" : "outline"}
        className={cn(status === "DONE" && "bg-success text-success-foreground hover:bg-success/90")}
        onClick={() => onSet("DONE")}
        aria-pressed={status === "DONE"}
        title={t("status.DONE")}
      >
        <Check className="h-4 w-4" />
        <span className="hidden sm:inline">{t("status.DONE")}</span>
      </Button>
      <Button
        size="sm"
        variant={status === "NOT_DONE" ? "destructive" : "outline"}
        onClick={() => onSet("NOT_DONE")}
        aria-pressed={status === "NOT_DONE"}
        title={t("status.NOT_DONE")}
      >
        <X className="h-4 w-4" />
        <span className="hidden sm:inline">{t("status.NOT_DONE")}</span>
      </Button>
    </div>
  );
}
