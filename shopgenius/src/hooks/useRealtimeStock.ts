"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to real-time stock updates for a product via Supabase Realtime.
 * Falls back to the initial stock value if subscription fails.
 */
export function useRealtimeStock(productId: string, initialStock: number) {
  const [stock, setStock] = useState(initialStock);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`stock:${productId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          const newStock = payload.new?.stock;
          if (typeof newStock === "number") {
            setStock(newStock);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return stock;
}
