#!/bin/bash

echo "🧪 Comprehensive Product Testing - Live Application"
echo "=================================================="
echo ""

# Get the application URL
APP_URL="https://iwanyuvendordashboard.vercel.app"
echo "🌐 Testing application at: $APP_URL"
echo ""

# Test 1: Application Accessibility
echo "1️⃣ Testing Application Accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Application is accessible (HTTP $HTTP_STATUS)"
else
    echo "   ❌ Application not accessible (HTTP $HTTP_STATUS)"
fi
echo ""

# Test 2: Key Pages Accessibility
echo "2️⃣ Testing Key Pages..."

pages=(
    "/vendor/products"
    "/vendor/products/new"
    "/auth/vendor-login"
)

for page in "${pages[@]}"; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$page")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "   ✅ $page (HTTP $HTTP_STATUS)"
    else
        echo "   ❌ $page (HTTP $HTTP_STATUS)"
    fi
done
echo ""

# Test 3: API Endpoints
echo "3️⃣ Testing API Endpoints..."

api_endpoints=(
    "/api/products"
    "/api/upload-images"
)

for endpoint in "${api_endpoints[@]}"; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$endpoint")
    if [ "$HTTP_STATUS" = "401" ] || [ "$HTTP_STATUS" = "405" ]; then
        echo "   ✅ $endpoint (HTTP $HTTP_STATUS - Expected auth/method response)"
    elif [ "$HTTP_STATUS" = "200" ]; then
        echo "   ✅ $endpoint (HTTP $HTTP_STATUS)"
    else
        echo "   ❌ $endpoint (HTTP $HTTP_STATUS)"
    fi
done
echo ""

# Test 4: Static Assets
echo "4️⃣ Testing Static Assets..."

static_assets=(
    "/placeholder.svg"
    "/icon.png"
    "/logo.png"
)

for asset in "${static_assets[@]}"; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL$asset")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "   ✅ $asset (HTTP $HTTP_STATUS)"
    else
        echo "   ⚠️  $asset (HTTP $HTTP_STATUS)"
    fi
done
echo ""

echo "📋 MANUAL TESTING CHECKLIST"
echo "============================"
echo ""
echo "Please manually test the following:"
echo ""
echo "🔐 Authentication:"
echo "   □ Visit $APP_URL/auth/vendor-login"
echo "   □ Sign in with vendor credentials"
echo "   □ Verify redirect to dashboard"
echo ""
echo "📦 Product Creation:"
echo "   □ Navigate to $APP_URL/vendor/products/new"
echo "   □ Fill out complete product form:"
echo "     - Name: 'Test Product - Electronics'"
echo "     - Description: 'Comprehensive test product'"
echo "     - Price: '25000'"
echo "     - Category: Select 'Electronics'"
echo "     - Upload 2-3 images"
echo "     - Set inventory: '50'"
echo "   □ Submit form"
echo "   □ Verify success message"
echo "   □ Check product appears in list"
echo ""
echo "🖼️ Image Testing:"
echo "   □ Upload multiple images"
echo "   □ Set primary image (star icon)"
echo "   □ Verify thumbnails display"
echo "   □ Check images in product detail view"
echo ""
echo "📋 Category Testing:"
echo "   □ Create products with different categories:"
echo "     - Electronics"
echo "     - Clothing"
echo "     - Computers"
echo "   □ Verify categories save correctly"
echo "   □ Ensure no 'Uncategorized' appears"
echo ""
echo "📊 Product Detail View:"
echo "   □ Click 'View' on any product"
echo "   □ Verify all data displays:"
echo "     - Product name and description"
echo "     - Image gallery"
echo "     - Category (not 'Uncategorized')"
echo "     - Price formatting (RWF 25,000)"
echo "     - Inventory quantity"
echo "     - Timeline (created/updated dates)"
echo ""
echo "✏️ Edit Functionality:"
echo "   □ Click 'Edit' on existing product"
echo "   □ Modify name, price, category"
echo "   □ Add/remove images"
echo "   □ Save changes"
echo "   □ Verify updates persist"
echo ""
echo "🔍 Browser Console:"
echo "   □ Open Developer Tools"
echo "   □ Monitor console during testing"
echo "   □ Look for debug logs showing:"
echo "     - 🔍 Product data being sent"
echo "     - 🔍 Uploaded image URLs"
echo "     - 🔍 API response"
echo "     - 🔍 Product data being inserted into DB"
echo "   □ Verify no JavaScript errors"
echo ""
echo "✅ SUCCESS CRITERIA:"
echo "   ✓ Products create with all data intact"
echo "   ✓ Categories display correctly (not 'Uncategorized')"
echo "   ✓ Images upload and display in lists and detail views"
echo "   ✓ Timeline shows proper creation/update dates"
echo "   ✓ No console errors or API failures"
echo ""
echo "❌ FAILURE INDICATORS:"
echo "   ✗ 'Uncategorized' appears despite selecting category"
echo "   ✗ 'No images available' after successful upload"
echo "   ✗ Timeline missing or showing wrong dates"
echo "   ✗ Console shows API errors or database issues"
echo ""
echo "🎯 POST-TESTING:"
echo "   □ Delete test products created"
echo "   □ Report any issues found"
echo "   □ Document successful test completion"
echo ""
echo "💡 DEBUGGING TIPS:"
echo "   - Check Network tab in DevTools for API call details"
echo "   - Look for debugging console logs we added"
echo "   - Verify Supabase project has proper RLS policies"
echo "   - Ensure vendor store exists for product creation"
echo ""
echo "🚀 Application URL: $APP_URL"
echo "📅 Test Date: $(date)"
echo ""
echo "Happy Testing! 🧪✨"
