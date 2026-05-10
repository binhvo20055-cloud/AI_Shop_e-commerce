import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReviewSectionProps {
  productId: string;
}

export async function ReviewSection({ productId }: ReviewSectionProps) {
  const supabase = createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles(full_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(10);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <section className="mt-16" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-2xl font-bold mb-6">
        Customer Reviews
        {reviews && reviews.length > 0 && (
          <span className="ml-3 text-lg font-normal text-muted-foreground">
            ({reviews.length} reviews · {avgRating.toFixed(1)} avg)
          </span>
        )}
      </h2>

      {!reviews || reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 border border-border rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {(review as any).profiles?.full_name ?? "Anonymous"}
                </span>
                {review.is_verified_purchase && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    Verified Purchase
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDate(new Date(review.created_at ?? Date.now()))}
                </span>
              </div>
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
