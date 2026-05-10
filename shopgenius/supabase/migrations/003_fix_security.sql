-- ============================================
-- Migration 003: Security Fixes
-- ============================================

-- Fix search_path for functions (security best practice)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Revoke direct execution from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Replace broad storage SELECT policies with scoped ones
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Product audio is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Merchant logos are publicly accessible" ON storage.objects;

CREATE POLICY "Users can view product images by name" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = 'products'
  );

CREATE POLICY "Users can view product audio by name" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'product-audio'
    AND (storage.foldername(name))[1] = 'audio'
  );

CREATE POLICY "Users can view merchant logos by name" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'merchant-logos'
    AND (storage.foldername(name))[1] = 'logos'
  );
