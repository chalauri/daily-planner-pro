CREATE TYPE public.saving_type AS ENUM ('CASH','STOCKS','RETIREMENT');
CREATE TABLE public.savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  kind public.saving_type NOT NULL DEFAULT 'CASH',
  currency text NOT NULL,
  amount numeric NOT NULL,
  company text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings TO authenticated;
GRANT ALL ON public.savings TO service_role;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own savings" ON public.savings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER savings_updated_at BEFORE UPDATE ON public.savings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();