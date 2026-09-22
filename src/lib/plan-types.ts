export type PlanStatus = "OPEN" | "DONE" | "NOT_DONE";

export interface Plan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  plan_date: string;
  status: PlanStatus;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABEL: Record<PlanStatus, string> = {
  OPEN: "Open",
  DONE: "Done",
  NOT_DONE: "Not done",
};

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export interface PlanStats {
  total: number;
  open: number;
  done: number;
  notDone: number;
  completionRate: number;
}

export function computeStats(plans: Plan[]): PlanStats {
  const total = plans.length;
  const open = plans.filter((p) => p.status === "OPEN").length;
  const done = plans.filter((p) => p.status === "DONE").length;
  const notDone = plans.filter((p) => p.status === "NOT_DONE").length;
  return {
    total,
    open,
    done,
    notDone,
    completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
