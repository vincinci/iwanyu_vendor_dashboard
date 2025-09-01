-- Enhanced Order Management System for Iwanyu Platform
-- This script extends the existing order tables with additional features

-- Update orders table with additional fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address JSONB;

-- Create order_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_tracking table for delivery tracking
CREATE TABLE IF NOT EXISTS order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number VARCHAR(255) NOT NULL,
    carrier VARCHAR(100),
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    estimated_delivery TIMESTAMPTZ,
    actual_delivery TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_refunds table for refund management
CREATE TABLE IF NOT EXISTS order_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    reason VARCHAR(100) NOT NULL,
    refund_type VARCHAR(20) NOT NULL DEFAULT 'full' CHECK (refund_type IN ('full', 'partial', 'store_credit')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
    processed_by UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    customer_notes TEXT,
    external_reference VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Create order_reviews table for customer feedback
CREATE TABLE IF NOT EXISTS order_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    is_verified BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id, customer_id)
);

-- Create order_disputes table for handling order issues
CREATE TABLE IF NOT EXISTS order_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('not_received', 'damaged', 'wrong_item', 'quality_issue', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    resolution TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Create shipping_zones table for shipping calculations
CREATE TABLE IF NOT EXISTS shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    countries TEXT[] NOT NULL,
    provinces TEXT[],
    cities TEXT[],
    postal_codes TEXT[],
    base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    per_kg_rate DECIMAL(10,2) DEFAULT 0,
    free_shipping_threshold DECIMAL(10,2),
    delivery_days_min INTEGER DEFAULT 1,
    delivery_days_max INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_total ON orders(total);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_number ON order_tracking(tracking_number);
CREATE INDEX IF NOT EXISTS idx_order_refunds_order_id ON order_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_order_refunds_status ON order_refunds(status);
CREATE INDEX IF NOT EXISTS idx_order_reviews_vendor_id ON order_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_rating ON order_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_order_disputes_status ON order_disputes(status);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_order_tracking_updated_at ON order_tracking;
CREATE TRIGGER update_order_tracking_updated_at
    BEFORE UPDATE ON order_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_reviews_updated_at ON order_reviews;
CREATE TRIGGER update_order_reviews_updated_at
    BEFORE UPDATE ON order_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_zones_updated_at ON shipping_zones;
CREATE TRIGGER update_shipping_zones_updated_at
    BEFORE UPDATE ON shipping_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, notes)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.updated_by, 'System status change');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: We'll add updated_by field to orders table in a future migration
-- For now, we'll handle status logging in the application layer

-- Row Level Security Policies
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;

-- Policies for order_status_history
DROP POLICY IF EXISTS "Users can view status history for their orders" ON order_status_history;
CREATE POLICY "Users can view status history for their orders"
    ON order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND (
                customer_id = auth.uid()
                OR 
                EXISTS (
                    SELECT 1 FROM order_items oi
                    WHERE oi.order_id = orders.id 
                    AND oi.vendor_id = auth.uid()
                )
                OR 
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Admins and vendors can create status history" ON order_status_history;
CREATE POLICY "Admins and vendors can create status history"
    ON order_status_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'vendor')
        )
    );

-- Policies for order_tracking
DROP POLICY IF EXISTS "Users can view tracking for their orders" ON order_tracking;
CREATE POLICY "Users can view tracking for their orders"
    ON order_tracking FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND (
                customer_id = auth.uid()
                OR 
                EXISTS (
                    SELECT 1 FROM order_items oi
                    WHERE oi.order_id = orders.id 
                    AND oi.vendor_id = auth.uid()
                )
                OR 
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Admins and vendors can manage tracking" ON order_tracking;
CREATE POLICY "Admins and vendors can manage tracking"
    ON order_tracking FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'vendor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'vendor')
        )
    );

-- Policies for order_refunds
DROP POLICY IF EXISTS "Users can view refunds for their orders" ON order_refunds;
CREATE POLICY "Users can view refunds for their orders"
    ON order_refunds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND (
                customer_id = auth.uid()
                OR 
                EXISTS (
                    SELECT 1 FROM order_items oi
                    WHERE oi.order_id = orders.id 
                    AND oi.vendor_id = auth.uid()
                )
                OR 
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Customers can create refund requests" ON order_refunds;
CREATE POLICY "Customers can create refund requests"
    ON order_refunds FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND customer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage refunds" ON order_refunds;
CREATE POLICY "Admins can manage refunds"
    ON order_refunds FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for order_reviews
DROP POLICY IF EXISTS "Everyone can read published reviews" ON order_reviews;
CREATE POLICY "Everyone can read published reviews"
    ON order_reviews FOR SELECT
    USING (is_published = true);

DROP POLICY IF EXISTS "Customers can create reviews for their orders" ON order_reviews;
CREATE POLICY "Customers can create reviews for their orders"
    ON order_reviews FOR INSERT
    WITH CHECK (
        customer_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND customer_id = auth.uid()
            AND status = 'delivered'
        )
    );

