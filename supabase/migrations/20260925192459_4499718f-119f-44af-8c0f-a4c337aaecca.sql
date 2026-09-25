REVOKE ALL ON FUNCTION public.is_plan_collaborator(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_plan_invitee(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_plan_collaborator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_plan_invitee(uuid, uuid) TO authenticated;