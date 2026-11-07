import type { Plan } from "./plan-types";

export function monthlyPlanStatistics(plans: Pick<Plan, "plan_date" | "status">[], year: number) {
  const months = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, total: 0, done: 0, completionRate: 0 }));
  for (const plan of plans) {
    if (Number(plan.plan_date.slice(0, 4)) !== year) continue;
    const month = months[Number(plan.plan_date.slice(5, 7)) - 1];
    if (!month) continue;
    month.total += 1;
    if (plan.status === "DONE") month.done += 1;
  }
  return months.map((month) => ({ ...month, completionRate: month.total === 0 ? 0 : Math.round(month.done / month.total * 100) }));
}