-- Rwanda Localization: Add Rwanda-specific location data and currency updates

-- Create Rwanda administrative divisions tables
CREATE TABLE IF NOT EXISTS rwanda_provinces (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  name_rw VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rwanda_districts (
  id SERIAL PRIMARY KEY,
  province_id INTEGER REFERENCES rwanda_provinces(id),
  name_en VARCHAR(100) NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  name_rw VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rwanda_sectors (
  id SERIAL PRIMARY KEY,
  district_id INTEGER REFERENCES rwanda_districts(id),
  name_en VARCHAR(100) NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  name_rw VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rwanda_cells (
  id SERIAL PRIMARY KEY,
  sector_id INTEGER REFERENCES rwanda_sectors(id),
  name_en VARCHAR(100) NOT NULL,
  name_fr VARCHAR(100) NOT NULL,
  name_rw VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Rwanda provinces
INSERT INTO rwanda_provinces (name_en, name_fr, name_rw) VALUES
('Kigali City', 'Ville de Kigali', 'Umujyi wa Kigali'),
('Eastern Province', 'Province de l''Est', 'Intara y''Iburasirazuba'),
('Northern Province', 'Province du Nord', 'Intara y''Amajyaruguru'),
('Southern Province', 'Province du Sud', 'Intara y''Amajyepfo'),
('Western Province', 'Province de l''Ouest', 'Intara y''Iburengerazuba');

-- Insert major districts for each province
INSERT INTO rwanda_districts (province_id, name_en, name_fr, name_rw) VALUES
-- Kigali City
(1, 'Gasabo', 'Gasabo', 'Gasabo'),
(1, 'Kicukiro', 'Kicukiro', 'Kicukiro'),
(1, 'Nyarugenge', 'Nyarugenge', 'Nyarugenge'),

-- Eastern Province
(2, 'Rwamagana', 'Rwamagana', 'Rwamagana'),
(2, 'Kayonza', 'Kayonza', 'Kayonza'),
(2, 'Kirehe', 'Kirehe', 'Kirehe'),
(2, 'Ngoma', 'Ngoma', 'Ngoma'),
(2, 'Bugesera', 'Bugesera', 'Bugesera'),
(2, 'Gatsibo', 'Gatsibo', 'Gatsibo'),
(2, 'Nyagatare', 'Nyagatare', 'Nyagatare'),

-- Northern Province
(3, 'Rulindo', 'Rulindo', 'Rulindo'),
(3, 'Gakenke', 'Gakenke', 'Gakenke'),
(3, 'Musanze', 'Musanze', 'Musanze'),
(3, 'Burera', 'Burera', 'Burera'),
(3, 'Gicumbi', 'Gicumbi', 'Gicumbi'),

-- Southern Province
(4, 'Nyanza', 'Nyanza', 'Nyanza'),
(4, 'Gisagara', 'Gisagara', 'Gisagara'),
(4, 'Nyaruguru', 'Nyaruguru', 'Nyaruguru'),
(4, 'Huye', 'Huye', 'Huye'),
(4, 'Nyamagabe', 'Nyamagabe', 'Nyamagabe'),
(4, 'Ruhango', 'Ruhango', 'Ruhango'),
(4, 'Muhanga', 'Muhanga', 'Muhanga'),
(4, 'Kamonyi', 'Kamonyi', 'Kamonyi'),

-- Western Province
(5, 'Karongi', 'Karongi', 'Karongi'),
(5, 'Rutsiro', 'Rutsiro', 'Rutsiro'),
(5, 'Rubavu', 'Rubavu', 'Rubavu'),
(5, 'Nyabihu', 'Nyabihu', 'Nyabihu'),
(5, 'Ngororero', 'Ngororero', 'Ngororero'),
(5, 'Rusizi', 'Rusizi', 'Rusizi'),
(5, 'Nyamasheke', 'Nyamasheke', 'Nyamasheke');

-- Insert sample sectors for major districts
INSERT INTO rwanda_sectors (district_id, name_en, name_fr, name_rw) VALUES
-- Gasabo District
(1, 'Kinyinya', 'Kinyinya', 'Kinyinya'),
(1, 'Ndera', 'Ndera', 'Ndera'),
(1, 'Remera', 'Remera', 'Remera'),
(1, 'Kimironko', 'Kimironko', 'Kimironko'),
(1, 'Gikomero', 'Gikomero', 'Gikomero'),

-- Kicukiro District
(2, 'Niboye', 'Niboye', 'Niboye'),
(2, 'Kicukiro', 'Kicukiro', 'Kicukiro'),
(2, 'Gahanga', 'Gahanga', 'Gahanga'),
(2, 'Kanombe', 'Kanombe', 'Kanombe'),

-- Nyarugenge District
(3, 'Nyarugenge', 'Nyarugenge', 'Nyarugenge'),
(3, 'Kigali', 'Kigali', 'Kigali'),
(3, 'Nyamirambo', 'Nyamirambo', 'Nyamirambo'),
(3, 'Kimisagara', 'Kimisagara', 'Kimisagara');

-- Insert sample cells for major sectors
INSERT INTO rwanda_cells (sector_id, name_en, name_fr, name_rw) VALUES
-- Kinyinya Sector
(1, 'Kagugu', 'Kagugu', 'Kagugu'),
(1, 'Kibagabaga', 'Kibagabaga', 'Kibagabaga'),
(1, 'Kinyinya', 'Kinyinya', 'Kinyinya'),
(1, 'Ketukido', 'Ketukido', 'Ketukido'),
(1, 'Kanumbai', 'Kanumbai', 'Kanumbai'),
(1, 'Kissa', 'Kissa', 'Kissa'),

-- Remera Sector
(3, 'Remera', 'Remera', 'Remera'),
(3, 'Rukiri I', 'Rukiri I', 'Rukiri I'),
(3, 'Rukiri II', 'Rukiri II', 'Rukiri II'),

-- Kimironko Sector
(4, 'Kimironko', 'Kimironko', 'Kimironko'),
(4, 'Bibare', 'Bibare', 'Bibare'),
(4, 'Kibagabaga', 'Kibagabaga', 'Kibagabaga');

-- Update vendor_stores table to use Rwanda locations
ALTER TABLE vendor_stores 
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS country,
ADD COLUMN IF NOT EXISTS province_id INTEGER REFERENCES rwanda_provinces(id),
ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES rwanda_districts(id),
ADD COLUMN IF NOT EXISTS sector_id INTEGER REFERENCES rwanda_sectors(id),
ADD COLUMN IF NOT EXISTS cell_id INTEGER REFERENCES rwanda_cells(id),
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Remove old social media columns and website column
ALTER TABLE vendor_stores 
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS social_media_username,
DROP COLUMN IF EXISTS social_media_url;

-- Update products table to use RWF currency
ALTER TABLE products 
ALTER COLUMN price TYPE DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'RWF';

-- Update orders table for RWF
ALTER TABLE orders 
ALTER COLUMN total_amount TYPE DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'RWF';

-- Update order_items table for RWF
ALTER TABLE order_items 
ALTER COLUMN price TYPE DECIMAL(12,2),
ALTER COLUMN total_price TYPE DECIMAL(12,2);

-- Update payouts table for RWF
ALTER TABLE payouts 
ALTER COLUMN amount TYPE DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'RWF';

-- Create language preferences table
CREATE TABLE IF NOT EXISTS user_language_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE rwanda_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE rwanda_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rwanda_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rwanda_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for Rwanda location tables (public read access)
CREATE POLICY "Public read access for provinces" ON rwanda_provinces FOR SELECT USING (true);
CREATE POLICY "Public read access for districts" ON rwanda_districts FOR SELECT USING (true);
CREATE POLICY "Public read access for sectors" ON rwanda_sectors FOR SELECT USING (true);
CREATE POLICY "Public read access for cells" ON rwanda_cells FOR SELECT USING (true);

-- Create policies for language preferences
CREATE POLICY "Users can view own language preferences" ON user_language_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own language preferences" ON user_language_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own language preferences" ON user_language_preferences FOR UPDATE USING (auth.uid() = user_id);
