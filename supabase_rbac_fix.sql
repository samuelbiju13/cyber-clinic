-- 1. Create or Replace Trigger Function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'patient')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Validation query template (Replace with your actual test account email)
-- UPDATE public.profiles 
-- SET role = 'doctor' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = '<your-test-email@example.com>');
