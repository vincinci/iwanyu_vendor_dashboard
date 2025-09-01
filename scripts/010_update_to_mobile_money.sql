-- 010_update_to_mobile_money.sql
-- Replace bank account information with mobile money for payouts

-- Update vendor_stores table to use mobile money instead of bank accounts
ALTER TABLE vendor_stores 
ADD COLUMN IF NOT EXISTS mobile_money_info JSONB DEFAULT '{}';

-- Migrate any existing bank account data to mobile money format (if needed)
-- This is a placeholder for manual data migration if there's existing data

-- Remove the old bank account column
ALTER TABLE vendor_stores 
DROP COLUMN IF EXISTS bank_account_info;

-- Add comment for documentation
COMMENT ON COLUMN vendor_stores.mobile_money_info IS 'Mobile money information for vendor payouts (account name, phone number, provider)';
