#!/bin/bash

echo "🚀 CREATING TABLES VIA MULTIPLE METHODS..."
echo ""

# Method 1: Try curl with REST API
echo "📡 Trying REST API approach..."

SUPABASE_URL="https://tviewbuthckejhlogwns.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aWV3YnV0aGNrZWpobG9nd25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzcxOTgsImV4cCI6MjA1Mjk1MzE5OH0.h2q7ShPHHhEyQdLVXECfFFjuB3R4P5_qYPdyTnCfwkA"

# Test basic connectivity
echo "🔌 Testing connection..."
curl -s -X GET "$SUPABASE_URL/rest/v1/" \
  -H "apikey: $API_KEY" \
  -H "Authorization: Bearer $API_KEY" > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Connection successful"
else
  echo "❌ Connection failed"
fi

echo ""
echo "🔧 EASIEST SOLUTION:"
echo "=================================="
echo "Let me open the Supabase table editor for you"
echo "You can create tables visually there!"
echo ""

# Open the table editor
open "https://supabase.com/dashboard/project/tviewbuthckejhlogwns/editor"

echo "✅ Opened Supabase Table Editor"
echo ""
echo "📋 CREATE THESE TABLES MANUALLY:"
echo "=================================="
echo ""

echo "1️⃣  TABLE: profiles"
echo "   - id (uuid, primary key)"
echo "   - email (text, unique)"
echo "   - full_name (text)"
echo "   - role (text, default: vendor)"
echo "   - created_at (timestamptz, default: now())"
echo ""

echo "2️⃣  TABLE: categories"
echo "   - id (uuid, primary key, default: gen_random_uuid())"
echo "   - name (text, not null)"
echo "   - slug (text, unique)"
echo "   - status (text, default: active)"
echo "   - created_at (timestamptz, default: now())"
echo ""

echo "3️⃣  TABLE: products"
echo "   - id (uuid, primary key, default: gen_random_uuid())"
echo "   - vendor_id (uuid)"
echo "   - category_id (uuid)"
echo "   - name (text, not null)"
echo "   - price (numeric)"
echo "   - status (text, default: draft)"
echo "   - created_at (timestamptz, default: now())"
echo ""

echo "4️⃣  TABLE: orders"
echo "   - id (uuid, primary key, default: gen_random_uuid())"
echo "   - order_number (text, unique)"
echo "   - customer_id (uuid)"
echo "   - vendor_id (uuid)"
echo "   - total_amount (numeric)"
echo "   - status (text, default: pending)"
echo "   - created_at (timestamptz, default: now())"
echo ""

echo "5️⃣  TABLE: notifications"
echo "   - id (uuid, primary key, default: gen_random_uuid())"
echo "   - user_id (uuid)"
echo "   - title (text, not null)"
echo "   - message (text, not null)"
echo "   - read (boolean, default: false)"
echo "   - created_at (timestamptz, default: now())"
echo ""

echo "6️⃣  TABLE: messages"
echo "   - id (uuid, primary key, default: gen_random_uuid())"
echo "   - sender_id (uuid)"
echo "   - recipient_id (uuid)"
echo "   - content (text, not null)"
echo "   - read (boolean, default: false)"
echo "   - created_at (timestamptz, default: now())"
echo ""

echo "🎯 QUICK START: Just create these 6 tables and your dashboard will work!"
echo ""
echo "After creating tables, run: node verify-database-setup.mjs"
