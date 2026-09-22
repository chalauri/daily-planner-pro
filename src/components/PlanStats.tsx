import type { PlanStats as Stats } from "@/lib/plan-types";

export function PlanStatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: "Plans", value: stats.total, tone: "text-foreground" },
    { label: "Open", value: stats.open, tone: "text-warning" },
    { label: "Done", value: stats.done, tone: "text-success" },
    { label: "Not done", value: stats.notDone, tone: "text-destructive" },
    { label: "Completed", value: `${stats.completionRate}%`, tone: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="surface-card px-4 py-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </p>
          <p className={`mt-1 font-display text-2xl font-semibold ${item.tone}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
