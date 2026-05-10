-- ============================================
-- Migration 005: Fix RLS Performance
-- ============================================

-- Wrap auth.uid() in (select ...) to avoid per-row re-evaluation

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- merchants
DROP POLICY IF EXISTS "Merchants can update own store" ON public.merchants;

CREATE POLICY "Merchants can update own store" ON public.merchants
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- products: merge overlapping SELECT policies
DROP POLICY IF EXISTS "Active products are publicly viewable" ON public.products;
DROP POLICY IF EXISTS "Merchants can manage own products" ON public.products;

CREATE POLICY "Products select policy" ON public.products
  FOR SELECT USING (
    is_active = true
    OR merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants can insert own products" ON public.products
  FOR INSERT WITH CHECK (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants can update own products" ON public.products
  FOR UPDATE USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Merchants can delete own products" ON public.products
  FOR DELETE USING (
    merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = (select auth.uid())
    )
  );

-- orders: merge overlapping SELECT policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Merchants can view their orders" ON public.orders;

CREATE POLICY "Orders select policy" ON public.orders
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR merchant_id IN (
      SELECT id FROM public.merchants WHERE user_id = (select auth.uid())
    )
  );

-- reviews
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Missing FK indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_merchants_user ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
