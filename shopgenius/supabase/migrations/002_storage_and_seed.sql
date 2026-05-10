-- ============================================
-- Migration 002: Storage Buckets + Seed Data
-- ============================================

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('product-audio', 'product-audio', true, 5242880, ARRAY['audio/mpeg','audio/mp3']),
  ('merchant-logos', 'merchant-logos', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Seed: Categories
INSERT INTO categories (id, name, slug, parent_id) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Electronics', 'electronics', NULL),
  ('11111111-0000-0000-0000-000000000002', 'Fashion', 'fashion', NULL),
  ('11111111-0000-0000-0000-000000000003', 'Home & Living', 'home-living', NULL),
  ('11111111-0000-0000-0000-000000000004', 'Sports & Outdoors', 'sports-outdoors', NULL),
  ('11111111-0000-0000-0000-000000000005', 'Beauty & Health', 'beauty-health', NULL),
  ('11111111-0000-0000-0000-000000000006', 'Books & Media', 'books-media', NULL),
  ('11111111-0000-0000-0000-000000000007', 'Smartphones', 'smartphones', '11111111-0000-0000-0000-000000000001'),
  ('11111111-0000-0000-0000-000000000008', 'Laptops', 'laptops', '11111111-0000-0000-0000-000000000001'),
  ('11111111-0000-0000-0000-000000000009', 'Audio', 'audio', '11111111-0000-0000-0000-000000000001'),
  ('11111111-0000-0000-0000-000000000010', 'Men''s Clothing', 'mens-clothing', '11111111-0000-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000011', 'Women''s Clothing', 'womens-clothing', '11111111-0000-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000012', 'Furniture', 'furniture', '11111111-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;
