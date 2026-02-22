
-- Allow the trigger (handle_new_user) to insert into profiles
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (true);

-- Create trigger to auto-assign admin role to the first user
CREATE OR REPLACE FUNCTION public.assign_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no roles exist yet, make this user admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users on insert
CREATE TRIGGER on_auth_user_created_assign_admin
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_first_user_admin();
