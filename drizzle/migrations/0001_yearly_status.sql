ALTER TABLE public.yearly_plans ADD COLUMN status public.plan_status NOT NULL DEFAULT 'OPEN';
ALTER TABLE public.yearly_subplans ADD COLUMN status public.plan_status NOT NULL DEFAULT 'OPEN';
UPDATE public.yearly_subplans SET status = 'DONE' WHERE is_done = true;