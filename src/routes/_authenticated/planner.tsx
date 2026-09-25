import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Check, LogOut, Rows3, RotateCcw, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/StatusPill";
import { PlanDialog } from "@/components/PlanDialog";
import { PlanCalendar } from "@/components/PlanCalendar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { PlanStatsBar } from "@/components/PlanStats";
import { computeStats, todayISO, type Plan, type PlanStatus } from "@/lib/plan-types";
import { LanguageToggle, useLang, weekdayIndex } from "@/lib/i18n";
import { CollabRequests, EditPlanButton, EditPlanDialog, ShareButton, useMyUserId, useShares } from "@/components/PlanSharing";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppTabs } from "@/components/AppTabs";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Your plans — Personal planner" },
      { name: "description", content: "Today's plans, filters and live statistics." },
      { property: "og:title", content: "Your plans — Personal planner" },
      { property: "og:description", content: "Today's plans, filters and live statistics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlannerPage,
});

type StatusFilter = PlanStatus | "ALL";

function PlannerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [text, setText] = useState("");
  const [addDate, setAddDate] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  function showMonth(m: Date) {
    setMonth(m);
    setFrom(format(startOfMonth(m), "yyyy-MM-dd"));
    setTo(format(endOfMonth(m), "yyyy-MM-dd"));
  }
  function switchView(v: "table" | "calendar") {
    setView(v);
    if (v === "calendar") showMonth(from ? startOfMonth(new Date(from + "T00:00:00")) : month);
  }
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<{ plan: Plan; next: PlanStatus } | null>(null);
  const [calPlan, setCalPlan] = useState<Plan | null>(null);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const filters = { from, to, status, text: text.trim() };

  const me = useMyUserId();
  const { data: shares = [] } = useShares();
  const { data: rawPlans = [], isLoading } = useQuery({
    queryKey: ["plans", filters],
    queryFn: async () => {
      let query = supabase
        .from("plans")
        .select("*")
        .order("plan_date", { ascending: true })
        .order("created_at", { ascending: true });

      if (from) query = query.gte("plan_date", from);
      if (to) query = query.lte("plan_date", to);
      if (status !== "ALL") query = query.eq("status", status);
      if (filters.text) {
        const term = filters.text.replace(/[%,]/g, " ");
        query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });

  const plans = useMemo(() => {
    const hidden = new Set(
      shares.filter((sh) => sh.invitee_id === me && sh.status !== "ACCEPTED").map((sh) => sh.plan_id),
    );
    return rawPlans.filter((p) => !hidden.has(p.id));
  }, [rawPlans, shares, me]);
  const sharedIds = useMemo(
    () => new Set(shares.filter((sh) => sh.status === "ACCEPTED").map((sh) => sh.plan_id)),
    [shares],
  );
  const stats = useMemo(() => computeStats(plans), [plans]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["plans"] });

  async function setPlanStatus(plan: Plan, next: PlanStatus) {
    const value = plan.status === next ? "OPEN" : next;
    const { error } = await supabase.from("plans").update({ status: value }).eq("id", plan.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  }

  function requestStatus(plan: Plan, next: PlanStatus) {
    if (plan.plan_date > todayISO()) {
      setConfirmStatus({ plan, next });
      return;
    }
    void setPlanStatus(plan, next);
  }

  async function confirmStatusChange() {
    if (!confirmStatus) return;
    await setPlanStatus(confirmStatus.plan, confirmStatus.next);
    setConfirmStatus(null);
  }

  async function removePlan(plan: Plan) {
    const { error } = await supabase.from("plans").delete().eq("id", plan.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("pl.deleted"));
    refresh();
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function resetToToday() {
    setFrom(todayISO());
    setTo(todayISO());
    setStatus("ALL");
    setText("");
  }

  return (
    <TooltipProvider>
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-xl font-semibold">{t("app.name")}</span>
            <AppTabs />
          </div>
          <div className="flex items-center gap-2">
            <CollabRequests onChanged={refresh} />
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
          <div>
            <h1 className="text-3xl">{t("pl.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {from === to
                ? t("pl.showingOne", { date: from })
                : t("pl.showingRange", { from: from || "…", to: to || "…" })}
            </p>
          </div>
          <PlanDialog
            defaultDate={from || todayISO()}
            onCreated={refresh}
            forcedDate={addDate}
            onForcedClose={() => setAddDate(null)}
          />
        </div>

        <section className="surface-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="from">{t("pl.from")}</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">{t("pl.to")}</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">{t("pl.status")}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("pl.allStatuses")}</SelectItem>
                <SelectItem value="OPEN">{t("status.OPEN")}</SelectItem>
                <SelectItem value="DONE">{t("status.DONE")}</SelectItem>
                <SelectItem value="NOT_DONE">{t("status.NOT_DONE")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="text">{t("pl.search")}</Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="text"
                className="pl-9"
                placeholder={t("pl.searchPh")}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={resetToToday}>
              <RotateCcw className="h-4 w-4" />
              {t("pl.today")}
            </Button>
          </div>
        </section>

        <PlanStatsBar stats={stats} />

        <div className="inline-flex rounded-md border border-border bg-card p-1" role="tablist">
          <Button size="sm" role="tab" aria-selected={view === "table"} variant={view === "table" ? "default" : "ghost"} onClick={() => switchView("table")}>
            <Rows3 className="h-4 w-4" />
            {t("view.table")}
          </Button>
          <Button size="sm" role="tab" aria-selected={view === "calendar"} variant={view === "calendar" ? "default" : "ghost"} onClick={() => switchView("calendar")}>
            <CalendarDays className="h-4 w-4" />
            {t("view.calendar")}
          </Button>
        </div>

        {view === "calendar" ? (
          <section className="surface-card overflow-hidden">
            <PlanCalendar
              month={month}
              onMonthChange={showMonth}
              plans={plans}
              onDayClick={(d) => setAddDate(d)}
              onPlanClick={(p) => setCalPlan(p)}
            />
          </section>
        ) : (
        <section className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">{t("pl.col.plan")}</TableHead>
                <TableHead className="w-[100px]">{t("pl.col.date")}</TableHead>
                <TableHead className="w-[110px]">{t("pl.col.day")}</TableHead>
                <TableHead className="w-[120px]">{t("pl.col.status")}</TableHead>
                <TableHead className="text-right">{t("pl.col.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {t("pl.loading")}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {t("pl.empty")}
                  </TableCell>
                </TableRow>
              )}
              {plans.map((plan) => (
                <TableRow
                  key={plan.id}
                  className={
                    plan.status === "NOT_DONE"
                      ? "bg-danger-soft/60 hover:bg-danger-soft"
                      : plan.status === "DONE"
                        ? "bg-success-soft/40 hover:bg-success-soft/70"
                        : ""
                  }
                >
                  <TableCell>
                    <p
                      className={cn(
                        "font-medium",
                        plan.status === "DONE" && "text-success",
                        plan.status === "NOT_DONE" && "text-destructive",
                      )}
                    >
                      {plan.status === "OPEN" ? (
                        <button
                          type="button"
                          className="text-left underline-offset-4 hover:underline"
                          onClick={() => setEditPlan(plan)}
                          aria-label={`${t("sh.edit")} ${plan.title}`}
                        >
                          {plan.title}
                        </button>
                      ) : (
                        plan.title
                      )}
                      {sharedIds.has(plan.id) && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 align-middle text-xs font-normal text-secondary-foreground">
                          {t("sh.shared")}
                        </span>
                      )}
                    </p>
                    {plan.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{plan.plan_date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t(`day.${weekdayIndex(plan.plan_date)}` as Parameters<typeof t>[0])}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={plan.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant={plan.status === "DONE" ? "default" : "outline"}
                        onClick={() => requestStatus(plan, "DONE")}
                        aria-label={t("pl.aria.done", { title: plan.title })}
                      >
                        <Check className="h-4 w-4" />
                        {t("status.DONE")}
                      </Button>
                      <Button
                        size="sm"
                        variant={plan.status === "NOT_DONE" ? "destructive" : "outline"}
                        onClick={() => requestStatus(plan, "NOT_DONE")}
                        aria-label={t("pl.aria.notDone", { title: plan.title })}
                      >
                        <X className="h-4 w-4" />
                        {t("status.NOT_DONE")}
                      </Button>
                      <EditPlanButton plan={plan} onSaved={refresh} />
                      {plan.user_id === me && (
                        <>
                          <ShareButton plan={plan} />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPlanToDelete(plan)}
                            aria-label={t("pl.aria.delete", { title: plan.title })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        )}
      </div>

      <Dialog open={!!calPlan} onOpenChange={(open) => !open && setCalPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{calPlan?.title ?? t("cal.planTitle")}</DialogTitle>
            <DialogDescription>{t("cal.planBody")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {(["OPEN", "DONE", "NOT_DONE"] as const).map((s) => (
              <Button
                key={s}
                variant={calPlan?.status === s ? "default" : "outline"}
                className="justify-start"
                onClick={() => {
                  if (calPlan) requestStatus(calPlan, s);
                  setCalPlan(null);
                }}
              >
                {t(`status.${s}`)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pl.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("pl.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (planToDelete) void removePlan(planToDelete);
                setPlanToDelete(null);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmStatus}
        onOpenChange={(open) => !open && setConfirmStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pl.futureTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("pl.futureBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmStatusChange()}>
              {t("confirm.yes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editPlan && (
        <EditPlanDialog
          plan={editPlan}
          open={!!editPlan}
          onOpenChange={(open) => !open && setEditPlan(null)}
          onSaved={refresh}
        />
      )}
    </main>
    </TooltipProvider>
  );
}
