import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, LogOut, RotateCcw, Search, Trash2, X } from "lucide-react";
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
import { StatusPill } from "@/components/StatusPill";
import { PlanDialog } from "@/components/PlanDialog";
import { PlanStatsBar } from "@/components/PlanStats";
import { computeStats, todayISO, type Plan, type PlanStatus } from "@/lib/plan-types";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Your plans — Dayplan" },
      { name: "description", content: "Today's plans, filters and live statistics." },
      { property: "og:title", content: "Your plans — Dayplan" },
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
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [text, setText] = useState("");

  const filters = { from, to, status, text: text.trim() };

  const { data: plans = [], isLoading } = useQuery({
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

  async function removePlan(plan: Plan) {
    const { error } = await supabase.from("plans").delete().eq("id", plan.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plan deleted");
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
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-semibold">Dayplan</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl">Your plans</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {from === to ? `Showing ${from}` : `Showing ${from || "…"} → ${to || "…"}`}
            </p>
          </div>
          <PlanDialog defaultDate={from || todayISO()} onCreated={refresh} />
        </div>

        <section className="surface-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
                <SelectItem value="NOT_DONE">Not done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="text">Search</Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="text"
                className="pl-9"
                placeholder="Title or description"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={resetToToday}>
              <RotateCcw className="h-4 w-4" />
              Today
            </Button>
          </div>
        </section>

        <PlanStatsBar stats={stats} />

        <section className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[42%]">Plan</TableHead>
                <TableHead className="w-[110px]">Date</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Nothing here yet. Add your first plan.
                  </TableCell>
                </TableRow>
              )}
              {plans.map((plan) => (
                <TableRow key={plan.id} className={plan.status === "DONE" ? "opacity-70" : ""}>
                  <TableCell>
                    <p
                      className={
                        plan.status === "DONE"
                          ? "font-medium line-through decoration-muted-foreground"
                          : "font-medium"
                      }
                    >
                      {plan.title}
                    </p>
                    {plan.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{plan.plan_date}</TableCell>
                  <TableCell>
                    <StatusPill status={plan.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant={plan.status === "DONE" ? "default" : "outline"}
                        onClick={() => setPlanStatus(plan, "DONE")}
                        aria-label={`Mark ${plan.title} as done`}
                      >
                        <Check className="h-4 w-4" />
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant={plan.status === "NOT_DONE" ? "destructive" : "outline"}
                        onClick={() => setPlanStatus(plan, "NOT_DONE")}
                        aria-label={`Mark ${plan.title} as not done`}
                      >
                        <X className="h-4 w-4" />
                        Not done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePlan(plan)}
                        aria-label={`Delete ${plan.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </main>
  );
}
