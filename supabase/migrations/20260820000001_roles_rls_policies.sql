-- Migration: Add Row Level Security (RLS) policies for roles and user_roles tables
-- This allows client-side code (running under authenticated users) to fetch their roles.

-- Allow public read access to roles (names and descriptions)
CREATE POLICY "Allow public read for roles" ON public.roles
  FOR SELECT USING (true);

-- Allow authenticated users to select their own user_role mappings
CREATE POLICY "Allow users to view own user_roles" ON public.user_roles
  FOR SELECT USING (user_id = (auth.uid())::text);
