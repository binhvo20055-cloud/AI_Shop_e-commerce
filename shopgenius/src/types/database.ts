export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          description: string;
          price: number;
          compare_at_price: number | null;
          stock: number;
          sku: string | null;
          category_id: string | null;
          merchant_id: string;
          images: string[];
          processed_images: string[];
          audio_description_url: string | null;
          is_active: boolean;
          metadata: Json;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          image_url: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          merchant_id: string;
          status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded";
          total_amount: number;
          stripe_payment_intent_id: string | null;
          stripe_invoice_id: string | null;
          shipping_address: Json;
          items: Json;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          created_at: string;
          product_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          is_verified_purchase: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      merchants: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          store_name: string;
          store_slug: string;
          description: string | null;
          logo_url: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: "active" | "trialing" | "past_due" | "cancelled" | null;
          plan: "starter" | "pro" | "enterprise";
        };
        Insert: Omit<Database["public"]["Tables"]["merchants"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["merchants"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          updated_at: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string;
          role: "customer" | "merchant" | "admin";
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
