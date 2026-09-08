-- Fix for the Database error creating new user
-- This script safely updates the trigger function that runs when a user is created.
-- It ensures that it runs with the correct permissions (SECURITY DEFINER)
-- and handles missing data gracefully without crashing.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- 1. Try to find the 'Employee' role
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'Employee' LIMIT 1;
  
  -- 2. Safely insert the profile
  INSERT INTO public.profiles (id, username, full_name, role_id, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'System User'),
    default_role_id,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
