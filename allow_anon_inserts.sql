-- Run this script in your Supabase SQL Editor to create an admin user manually

-- 1. Create the Admin role if it doesn't exist
INSERT INTO public.roles (name, description)
VALUES ('Admin', 'System Administrator')
ON CONFLICT (name) DO NOTHING;

-- Note: To create an actual user with a password, it's best to use the Supabase Auth API 
-- However, we can create a dummy profile if we know the user's UUID.
-- The most straightforward way to add the very first Admin is to:
-- 1. Sign up on the login page by modifying the UI temporarily, OR
-- 2. Use a service_role key to bypass RLS.

-- Let's create an RLS policy temporarily to allow anon to insert roles and profiles so the script works.

CREATE POLICY "Allow anon insert to roles" ON public.roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert to profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update to profiles" ON public.profiles FOR UPDATE USING (true);
