CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _email TEXT;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  RETURN _email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO anon, authenticated;