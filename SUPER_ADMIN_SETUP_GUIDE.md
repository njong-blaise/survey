# 🚀 Super Admin Setup Guide for Supabase

This guide will help you connect your super admin system to Supabase and get everything working.

---

## 📋 **PREREQUISITES**

Before starting, ensure you have:
- ✅ Supabase account and project created
- ✅ Project URL and API keys
- ✅ Backend and frontend servers running
- ✅ Database schema and seed admin scripts ready

---

## 🔍 **STEP 1: CHECK SUPABASE PROJECT STATUS**

### **1.1 Access Supabase Dashboard**
1. **Go to**: https://app.supabase.com
2. **Login** with your Supabase credentials
3. **Select your project**: `zqskjtfpuvcwofculega`

### **1.2 Verify Project Status**
Check these items:
- ✅ **Project Status**: Should be "Active" (not paused)
- ✅ **Billing Status**: Should be current (not suspended)
- ✅ **Database Status**: Should be "Online"
- ✅ **API Status**: Should be "Enabled"

### **1.3 If Project is Paused**
- **Go to**: Settings → Billing
- **Update payment method** if needed
- **Resume the project**
- **Wait 2-3 minutes** for project to activate

---

## 🗄️ **STEP 2: RUN DATABASE SCHEMA**

### **2.1 Open SQL Editor**
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. You'll see a blank SQL editor window

### **2.2 Run the Complete Schema**
Copy and paste the entire contents of `database_schema.sql` into the SQL Editor:

```sql
-- This includes:
-- - Admin role system for profiles table
-- - Admin permissions table
-- - Admin activity log table
-- - RLS policies for admin access
-- - Admin helper functions
```

**Click "Run"** to execute the schema.

### **2.3 Verify Schema Applied**
Run this query to verify:

```sql
-- Check if admin tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%admin%';

-- Should return:
-- - admin_permissions
-- - admin_activity_log
```

---

## 👤 **STEP 3: CREATE SUPER ADMIN USER**

### **3.1 Create User in Supabase Auth**
1. **Go to**: Authentication → Users
2. **Click "Add User"**
3. **Fill in details**:
   - **Email**: `admin@yourdomain.com` (or your preferred email)
   - **Password**: Create a strong password
   - **Auto Confirm User**: ✅ Check this box
4. **Click "Create User"**

### **3.2 Copy User ID**
1. **Click on the newly created user**
2. **Copy the User ID** (UUID format)
3. **Save it** - you'll need it for the next step

### **3.3 Run Seed Admin Script**
Go back to SQL Editor and run:

```sql
-- Replace 'YOUR_USER_UUID_HERE' with the actual UUID from Step 3.2
-- Replace 'admin@yourdomain.com' with your admin email
SELECT public.create_super_admin('admin@yourdomain.com', 'YOUR_USER_UUID_HERE');
```

### **3.4 Verify Super Admin Created**
Run this query:

```sql
-- Check user role
SELECT email, role, is_active 
FROM profiles 
WHERE email = 'admin@yourdomain.com';

-- Should show:
-- - role: 'super_admin'
-- - is_active: true

-- Check permissions
SELECT * FROM admin_permissions 
WHERE user_id = 'YOUR_USER_UUID_HERE';

-- Should show all 5 permissions:
-- - view_all_surveys
-- - manage_all_surveys
-- - view_all_users
-- - manage_users
-- - system_admin
```

---

## 🔧 **STEP 4: UPDATE ENVIRONMENT VARIABLES**

### **4.1 Verify Backend .env**
Check `server/.env` has:
```env
PORT=5000
SUPABASE_URL=https://zqskjtfpuvcwofculega.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### **4.2 Verify Frontend .env**
Check `client/.env` has:
```env
VITE_SUPABASE_URL=https://zqskjtfpuvcwofculega.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### **4.3 Restart Servers**
After updating environment variables, restart both servers:

```bash
# Stop current servers (Ctrl+C in terminal)
# Then restart:

# Backend
cd server
node index.js

# Frontend (in new terminal)
cd client
npm run dev
```

---

## 🧪 **STEP 5: TEST SUPABASE CONNECTION**

### **5.1 Test Backend Connection**
```bash
# Test main API
curl http://localhost:5000/api

# Should return: {"message":"Survey Application API"}
```

### **5.2 Test Supabase Directly**
```bash
# Test Supabase connection
curl https://zqskjtfpuvcwofculega.supabase.co

# Should return Supabase response (not error)
```

