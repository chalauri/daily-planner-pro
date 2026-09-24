import type { PlanStats as Stats } from "@/lib/plan-types";
import { useLang } from "@/lib/i18n";

export function PlanStatsBar({ stats }: { stats: Stats }) {
  const { t } = useLang();
  const items = [
    { label: t("stats.plans"), value: stats.total, tone: "text-foreground" },
    { label: t("stats.open"), value: stats.open, tone: "text-warning" },
    { label: t("stats.done"), value: stats.done, tone: "text-success" },
    { label: t("stats.notDone"), value: stats.notDone, tone: "text-destructive" },
    { label: t("stats.completed"), value: `${stats.completionRate}%`, tone: "text-primary" },
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
