CREATE TYPE public.share_status AS ENUM ('PENDING','ACCEPTED','DECLINED');

CREATE TABLE public.plan_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  invitee_email text NOT NULL,
  owner_email text NOT NULL,
  status public.share_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, invitee_id)
);
GRANT SELECT, UPDATE, DELETE ON public.plan_shares TO authenticated;
GRANT ALL ON public.plan_shares TO service_role;
ALTER TABLE public.plan_shares ENABLE ROW LEVEL SECURITY;
CREATE INDEX plan_shares_invitee_idx ON public.plan_shares(invitee_id);
CREATE INDEX plan_shares_plan_idx ON public.plan_shares(plan_id);

CREATE POLICY "Owner or invitee can view shares" ON public.plan_shares FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = invitee_id);
CREATE POLICY "Invitee can respond" ON public.plan_shares FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_id) WITH CHECK (auth.uid() = invitee_id);
CREATE POLICY "Owner or invitee can remove" ON public.plan_shares FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = invitee_id);

CREATE TRIGGER plan_shares_updated_at BEFORE UPDATE ON public.plan_shares
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Invitee may only change status
CREATE OR REPLACE FUNCTION public.plan_shares_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.plan_id <> OLD.plan_id OR NEW.owner_id <> OLD.owner_id OR NEW.invitee_id <> OLD.invitee_id
     OR NEW.invitee_email <> OLD.invitee_email OR NEW.owner_email <> OLD.owner_email THEN
    RAISE EXCEPTION 'Only status can be changed';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER plan_shares_guard BEFORE UPDATE ON public.plan_shares
  FOR EACH ROW EXECUTE FUNCTION public.plan_shares_guard();

CREATE OR REPLACE FUNCTION public.is_plan_collaborator(_plan_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.plan_shares
    WHERE plan_id = _plan_id AND invitee_id = _user_id AND status = 'ACCEPTED')
$$;

-- Invitees can see the plan title of pending invites; collaborators can view/edit
CREATE OR REPLACE FUNCTION public.is_plan_invitee(_plan_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.plan_shares
    WHERE plan_id = _plan_id AND invitee_id = _user_id AND status <> 'DECLINED')
$$;

CREATE POLICY "Invitees and collaborators can view plans" ON public.plans FOR SELECT TO authenticated
  USING (public.is_plan_invitee(id, auth.uid()));
CREATE POLICY "Collaborators can edit plans" ON public.plans FOR UPDATE TO authenticated
  USING (public.is_plan_collaborator(id, auth.uid()))
  WITH CHECK (public.is_plan_collaborator(id, auth.uid()));

CREATE OR REPLACE FUNCTION public.plans_owner_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.user_id <> OLD.user_id THEN RAISE EXCEPTION 'Owner cannot be changed'; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER plans_owner_guard BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.plans_owner_guard();

-- Invite by email (resolves the account server-side)
CREATE OR REPLACE FUNCTION public.invite_to_plan(_plan_id uuid, _email text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _invitee uuid;
  _owner_email text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.plans WHERE id = _plan_id AND user_id = _uid) THEN
    RETURN 'not_owner';
  END IF;
  SELECT id INTO _invitee FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF _invitee IS NULL THEN RETURN 'no_account'; END IF;
  IF _invitee = _uid THEN RETURN 'self'; END IF;
  SELECT email INTO _owner_email FROM auth.users WHERE id = _uid;
  INSERT INTO public.plan_shares (plan_id, owner_id, invitee_id, invitee_email, owner_email)
  VALUES (_plan_id, _uid, _invitee, lower(trim(_email)), _owner_email)
  ON CONFLICT (plan_id, invitee_id) DO UPDATE SET status = 'PENDING'
    WHERE public.plan_shares.status = 'DECLINED';
  RETURN 'ok';
END; $$;
REVOKE ALL ON FUNCTION public.invite_to_plan(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.invite_to_plan(uuid, text) TO authenticated;