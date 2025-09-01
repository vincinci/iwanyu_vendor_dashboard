-- Payout Management System for Iwanyu Platform
-- This script creates the necessary tables and policies for vendor payouts

-- Create vendor_payouts table
CREATE TABLE IF NOT EXISTS vendor_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payout_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    order_items_included UUID[] DEFAULT '{}',
    admin_notes TEXT,
    payment_reference VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_payment_methods table for storing vendor payment details
CREATE TABLE IF NOT EXISTS vendor_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('bank_transfer', 'mobile_money', 'paypal')),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255),
    bank_name VARCHAR(255),
    bank_code VARCHAR(50),
    swift_code VARCHAR(50),
    mobile_number VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, method_type, account_number)
);

-- Create payout_transactions table for detailed transaction tracking
CREATE TABLE IF NOT EXISTS payout_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id UUID NOT NULL REFERENCES vendor_payouts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('payout', 'fee', 'reversal')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    external_reference VARCHAR(255),
    gateway_response JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_created_at ON vendor_payouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_payment_methods_vendor_id ON vendor_payment_methods(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payment_methods_default ON vendor_payment_methods(vendor_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payout_transactions_payout_id ON payout_transactions(payout_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_vendor_payouts_updated_at ON vendor_payouts;
CREATE TRIGGER update_vendor_payouts_updated_at
    BEFORE UPDATE ON vendor_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_payment_methods_updated_at ON vendor_payment_methods;
CREATE TRIGGER update_vendor_payment_methods_updated_at
    BEFORE UPDATE ON vendor_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_payouts
DROP POLICY IF EXISTS "Vendors can view their own payouts" ON vendor_payouts;
CREATE POLICY "Vendors can view their own payouts"
    ON vendor_payouts FOR SELECT
    USING (
        auth.uid() = vendor_id 
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Vendors can create their own payout requests" ON vendor_payouts;
CREATE POLICY "Vendors can create their own payout requests"
    ON vendor_payouts FOR INSERT
    WITH CHECK (
        auth.uid() = vendor_id 
        AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'vendor'
        )
    );

DROP POLICY IF EXISTS "Only admins can update payouts" ON vendor_payouts;
CREATE POLICY "Only admins can update payouts"
    ON vendor_payouts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Vendors can delete their pending payouts" ON vendor_payouts;
CREATE POLICY "Vendors can delete their pending payouts"
    ON vendor_payouts FOR DELETE
    USING (
        auth.uid() = vendor_id 
        AND status = 'pending'
        AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'vendor'
        )
    );

-- Policies for vendor_payment_methods
DROP POLICY IF EXISTS "Vendors can manage their payment methods" ON vendor_payment_methods;
CREATE POLICY "Vendors can manage their payment methods"
    ON vendor_payment_methods FOR ALL
    USING (
        auth.uid() = vendor_id
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() = vendor_id
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for payout_transactions
DROP POLICY IF EXISTS "Users can view transactions for their payouts" ON payout_transactions;
CREATE POLICY "Users can view transactions for their payouts"
    ON payout_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vendor_payouts 
            WHERE id = payout_id 
            AND (
                vendor_id = auth.uid() 
                OR 
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Only admins can manage payout transactions" ON payout_transactions;
CREATE POLICY "Only admins can manage payout transactions"
    ON payout_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create a function to ensure only one default payment method per vendor
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this method as default, unset all others for this vendor
    IF NEW.is_default = true THEN
        UPDATE vendor_payment_methods 
        SET is_default = false 
        WHERE vendor_id = NEW.vendor_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default payment method constraint
DROP TRIGGER IF EXISTS ensure_single_default_payment_method_trigger ON vendor_payment_methods;
CREATE TRIGGER ensure_single_default_payment_method_trigger
    BEFORE INSERT OR UPDATE ON vendor_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payment_method();

-- Insert sample payment methods for testing (only if profiles exist)
DO $$
BEGIN
    -- Check if we have any vendor profiles first
    IF EXISTS (SELECT 1 FROM profiles WHERE role = 'vendor' LIMIT 1) THEN
        -- Insert sample payment methods for the first vendor
        INSERT INTO vendor_payment_methods (vendor_id, method_type, account_name, account_number, bank_name, is_default, is_verified)
        SELECT 
            id,
            'bank_transfer',
            'John Doe Business Account',
            '1234567890',
            'Bank of Kigali',
            true,
            true
        FROM profiles 
        WHERE role = 'vendor' 
        LIMIT 1
        ON CONFLICT DO NOTHING;

        -- Insert mobile money option
        INSERT INTO vendor_payment_methods (vendor_id, method_type, account_name, mobile_number, is_default, is_verified)
        SELECT 
            id,
            'mobile_money',
            'John Doe',
            '+250788123456',
            false,
            true
        FROM profiles 
        WHERE role = 'vendor' 
        LIMIT 1
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Create a view for payout summaries
CREATE OR REPLACE VIEW vendor_payout_summary AS
SELECT 
    v.vendor_id,
    COUNT(*) as total_payouts,
    COUNT(CASE WHEN v.status = 'pending' THEN 1 END) as pending_payouts,
    COUNT(CASE WHEN v.status = 'processing' THEN 1 END) as processing_payouts,
    COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_payouts,
    COUNT(CASE WHEN v.status = 'failed' THEN 1 END) as failed_payouts,
    COALESCE(SUM(v.amount), 0) as total_amount,
    COALESCE(SUM(CASE WHEN v.status = 'completed' THEN v.amount ELSE 0 END), 0) as total_paid,
    COALESCE(SUM(CASE WHEN v.status = 'pending' THEN v.amount ELSE 0 END), 0) as pending_amount,
    MAX(v.created_at) as last_payout_request,
    MAX(v.processed_at) as last_payout_processed
FROM vendor_payouts v
GROUP BY v.vendor_id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON vendor_payouts TO authenticated;
GRANT ALL ON vendor_payment_methods TO authenticated;
GRANT ALL ON payout_transactions TO authenticated;
GRANT SELECT ON vendor_payout_summary TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE vendor_payouts IS 'Stores vendor payout requests and their processing status';
COMMENT ON TABLE vendor_payment_methods IS 'Stores vendor payment method details for payouts';
COMMENT ON TABLE payout_transactions IS 'Tracks individual transactions within payouts for audit trail';
COMMENT ON VIEW vendor_payout_summary IS 'Provides aggregated payout statistics per vendor';
