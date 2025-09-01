# Admin Account Setup Instructions

## Method 1: Supabase Dashboard (Recommended)

1. **Access Your Supabase Project Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project: `tviewbuthckejhlogwns`

2. **Create Admin User**
   - Go to Authentication > Users
   - Click "Add User"
   - Email: `admin@iwanyu.com`
   - Password: `Admin123!@#`
   - Click "Create User"

3. **Set Admin Role**
   - After creating the user, copy the User ID
   - Go to Table Editor > profiles
   - Insert new row or update existing:
     ```
     id: [USER_ID_FROM_STEP_2]
     email: admin@iwanyu.com
     full_name: System Administrator
     role: admin
     status: active
     ```

4. **Login to Platform**
   - Go to: http://localhost:3000/auth/login
   - Email: `admin@iwanyu.com`
   - Password: `Admin123!@#`

## Method 2: Database Direct Insert

If you have database access, run this SQL:

```sql
-- Insert admin profile (replace UUID with actual user ID from auth.users)
INSERT INTO public.profiles (id, email, full_name, role, status) 
VALUES 
  ('REPLACE_WITH_ACTUAL_USER_ID', 'admin@iwanyu.com', 'System Administrator', 'admin', 'active')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status;
```

## Method 3: Use Existing Sample Admin

Based on the seed data, there's already a sample admin:
- **Email**: `admin@iwanyu.com`
- **User ID**: `00000000-0000-0000-0000-000000000001`

You just need to create the corresponding auth user in Supabase dashboard.

## Quick Access Credentials

**Admin Account:**
- Email: `admin@iwanyu.com`
- Password: `Admin123!@#`
- Role: `admin`
- Access: Full platform administration

**Test Vendor Account (if needed):**
- Email: `vendor@iwanyu.com`  
- Password: `Vendor123!@#`
- Role: `vendor`
- Access: Vendor dashboard only

## Admin Dashboard Access

Once logged in as admin:
- Dashboard: http://localhost:3000/admin
- Analytics: http://localhost:3000/admin/analytics
- Vendor Management: http://localhost:3000/admin/vendors
- User Management: http://localhost:3000/admin/users

## Troubleshooting

If you can't create accounts due to email validation:
1. Check Supabase project settings for email restrictions
2. Try different email domains
3. Disable email confirmation temporarily in Auth settings
4. Use the service role key for direct database operations

Let me know if you need help with any of these steps!
