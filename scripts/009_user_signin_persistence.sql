-- Additional script to ensure user profile creation on sign-in
-- This handles the user request: "when someone signs in it keep it down the database"

-- Create or update the function that creates profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'vendor'),
    'active',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that automatically creates profiles on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also handle sign-ins by updating last_sign_in_at
CREATE OR REPLACE FUNCTION public.handle_user_signin()
RETURNS trigger AS $$
BEGIN
  -- Update the profile with latest sign-in information
  UPDATE public.profiles 
  SET 
    last_sign_in_at = NEW.last_sign_in_at,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  -- If profile doesn't exist (edge case), create it
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, role, status, full_name, last_sign_in_at, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'vendor'),
      'active',
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      NEW.last_sign_in_at,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      last_sign_in_at = EXCLUDED.last_sign_in_at,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sign-ins (updates to last_sign_in_at)
DROP TRIGGER IF EXISTS on_auth_user_signin ON auth.users;
CREATE TRIGGER on_auth_user_signin
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW 
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_signin();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Additional RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: System can insert profiles (for triggers)
CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Additional policy for admin users to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';
COMMENT ON FUNCTION public.handle_user_signin() IS 'Updates profile information when user signs in';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates profile for new users automatically';
COMMENT ON TRIGGER on_auth_user_signin ON auth.users IS 'Updates profile on user sign-in';