### **5.3 Test Database Query**
In Supabase SQL Editor, run:
```sql
-- Test basic query
SELECT COUNT(*) FROM profiles;

-- Should return a number (count of users)
```

---

## 🚀 **STEP 6: ACCESS ADMIN PANEL**

### **6.1 Login as Super Admin**
1. **Open browser**: http://localhost:5174
2. **Click "Login"**
3. **Enter credentials**:
   - **Email**: `admin@yourdomain.com`
   - **Password**: The password you created in Step 3.1

### **6.2 Navigate to Admin Panel**
After successful login:
- **Method 1**: Click "Admin Panel" in sidebar (should appear for admin users)
- **Method 2**: Go directly to http://localhost:5174/admin

### **6.3 Verify Admin Panel Works**
You should see:
- ✅ **Overview Tab** with system statistics
- ✅ **Users Tab** with all users
- ✅ **Surveys Tab** with all surveys
- ✅ **Responses Tab** with all responses
- ✅ **Questions Tab** with all questions
- ✅ **Activity Tab** with admin logs

---

## 🔍 **STEP 7: TROUBLESHOOTING**

### **Issue: "Supabase not accessible"**
**Solution**:
- Check Supabase Dashboard for project status
- Verify billing is current
- Check network/firewall settings
- Try accessing Supabase directly in browser

### **Issue: "Admin panel not showing"**
**Solution**:
- Verify user has `role = 'super_admin'` in database
- Check `is_active = true` in profiles table
- Clear browser cache and login again
- Check browser console for errors

### **Issue: "Permission denied" errors**
**Solution**:
- Verify admin_permissions table has entries for user
- Check RLS policies are applied correctly
- Ensure database schema was run completely

### **Issue: "Failed to fetch" errors**
**Solution**:
- Check backend server is running (port 5000)
- Verify Supabase connection is working
- Check environment variables are correct
- Restart both servers

### **Issue: "Database schema not applied"**
**Solution**:
- Re-run database_schema.sql completely
- Check for SQL errors in Supabase SQL Editor
- Verify all admin tables exist
- Check RLS policies are enabled

---

## 📋 **VERIFICATION CHECKLIST**

Use this checklist to verify everything is working:

- [ ] **Supabase project is active and accessible**
- [ ] **Database schema applied successfully**
- [ ] **Admin tables created** (admin_permissions, admin_activity_log)
- [ ] **Super admin user created in Supabase Auth**
- [ ] **User role set to 'super_admin' in profiles table**
- [ ] **All 5 permissions granted to super admin**
- [ ] **Backend server running on port 5000**
- [ ] **Frontend server running on port 5174**
- [ ] **Can login with super admin credentials**
- [ ] **Admin panel accessible at /admin**
- [ ] **All admin tabs working correctly**
- [ ] **Can view users, surveys, responses, questions**
- [ ] **Activity log recording admin actions**

---

## 🎯 **QUICK REFERENCE**

### **Important URLs**
- **Supabase Dashboard**: https://app.supabase.com
- **Your Project**: https://zqskjtfpuvcwofculega.supabase.co
- **Local Backend**: http://localhost:5000
- **Local Frontend**: http://localhost:5174
- **Admin Panel**: http://localhost:5174/admin

### **Key SQL Commands**
```sql
-- Check user role
SELECT email, role, is_active FROM profiles WHERE email = 'admin@yourdomain.com';

-- Check permissions
SELECT * FROM admin_permissions WHERE user_id = 'YOUR_USER_UUID';

-- Check activity log
SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT 10;

-- View all admin tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%admin%';
```

### **Admin Permissions**
- `view_all_surveys` - View all surveys in the system
- `manage_all_surveys` - Delete any survey
- `view_all_users` - View all users
- `manage_users` - Change user roles and deactivate accounts
- `system_admin` - View activity logs and system stats

---

## 🆘 **GETTING HELP**

If you encounter issues:

1. **Check browser console** (F12) for JavaScript errors
2. **Check Supabase logs** in Dashboard → Logs
3. **Check backend terminal** for error messages
4. **Verify database schema** was applied completely
5. **Test Supabase connection** directly

---

## 🎉 **SUCCESS INDICATORS**

When everything is working correctly:

✅ **Supabase project is accessible**  
✅ **All admin tables exist in database**  
✅ **Super admin user has correct role and permissions**  
✅ **Login works with admin credentials**  
✅ **Admin panel displays all tabs**  
✅ **Can view and manage all data**  
✅ **Activity log records all actions**  

---

**🚀 Your super admin system is now ready to use!**
