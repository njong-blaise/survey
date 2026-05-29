# Super Admin Setup Guide

This guide will help you create a super admin user for your survey application.

## 🚀 Quick Setup

### Step 1: Update Database Schema

First, run the updated database schema to add admin functionality:

```sql
-- Run the complete database_schema.sql file in your Supabase SQL editor
-- This will add:
-- - Role system to profiles table
-- - Admin permissions table
-- - Admin activity log table
-- - Updated RLS policies for admin access
```

### Step 2: Create Super Admin User

#### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard** → Authentication → Users
2. **Create a new user** with email: `admin@surveyapp.com`
3. **Set a strong password** for the admin account
4. **Note the User ID** from the user details (UUID format)

#### Option B: Using SQL

```sql
-- Create user in Supabase Auth first, then run:
SELECT public.create_super_admin('admin@surveyapp.com', 'YOUR_USER_UUID_HERE');
```

### Step 3: Grant Super Admin Permissions

After creating the user, run this SQL command to grant super admin privileges:

```sql
-- Replace 'YOUR_USER_UUID_HERE' with the actual UUID from Step 2
SELECT public.create_super_admin('admin@surveyapp.com', 'YOUR_USER_UUID_HERE');
```

### Step 4: Verify Setup

Run these queries to verify everything is working:

```sql
-- Check user role
SELECT * FROM profiles WHERE email = 'admin@surveyapp.com';

-- Check permissions
SELECT * FROM admin_permissions WHERE user_id = 'YOUR_USER_UUID_HERE';

-- Check activity log
SELECT * FROM admin_activity_log WHERE admin_id = 'YOUR_USER_UUID_HERE';
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup, use these SQL commands:

```sql
-- 1. Update user role
UPDATE public.profiles 
SET role = 'super_admin', is_active = true 
WHERE email = 'admin@surveyapp.com';

-- 2. Grant all permissions
INSERT INTO public.admin_permissions (user_id, permission, granted_by, granted_at)
VALUES 
  ('YOUR_USER_UUID_HERE', 'view_all_surveys', 'YOUR_USER_UUID_HERE', NOW()),
  ('YOUR_USER_UUID_HERE', 'manage_all_surveys', 'YOUR_USER_UUID_HERE', NOW()),
  ('YOUR_USER_UUID_HERE', 'view_all_users', 'YOUR_USER_UUID_HERE', NOW()),
  ('YOUR_USER_UUID_HERE', 'manage_users', 'YOUR_USER_UUID_HERE', NOW()),
  ('YOUR_USER_UUID_HERE', 'system_admin', 'YOUR_USER_UUID_HERE', NOW());

-- 3. Log the setup
SELECT public.log_admin_activity(
  'YOUR_USER_UUID_HERE',
  'SUPER_ADMIN_CREATED',
  'user',
  'YOUR_USER_UUID_HERE',
  '{"email": "admin@surveyapp.com", "role": "super_admin"}'::jsonb
);
```

## 🎯 Access Admin Panel

Once setup is complete:

1. **Login** with your admin credentials: `admin@surveyapp.com`
2. **Navigate** to `/admin` or click "Admin Panel" in the sidebar
3. **Manage** users, surveys, and view system statistics

## 🔐 Security Notes

- **Change the default email** from `admin@surveyapp.com` to your actual admin email
- **Use a strong password** for the super admin account
- **Only grant admin roles** to trusted users
- **Monitor activity logs** regularly for suspicious actions

## 📋 Admin Permissions

### Super Admin (Full Access)
- ✅ View all surveys
- ✅ Manage all surveys (delete any survey)
- ✅ View all users
- ✅ Manage users (change roles, deactivate)
- ✅ System administration
- ✅ View activity logs
- ✅ System statistics

### Regular Admin (Limited Access)
- ✅ View all surveys
- ❌ Cannot delete surveys
- ❌ Cannot manage users
- ❌ Limited system access

## 🚨 Troubleshooting

### "Admin access required" error
- Check if the user has the correct role in the profiles table
- Verify the user is active (is_active = true)

### "Permission denied" error
- Ensure RLS policies are correctly applied
- Check admin_permissions table for required permissions

### Admin panel not showing
- Verify the AdminProvider is correctly wrapped in App.jsx
- Check browser console for JavaScript errors

## 📞 Support

If you encounter issues:

1. **Check browser console** for error messages
2. **Verify database schema** is updated correctly
3. **Ensure Supabase RLS policies** are applied
4. **Check API responses** in network tab

---

**🎉 Your super admin system is now ready!**
