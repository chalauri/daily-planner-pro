import type { PlanStats as Stats } from "@/lib/plan-types";
import { useLang } from "@/lib/i18n";

export function PlanStatsBar({ stats }: { stats: Stats }) {
  const { t } = useLang();
  const items = [
    { label: t("stats.plans"), value: stats.total, tone: "text-foreground", card: "border-l-foreground/40 bg-card" },
    { label: t("stats.open"), value: stats.open, tone: "text-warning", card: "border-l-warning bg-warning-soft/45" },
    { label: t("stats.done"), value: stats.done, tone: "text-success", card: "border-l-success bg-success-soft/45" },
    { label: t("stats.notDone"), value: stats.notDone, tone: "text-destructive", card: "border-l-destructive bg-danger-soft/55" },
    { label: t("stats.completed"), value: `${stats.completionRate}%`, tone: "text-primary", card: "border-l-primary bg-secondary/65" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl border border-border border-l-4 px-4 py-4 shadow-sm ${item.card}`}>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {item.label}
          </p>
          <p className={`mt-1 font-display text-3xl font-semibold tabular-nums ${item.tone}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
