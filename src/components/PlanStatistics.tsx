import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useMyUserId, useShares } from "@/components/PlanSharing";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang, formatMonthYear } from "@/lib/i18n";
import { monthlyPlanStatistics } from "@/lib/plan-statistics";
import type { Plan } from "@/lib/plan-types";

type StatsPlan = Pick<Plan, "id" | "plan_date" | "status">;

export function PlanStatistics({ year, onYearChange }: { year: number; onYearChange: (year: number) => void }) {
  const { t, lang } = useLang();
  const me = useMyUserId();
  const sharesQuery = useShares();
  const query = useQuery({
    queryKey: ["plans", "statistics", me, year],
    enabled: Boolean(me),
    queryFn: async () => {
      const plans: StatsPlan[] = [];
      // Fetch every page so a busy year is not truncated at the database row limit.
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase.from("plans")
          .select("id,plan_date,status")
          .gte("plan_date", `${String(year).padStart(4, "0")}-01-01`)
          .lte("plan_date", `${String(year).padStart(4, "0")}-12-31`)
          .order("id").range(offset, offset + 999);
        if (error) throw error;
        plans.push(...(data ?? []) as StatsPlan[]);
        if ((data?.length ?? 0) < 1000) break;
      }
      return plans;
    },
  });
  const months = useMemo(() => {
    const hidden = new Set((sharesQuery.data ?? []).filter((share) => share.invitee_id === me && share.status !== "ACCEPTED").map((share) => share.plan_id));
    return monthlyPlanStatistics((query.data ?? []).filter((plan) => !hidden.has(plan.id)), year).map((month) => ({
      ...month,
      planned: month.total,
      label: formatMonthYear(year, month.month, lang).replace(` ${year}`, ""),
    }));
  }, [query.data, sharesQuery.data, me, year, lang]);
  const loading = !me || query.isPending || sharesQuery.isPending;
  const error = query.isError || sharesQuery.isError;

  return (
    <section className="space-y-6" aria-label={t("view.statistics")}>
      <div className="flex items-center gap-3">
        <Label htmlFor="statistics-year">{t("planStats.year")}</Label>
        <Input id="statistics-year" type="number" min={1} max={9999} value={year} className="w-28" onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isInteger(next) && next > 0 && next <= 9999) onYearChange(next);
        }} />
      </div>
      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-destructive">
          <p>{t("planStats.error")}</p>
          <Button variant="outline" onClick={() => { void query.refetch(); void sharesQuery.refetch(); }}>{t("planStats.retry")}</Button>
        </div>
      ) : loading ? <p role="status" className="py-16 text-center text-muted-foreground">{t("pl.loading")}</p> : (
        <div className="space-y-8">
          {(["total", "completionRate"] as const).map((metric) => {
            const percentage = metric === "completionRate";
            const title = t(percentage ? "planStats.doneByMonth" : "planStats.byMonth");
            return (
              <section key={metric} aria-label={title} className="min-w-0 border-t border-border pt-5">
                <h2 className="mb-4 text-xl">{title}</h2>
                <div className="overflow-x-auto">
                  <ChartContainer className="h-80 min-w-[620px] w-full aspect-auto" config={{ [metric]: { label: title, color: percentage ? "var(--chart-2)" : "var(--chart-1)" } }}>
                    <BarChart accessibilityLayer data={months} margin={{ top: 28, right: 12, bottom: 42, left: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="label" interval={0} angle={-35} textAnchor="end" height={46} tickLine={false} axisLine={false} />
                      <YAxis width={48} allowDecimals={false} domain={percentage ? [0, 100] : [0, "auto"]} tickFormatter={(value) => percentage ? `${value}%` : String(value)} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value) => <span className="font-medium tabular-nums">{percentage ? `${value}%` : String(value)}</span>} labelFormatter={(_, payload) => payload[0]?.payload?.label} />} />
                      <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
                        <LabelList dataKey={metric} position="top" className="fill-foreground" fontSize={11} formatter={(value: number) => percentage ? `${value}%` : String(value)} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
                <table className="sr-only">
                  <caption>{title} — {year}</caption>
                  <tbody>{months.map((month) => <tr key={month.month}><th scope="row">{month.label}</th><td>{percentage ? `${month.completionRate}%` : month.total}</td></tr>)}</tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}