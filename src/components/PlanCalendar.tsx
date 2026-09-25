import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { todayISO, type Plan, type PlanStatus } from "@/lib/plan-types";

const chip: Record<PlanStatus, string> = {
  OPEN: "bg-warning-soft text-warning-foreground",
  DONE: "bg-success-soft text-success line-through",
  NOT_DONE: "bg-danger-soft text-destructive",
};

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export function PlanCalendar({
  month,
  onMonthChange,
  plans,
  onDayClick,
}: {
  month: Date;
  onMonthChange: (m: Date) => void;
  plans: Plan[];
  onDayClick: (date: string) => void;
}) {
  const { t, lang } = useLang();
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  const byDate = new Map<string, Plan[]>();
  for (const p of plans) byDate.set(p.plan_date, [...(byDate.get(p.plan_date) ?? []), p]);

  const today = todayISO();
  const monthLabel = new Intl.DateTimeFormat(lang === "ka" ? "ka-GE" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(month);
  const weekdays = [1, 2, 3, 4, 5, 6, 0] as const;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => onMonthChange(addMonths(month, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-display text-xl capitalize">{monthLabel}</h2>
        <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border">
        {weekdays.map((w) => (
          <div key={w} className="truncate bg-muted px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground">
            {t(`day.${w}`).slice(0, 3)}
          </div>
        ))}
        {days.map((d) => {
          const key = iso(d);
          const items = byDate.get(key) ?? [];
          const inMonth = d.getMonth() === month.getMonth();
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(key)}
              className={cn(
                "flex min-h-24 min-w-0 flex-col gap-1 bg-card p-1.5 text-left transition-colors hover:bg-accent/40",
                !inMonth && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-xs font-semibold",
                  key === today && "bg-primary text-primary-foreground",
                )}
              >
                {d.getDate()}
              </span>
              {items.slice(0, 3).map((p) => (
                <span key={p.id} className={cn("truncate rounded px-1.5 py-0.5 text-[11px] font-medium", chip[p.status])} title={p.title}>
                  {p.title}
                </span>
              ))}
              {items.length > 3 && (
                <span className="text-[11px] text-muted-foreground">{t("cal.more", { n: items.length - 3 })}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t("cal.hint")}</p>
    </div>
  );
}
