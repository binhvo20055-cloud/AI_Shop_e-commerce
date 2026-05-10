-- ============================================
-- Migration 004: RPC Functions
-- ============================================

-- Atomic stock decrement (prevents oversell)
CREATE OR REPLACE FUNCTION public.decrement_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - p_quantity
  WHERE id = p_product_id
    AND stock >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrement_stock(UUID, INTEGER) FROM anon, authenticated;

-- Full-text product search with filters
CREATE OR REPLACE FUNCTION public.search_products(
  p_query TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_sort TEXT DEFAULT 'newest',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, name TEXT, description TEXT, price NUMERIC,
  compare_at_price NUMERIC, stock INTEGER, images TEXT[],
  processed_images TEXT[], audio_description_url TEXT,
  category_id UUID, merchant_id UUID, created_at TIMESTAMPTZ, rank REAL
)
LANGUAGE plpgsql STABLE SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.description, p.price, p.compare_at_price,
    p.stock, p.images, p.processed_images, p.audio_description_url,
    p.category_id, p.merchant_id, p.created_at,
    CASE
      WHEN p_query IS NOT NULL
      THEN ts_rank(to_tsvector('english', p.name || ' ' || p.description),
                   websearch_to_tsquery('english', p_query))
      ELSE 1.0
    END AS rank
  FROM public.products p
  WHERE
    p.is_active = true
    AND (p_query IS NULL OR
         to_tsvector('english', p.name || ' ' || p.description)
         @@ websearch_to_tsquery('english', p_query))
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
  ORDER BY
    CASE WHEN p_sort = 'price_asc' THEN p.price END ASC NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN p.price END DESC NULLS LAST,
    CASE WHEN p_sort = 'relevance' AND p_query IS NOT NULL THEN
      ts_rank(to_tsvector('english', p.name || ' ' || p.description),
              websearch_to_tsquery('english', p_query))
    END DESC NULLS LAST,
    p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Merchant stats aggregation
CREATE OR REPLACE FUNCTION public.get_merchant_stats(p_merchant_id UUID)
RETURNS TABLE (
  total_products BIGINT, active_products BIGINT,
  total_orders BIGINT, total_revenue NUMERIC,
  avg_order_value NUMERIC, pending_orders BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.products WHERE merchant_id = p_merchant_id),
    (SELECT COUNT(*) FROM public.products WHERE merchant_id = p_merchant_id AND is_active = true),
    (SELECT COUNT(*) FROM public.orders WHERE merchant_id = p_merchant_id AND status != 'cancelled'),
    COALESCE((SELECT SUM(total_amount) FROM public.orders
              WHERE merchant_id = p_merchant_id AND status IN ('confirmed','shipped','delivered')), 0),
    COALESCE((SELECT AVG(total_amount) FROM public.orders
              WHERE merchant_id = p_merchant_id AND status IN ('confirmed','shipped','delivered')), 0),
    (SELECT COUNT(*) FROM public.orders WHERE merchant_id = p_merchant_id AND status = 'pending');
END;
$$;
