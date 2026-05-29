-- Seed Data for Super Admin User
-- Run this script to create the initial super admin

-- Create super admin user (you need to replace with actual UUID from Supabase auth)
-- First, create the user in Supabase Auth, then get the UUID and run this:

-- INSERT INTO public.profiles (id, email, role, is_active)
-- VALUES (
--   'YOUR_SUPER_ADMIN_UUID_HERE', -- Replace with actual UUID from auth.users
--   'admin@surveyapp.com',
--   'super_admin',
--   true
-- );

-- Grant all permissions to super admin
-- INSERT INTO public.admin_permissions (user_id, permission, granted_by, granted_at)
-- VALUES (
--   'YOUR_SUPER_ADMIN_UUID_HERE', -- Replace with actual UUID
--   'view_all_surveys',
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   NOW()
-- ),
-- (
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   'manage_all_surveys',
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   NOW()
-- ),
-- (
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   'view_all_users',
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   NOW()
-- ),
-- (
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   'manage_users',
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   NOW()
-- ),
-- (
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   'system_admin',
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   NOW()
-- );

-- Log initial admin setup
-- SELECT public.log_admin_activity(
--   'YOUR_SUPER_ADMIN_UUID_HERE',
--   'SYSTEM_SETUP',
--   'system',
--   NULL,
--   '{"action": "Initial super admin setup", "email": "admin@surveyapp.com"}'::jsonb
-- );

-- Example queries to verify admin setup:
-- SELECT * FROM profiles WHERE role = 'super_admin';
-- SELECT * FROM admin_permissions WHERE user_id = 'YOUR_SUPER_ADMIN_UUID_HERE';
-- SELECT * FROM admin_activity_log WHERE admin_id = 'YOUR_SUPER_ADMIN_UUID_HERE';

-- Function to create super admin with email and password
-- This function should be called after creating the user in Supabase Auth
CREATE OR REPLACE FUNCTION public.create_super_admin(user_email TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update profile to super admin
  UPDATE public.profiles 
  SET role = 'super_admin', is_active = true 
  WHERE id = user_id;
  
  -- Grant all permissions
  INSERT INTO public.admin_permissions (user_id, permission, granted_by, granted_at)
  VALUES 
    (user_id, 'view_all_surveys', user_id, NOW()),
    (user_id, 'manage_all_surveys', user_id, NOW()),
    (user_id, 'view_all_users', user_id, NOW()),
    (user_id, 'manage_users', user_id, NOW()),
    (user_id, 'system_admin', user_id, NOW())
  ON CONFLICT (user_id, permission) DO NOTHING;
  
  -- Log the setup
  PERFORM public.log_admin_activity(
    user_id,
    'SUPER_ADMIN_CREATED',
    'user',
    user_id,
    json_build_object('email', user_email, 'role', 'super_admin')
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage example:
-- After creating a user in Supabase Auth, call:
-- SELECT public.create_super_admin('admin@surveyapp.com', 'user-uuid-from-auth');
