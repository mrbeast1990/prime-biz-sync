-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add PIN hash column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Function to set a PIN for a user (only admins can set for others; users can set own)
CREATE OR REPLACE FUNCTION public.set_user_pin(_user_id UUID, _pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() <> _user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to set PIN for another user';
  END IF;

  IF _pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;

  UPDATE public.profiles
  SET pin_hash = crypt(_pin, gen_salt('bf', 8)),
      updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- Function to look up the email associated with a user_id + PIN (used by login)
-- Returns the email so client can call signInWithPassword using a server-known password.
-- Instead, we return a one-time login token approach: we verify PIN and return the email
-- only if the PIN matches. The client then uses a fixed reset flow.
-- Simpler: return whether PIN is valid; pair with email lookup so client signs in.
CREATE OR REPLACE FUNCTION public.verify_user_pin(_user_id UUID, _pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hash TEXT;
BEGIN
  SELECT pin_hash INTO _hash FROM public.profiles WHERE user_id = _user_id;
  IF _hash IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN _hash = crypt(_pin, _hash);
END;
$$;

-- Public-safe view: list users with display_name + has_pin flag (no hashes exposed)
CREATE OR REPLACE VIEW public.user_directory
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.display_name,
  (p.pin_hash IS NOT NULL) AS has_pin
FROM public.profiles p;

GRANT SELECT ON public.user_directory TO anon, authenticated;