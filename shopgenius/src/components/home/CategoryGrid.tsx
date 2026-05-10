import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function CategoryGrid() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .limit(8);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.slug}`}
          className="group flex flex-col items-center justify-center p-6 bg-muted hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-2xl border border-border hover:border-brand-200 transition-all text-center"
        >
          {cat.image_url && (
            <img
              src={cat.image_url}
              alt={cat.name}
              className="w-12 h-12 object-contain mb-3 group-hover:scale-110 transition-transform"
            />
          )}
          <span className="font-medium text-sm">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
