import { ProductForm } from "@/components/dashboard/ProductForm";

export const metadata = { title: "Add New Product" };

export default function NewProductPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground mt-1">
          Upload images and our AI will automatically remove backgrounds and
          generate lifestyle shots.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
