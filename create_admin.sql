-- Run this script in your Supabase SQL Editor to create the first Admin user.

-- 1. Create the Admin role
INSERT INTO public.roles (name, description)
VALUES ('Admin', 'System Administrator')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert the admin user into auth.users
-- This uses Supabase's internal crypt() function for the password.
-- The login will be:
-- Username: admin
-- Password: admin123

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  admin_role_id uuid;
BEGIN
  -- Get the Admin role ID
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;

  -- Create the user in auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'admin@ectron.local',
    crypt('admin123', gen_salt('bf')),
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"username":"admin","full_name":"System Administrator"}',
    current_timestamp,
    current_timestamp
  );

  -- 3. Upsert the profile for the new user
  -- (In case a trigger already created the profile, we just update it)
  INSERT INTO public.profiles (id, username, full_name, role_id, is_active)
  VALUES (new_user_id, 'admin', 'System Administrator', admin_role_id, true)
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role_id = EXCLUDED.role_id,
    is_active = EXCLUDED.is_active;

END $$;
