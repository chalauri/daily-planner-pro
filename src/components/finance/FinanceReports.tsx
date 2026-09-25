import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFT } from "@/lib/finance-i18n";
import type { CategoryRow } from "@/lib/finance";

interface Props {
  trend: { key: string; income: number; expense: number }[];
  rows: CategoryRow[];
}

export function FinanceReports({ trend, rows }: Props) {
  const { ft } = useFT();
  const catData = rows.map((r) => ({ name: r.category.name, planned: r.planned, actual: r.spent }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="surface-card p-4">
        <h3 className="mb-3 font-display text-lg font-semibold">{ft("f.trend")}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="key" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" name={ft("f.income")} fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name={ft("f.expenses")} fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="surface-card p-4">
        <h3 className="mb-3 font-display text-lg font-semibold">{ft("f.byCategory")}</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" name={ft("f.planned")} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name={ft("f.spent")} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
