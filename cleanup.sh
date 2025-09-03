#!/bin/bash

# Project Cleanup Script for Iwanyu Vendor Dashboard
# This script removes temporary files, debug scripts, and organizes the project

echo "🧹 Starting project cleanup..."

# Files to remove (temporary, debug, and redundant files)
FILES_TO_REMOVE=(
    # Debug and test scripts
    "add-sample-data.mjs"
    "add-test-image.mjs"
    "check-all-data.mjs" 
    "check-database.mjs"
    "check-db.js"
    "check-db.mjs"
    "check-orders-table.mjs"
    "check-product-images.mjs"
    "comprehensive-fix.mjs"
    "comprehensive-test-all.mjs"
    "comprehensive-test.mjs"
    "complete-vendor-test.mjs"
    "create-admin-account.mjs"
    "create-bucket.mjs"
    "create-working-data.mjs"
    "dashboard-verification.mjs"
    "database-status.js"
    "debug-product-images.mjs"
    "diagnose-storage.mjs"
    "end-to-end-test.mjs"
    "ensure-vendor-store.mjs"
    "execute-sql-setup.mjs"
    "final-complete-setup.mjs"
    "final-comprehensive-test.mjs"
    "final-error-check.mjs"
    "final-success-report.mjs"
    "final-verification-complete.mjs"
    "final-verification.mjs"
    "fix-auth-storage.mjs"
    "fix-dashboard-issues.mjs"
    "fix-storage-comprehensive.mjs"
    "fix-storage-policies.mjs"
    "fix-storage-rls.mjs"
    "image-upload-fix-summary.mjs"
    "inspect-real-schema.mjs"
    "inspect-schema.mjs"
    "list-tables.mjs"
    "minimal-sample-data.mjs"
    "quick-verify.mjs"
    "real-table-creator.mjs"
    "reset-product-images.mjs"
    "run-migrations.js"
    "run-sql.mjs"
    "setup-complete-db.mjs"
    "setup-complete-storage.mjs"
    "setup-db.js"
    "setup-storage.js"
    "setup-storage.mjs"
    "setup-test-vendor.mjs"
    "simple-sample-data.mjs"
    "test-api-endpoints.mjs"
    "test-css.mjs"
    "test-database-comprehensive.mjs"
    "test-database-final.mjs"
    "test-database-real-schema.mjs"
    "test-image-upload.mjs"
    "test-login.mjs"
    "test-product-api.mjs"
    "test-storage.mjs"
    "test-uploads.mjs"
    "test-vendor-data.mjs"
    "test-workflow-comprehensive.mjs"
    "thorough-test.mjs"
    "ultimate-table-creator.mjs"
    "verification-complete.mjs"
    "verify-css.mjs"
    "verify-database-setup.mjs"
    "verify-db.js"
    
    # Temporary build files
    "build-final.log"
    "build-test.log" 
    "build.log"
    "tsconfig.tsbuildinfo"
    
    # Temporary SQL files
    "combined_migrations.sql"
    "complete_database_setup.sql"
    "create-vendor-stores.sql"
    "create_all_tables.sql"
    "FIX_MISSING_TABLES_AND_STORAGE.sql"
    "QUICK_DATABASE_SETUP.sql"
    "QUICK_SQL_SETUP.sql"
    "supabase_storage_policies.sql"
    "temp_migration.sql"
    
    # Shell scripts (keeping essential ones)
    "comprehensive-final-test.sh"
    "create-storage-bucket.sh"
    "create-tables-cli.sh"
    "create-tables-script.sh"
    "quick-table-guide.sh"
    
    # Documentation files that are outdated or redundant
    "ADMIN_ACCOUNT_SETUP.md"
    "COMPLETE_SOLUTION_SUMMARY.md"
    "COMPREHENSIVE_END_TO_END_TEST_RESULTS.md"
    "COMPREHENSIVE_TEST_REPORT.md"
    "CONSOLE-ERRORS-FIXED-FINAL.md"
    "CONSOLE_ERRORS_FIXED_REPORT.md"
    "DASHBOARD_FIXES_REPORT.md"
    "END_TO_END_TEST_PLAN.md"
    "ERROR-FIXES-COMPLETE.md"
    "FINAL_END_TO_END_TESTING_SUMMARY.md"
    "FIXES-COMPLETED.md"
    "REACT_500_ERROR_FIX.md"
    "REACT_FIXES.md"
    "STORAGE_FIX_SUMMARY.md"
    "SUPABASE_CLI_SUCCESS.md"
    "TEST_RESULTS.md"
    "URGENT_FIXES_NEEDED.md"
    "VENDOR_DASHBOARD_REPORT.md"
    
    # Other temporary files
    "deployment-info.json"
)

# Remove files
echo "🗑️  Removing temporary and debug files..."
for file in "${FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "   ✅ Removed: $file"
    fi
done

# Clean up coverage directory if it exists
if [ -d "coverage" ]; then
    rm -rf coverage
    echo "   ✅ Removed: coverage/"
fi

# Create/update .gitignore to prevent future clutter
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOF'

# Debug and test files
*.debug.js
*.debug.mjs
*.test.mjs
debug-*.mjs
test-*.mjs
check-*.mjs
fix-*.mjs
setup-*.mjs
verify-*.mjs

# Build logs
*.log
build*.log

# Temporary files
temp_*.sql
*.tmp
.temp/

# Coverage reports  
coverage/
.nyc_output/

# Development documentation
*_FIXES*.md
*_REPORT*.md
*_RESULTS*.md
*_SUMMARY*.md
CONSOLE*.md
ERROR*.md
URGENT*.md

EOF

echo "✅ Project cleanup completed!"
echo ""
echo "📊 Cleanup Summary:"
echo "   - Removed debug and test scripts"
echo "   - Cleaned up temporary SQL files"
echo "   - Removed build logs and artifacts"
echo "   - Organized documentation"
echo "   - Updated .gitignore"
echo ""
echo "🎯 Remaining essential files:"
echo "   - Source code (app/, components/, lib/, etc.)"
echo "   - Configuration files (package.json, next.config.mjs, etc.)"
echo "   - Essential documentation (README.md, SETUP_GUIDE.md, etc.)"
echo "   - Production deployment files"
