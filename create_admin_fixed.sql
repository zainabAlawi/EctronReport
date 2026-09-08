-- 1. Clean up the previous broken attempt completely
DELETE FROM auth.identities WHERE identity_data->>'email' = 'admin@ectron.local';
DELETE FROM auth.users WHERE email = 'admin@ectron.local';
DELETE FROM public.profiles WHERE username = 'admin';

-- 2. Create the user properly with identities
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
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
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
    current_timestamp,
    '', '', '', ''
  );

  -- IMPORTANT: Create the identity record (this is what caused the Database error querying schema)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id::text, 'admin@ectron.local')::jsonb,
    'email',
    current_timestamp,
    current_timestamp,
    current_timestamp
  );

  -- Update the profile that was auto-created by the trigger to be an Admin
  UPDATE public.profiles 
  SET role_id = admin_role_id, is_active = true
  WHERE id = new_user_id;

END $$;
