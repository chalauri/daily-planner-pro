export type PlanStatusFilter = "OPEN" | "DONE" | "NOT_DONE" | "ALL";

export type PlanFilterRequest = {
  from?: string;
  to?: string;
  status?: PlanStatusFilter;
  text?: string;
};

let pending: PlanFilterRequest | null = null;
const listeners = new Set<(request: PlanFilterRequest) => void>();

/** Ask the Plans page to show this filter. Works whether or not it is mounted yet. */
export function requestPlanFilter(request: PlanFilterRequest) {
  pending = request;
  for (const listener of [...listeners]) listener(request);
}

/** Returns the filter the Plans page has not applied yet, and clears it. */
export function consumePendingPlanFilter(): PlanFilterRequest | null {
  const value = pending;
  pending = null;
  return value;
}

/** Listen for filter requests while the Plans page is mounted. Returns a stop function. */
export function subscribePlanFilter(listener: (request: PlanFilterRequest) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function previousDayISO(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Filter that shows exactly the open plans left over from earlier days. */
export function buildOverdueFilter(dates: string[], today: string): PlanFilterRequest {
  const past = dates.filter((date) => date < today).sort();
  return {
    from: past[0] ?? previousDayISO(today),
    to: previousDayISO(today),
    status: "OPEN",
    text: "",
  };
}
