import type { supabase } from "@/integrations/supabase/client";

/** Categories are shared across months; only remove the selected month's records. */
export async function deleteMonthCategory(
  client: Pick<typeof supabase, "from">,
  categoryId: string,
  ym: { year: number; month: number },
) {
  const from = `${ym.year}-${String(ym.month).padStart(2, "0")}-01`;
  const to = ym.month === 12
    ? `${ym.year + 1}-01-01`
    : `${ym.year}-${String(ym.month + 1).padStart(2, "0")}-01`;
  const { error: txError } = await client.from("transactions").delete()
    .eq("category_id", categoryId).gte("period", from).lt("period", to);
  if (txError) throw txError;
  const { error: budgetError } = await client.from("budgets").delete()
    .eq("category_id", categoryId).eq("year", ym.year).eq("month", ym.month);
  if (budgetError) throw budgetError;
}