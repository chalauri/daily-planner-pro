ALTER TABLE public.transactions ADD COLUMN period date;
UPDATE public.transactions SET period = date_trunc('month', tx_date)::date WHERE period IS NULL;
CREATE OR REPLACE FUNCTION public.transactions_set_period() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.period IS NULL THEN NEW.period := date_trunc('month', NEW.tx_date)::date;
  ELSE NEW.period := date_trunc('month', NEW.period)::date; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER transactions_set_period BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.transactions_set_period();
CREATE INDEX transactions_user_period_idx ON public.transactions(user_id, period);