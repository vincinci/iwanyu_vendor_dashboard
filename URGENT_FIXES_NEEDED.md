# 🚨 IMMEDIATE DATABASE & STORAGE FIXES NEEDED

## Issues Found:
- ❌ **Notifications table missing** (404 errors)
- ❌ **Categories table missing** (404 errors)  
- ❌ **Storage bucket "products" missing** (400 errors)

---

## 🔧 QUICK FIX STEPS:

### 1. Fix Database Tables
1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/sql
2. Copy the entire contents of `FIX_MISSING_TABLES_AND_STORAGE.sql`
3. Paste into the SQL editor and click **Run**

### 2. Create Storage Bucket
1. Go to **Storage**: https://supabase.com/dashboard/project/tviewbuthckejhlogwns/storage/buckets
2. Click **"New bucket"**
3. Set these values:
   - **Name:** `products`
   - **Public:** ✅ **Checked** (Important!)
   - **File size limit:** `50MB`
   - **Allowed MIME types:** `image/jpeg,image/png,image/webp,image/avif`
4. Click **Create bucket**

---

## ✅ After completing these steps:
- 🔄 Refresh your browser
- 🏪 Try adding a product again  
- 📸 Test image upload functionality
- ✅ All errors should be resolved!

---

## 🎯 What This Fixes:
- **Categories dropdown** will populate with default categories
- **Notifications system** will work properly
- **Image uploads** will save to storage bucket
- **Product creation** will work end-to-end
