-- 009_update_social_media_and_locations.sql
-- Update social media structure and add Guantán allocation areas

-- Add Guantán allocation areas to rwanda_cells
INSERT INTO rwanda_cells (sector_id, name_en, name_fr, name_rw) VALUES
-- Adding Guantán allocation areas to Kinyinya Sector (assuming sector_id 1)
(1, 'Ketukido', 'Ketukido', 'Ketukido'),
(1, 'Kanumbai', 'Kanumbai', 'Kanumbai'), 
(1, 'Kissa', 'Kissa', 'Kissa')
ON CONFLICT DO NOTHING;

-- Update vendor_stores table to use individual social media platform columns
ALTER TABLE vendor_stores 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Migrate existing social media data (if any)
-- This will move any existing instagram URLs to the new instagram_url column
UPDATE vendor_stores 
SET instagram_url = social_media_url 
WHERE social_media_url LIKE '%instagram%' 
AND instagram_url IS NULL;

-- Remove old social media columns
ALTER TABLE vendor_stores 
DROP COLUMN IF EXISTS social_media_username,
DROP COLUMN IF EXISTS social_media_url;

-- Add comment for documentation
COMMENT ON COLUMN vendor_stores.facebook_url IS 'Facebook page URL for the vendor store';
COMMENT ON COLUMN vendor_stores.instagram_url IS 'Instagram profile URL for the vendor store';
COMMENT ON COLUMN vendor_stores.tiktok_url IS 'TikTok profile URL for the vendor store';
