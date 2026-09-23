CREATE TYPE public.plan_recurrence AS ENUM ('NONE','DAILY','WEEKLY','MONTHLY');
ALTER TABLE public.plans ADD COLUMN series_id uuid, ADD COLUMN recurrence public.plan_recurrence NOT NULL DEFAULT 'NONE';
CREATE INDEX plans_series_idx ON public.plans(series_id);