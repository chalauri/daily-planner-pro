ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS note text;
COMMENT ON COLUMN public.budgets.note IS 'Optional comment the owner adds when planning this expense/income for the month.';