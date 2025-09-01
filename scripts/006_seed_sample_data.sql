-- Sample data for development and testing

-- Insert sample admin user (this will be created when an admin signs up)
-- The trigger will handle profile creation, but we can update it after signup

-- Sample categories and initial data
INSERT INTO public.profiles (id, email, full_name, role, status) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@iwanyu.com', 'System Administrator', 'admin', 'active')
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Note: In a real application, you would not insert directly into profiles
-- Instead, users would sign up through the auth system and the trigger would create profiles
-- This is just for development purposes

-- Sample vendor store (will be created by vendors after they sign up)
-- Sample products, orders, etc. can be added here for testing
