CREATE TABLE public.yearly_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  title text NOT NULL,
  description text,
  result_percent integer CHECK (result_percent BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, title)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.yearly_plans TO authenticated;
GRANT ALL ON public.yearly_plans TO service_role;
ALTER TABLE public.yearly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own yearly plans" ON public.yearly_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER yearly_plans_updated_at BEFORE UPDATE ON public.yearly_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE public.yearly_subplans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.yearly_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.yearly_subplans TO authenticated;
GRANT ALL ON public.yearly_subplans TO service_role;
ALTER TABLE public.yearly_subplans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own yearly subplans" ON public.yearly_subplans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER yearly_subplans_updated_at BEFORE UPDATE ON public.yearly_subplans FOR EACH ROW EXECUTE FUNCTION set_updated_at();