DROP POLICY IF EXISTS "Users can update their own reviews" ON order_reviews;
CREATE POLICY "Users can update their own reviews"
    ON order_reviews FOR UPDATE
    USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid());

-- Policies for order_disputes
DROP POLICY IF EXISTS "Users can view disputes for their orders" ON order_disputes;
CREATE POLICY "Users can view disputes for their orders"
    ON order_disputes FOR SELECT
    USING (
        initiated_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND (
                customer_id = auth.uid()
                OR 
                EXISTS (
                    SELECT 1 FROM order_items oi
                    WHERE oi.order_id = orders.id 
                    AND oi.vendor_id = auth.uid()
                )
            )
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Customers can create disputes" ON order_disputes;
CREATE POLICY "Customers can create disputes"
    ON order_disputes FOR INSERT
    WITH CHECK (
        initiated_by = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_id 
            AND customer_id = auth.uid()
        )
    );

-- Policies for shipping_zones (admin only)
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON shipping_zones;
CREATE POLICY "Admins can manage shipping zones"
    ON shipping_zones FOR ALL
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

DROP POLICY IF EXISTS "Everyone can read active shipping zones" ON shipping_zones;
CREATE POLICY "Everyone can read active shipping zones"
    ON shipping_zones FOR SELECT
    USING (is_active = true);

-- Insert default shipping zones for Rwanda
INSERT INTO shipping_zones (name, description, countries, base_rate, free_shipping_threshold, delivery_days_min, delivery_days_max)
VALUES 
    ('Kigali City', 'Main city delivery zone', ARRAY['Rwanda'], 2.00, 50.00, 1, 2),
    ('Other Cities', 'Secondary cities', ARRAY['Rwanda'], 5.00, 75.00, 2, 4),
    ('Rural Areas', 'Rural and remote areas', ARRAY['Rwanda'], 8.00, 100.00, 3, 7),
    ('East Africa', 'Regional delivery', ARRAY['Uganda', 'Tanzania', 'Kenya', 'Burundi'], 15.00, 150.00, 5, 14)
ON CONFLICT DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW order_summary_view AS
SELECT 
    o.id,
    o.customer_id,
    o.status,
    o.total,
    o.created_at,
    o.updated_at,
    c.first_name || ' ' || c.last_name as customer_name,
    c.email as customer_email,
    COUNT(oi.id) as items_count,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    STRING_AGG(DISTINCT v.business_name, ', ') as vendor_names
FROM orders o
LEFT JOIN profiles c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN profiles v ON oi.vendor_id = v.id
LEFT JOIN order_reviews r ON o.id = r.order_id
GROUP BY o.id, o.customer_id, o.status, o.total, o.created_at, o.updated_at, c.first_name, c.last_name, c.email;

-- Create function to calculate shipping cost
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
    p_total DECIMAL,
    p_weight DECIMAL DEFAULT 1.0,
    p_country TEXT DEFAULT 'Rwanda',
    p_city TEXT DEFAULT 'Kigali'
)
RETURNS DECIMAL AS $$
DECLARE
    shipping_cost DECIMAL := 0;
    zone_record RECORD;
BEGIN
    -- Find the best matching shipping zone
    SELECT * INTO zone_record
    FROM shipping_zones
    WHERE is_active = true
    AND p_country = ANY(countries)
    AND (cities IS NULL OR p_city = ANY(cities))
    ORDER BY 
        CASE WHEN p_city = ANY(cities) THEN 1 ELSE 2 END,
        base_rate ASC
    LIMIT 1;
    
    IF zone_record IS NOT NULL THEN
        -- Check if order qualifies for free shipping
        IF p_total >= COALESCE(zone_record.free_shipping_threshold, 999999) THEN
            RETURN 0;
        END IF;
        
        -- Calculate shipping cost
        shipping_cost := zone_record.base_rate + (COALESCE(zone_record.per_kg_rate, 0) * p_weight);
    ELSE
        -- Default shipping cost if no zone found
        shipping_cost := 10.00;
    END IF;
    
    RETURN shipping_cost;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON order_status_history TO authenticated;
GRANT ALL ON order_tracking TO authenticated;
GRANT ALL ON order_refunds TO authenticated;
GRANT ALL ON order_reviews TO authenticated;
GRANT ALL ON order_disputes TO authenticated;
GRANT ALL ON shipping_zones TO authenticated;
GRANT SELECT ON order_summary_view TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE order_status_history IS 'Tracks all status changes for orders with timestamps and reasons';
COMMENT ON TABLE order_tracking IS 'Stores shipping and delivery tracking information';
COMMENT ON TABLE order_refunds IS 'Manages refund requests and processing';
COMMENT ON TABLE order_reviews IS 'Customer reviews and ratings for completed orders';
COMMENT ON TABLE order_disputes IS 'Handles order disputes and resolution process';
COMMENT ON TABLE shipping_zones IS 'Defines shipping zones and rates for different regions';
COMMENT ON FUNCTION calculate_shipping_cost IS 'Calculates shipping cost based on order total, weight, and destination';
