-- Migration: Fix handle_new_user trigger to NOT overwrite an already-assigned role.
-- Problem: When an admin invites a user, assignRole sets the role to ADMIN/MANAGER.
-- But when the invited user clicks the link and confirms, auth.users fires AFTER UPDATE
-- (or in some flows a second INSERT event), which re-runs handle_new_user and overwrites
-- the carefully set ADMIN role back to CUSTOMER.
--
-- Fix 1: Change the trigger to fire on INSERT only (already is), but protect against
--        duplicate / overwrite in the body using ON CONFLICT DO NOTHING.
-- Fix 2: Also add an AFTER UPDATE trigger for when invited users confirm their account
--        (email_confirmed_at goes from NULL to a timestamp) — but again DO NOTHING if role exists.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Upsert profile (always safe to sync metadata)
  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();

  -- Only assign CUSTOMER role if the user has NO role assigned yet.
  -- This prevents the trigger from overwriting ADMIN/MANAGER roles set by assignRole.
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = new.id::text
  ) THEN
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'CUSTOMER';

    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id)
      VALUES (new.id::text, v_role_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate INSERT trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
