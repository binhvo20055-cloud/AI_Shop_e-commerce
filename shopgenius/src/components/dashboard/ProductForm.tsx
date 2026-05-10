"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  lifestylePrompt: z.string().optional(),
  generateAudio: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

type Step =
  | { id: "idle" }
  | { id: "uploading"; label: string }
  | { id: "saving"; label: string }
  | { id: "bria"; label: string }
  | { id: "tts"; label: string }
  | { id: "done" }
  | { id: "error"; message: string };

export function ProductForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<Step>({ id: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { generateAudio: true },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (accepted) => setFiles(accepted),
    onDropRejected: () => toast.error("File too large or wrong format (max 10MB, JPG/PNG/WebP)"),
  });

  const onSubmit = async (data: ProductFormData) => {
    if (files.length === 0) {
      toast.error("Please upload at least one product image.");
      return;
    }

    const supabase = createClient();

    try {
      // ── 1. Upload raw images to Supabase Storage ──────────────────────
      setStep({ id: "uploading", label: `Uploading ${files.length} image(s)...` });
      const imageUrls: string[] = [];

      for (const file of files) {
        const path = `products/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: false });

        if (error) throw new Error(`Upload failed: ${error.message}`);

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);

        imageUrls.push(urlData.publicUrl);
      }

      // ── 2. Create product record ──────────────────────────────────────
      setStep({ id: "saving", label: "Saving product..." });

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice,
          stock: data.stock,
          sku: data.sku,
          categoryId: data.categoryId,
          images: imageUrls,
          merchantId: "placeholder", // Will be set server-side from auth
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create product");
      }

      const { product } = await res.json();

      // ── 3. Trigger AI pipeline (non-blocking) ─────────────────────────
      setStep({ id: "bria", label: "Processing images with Bria AI..." });

      const aiRes = await fetch("/api/ai/process-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          imageUrl: imageUrls[0],
          generateLifestyle: true,
          lifestylePrompt: data.lifestylePrompt || undefined,
          generateAudio: data.generateAudio,
          description: data.generateAudio ? data.description : undefined,
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        if (aiData.audioDescriptionUrl) {
          setStep({ id: "tts", label: "Audio description generated ✓" });
          await new Promise((r) => setTimeout(r, 800));
        }
      }

      setStep({ id: "done" });
      toast.success("Product created with AI enhancements! 🎉");
      reset();
      setFiles([]);

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/dashboard/products";
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setStep({ id: "error", message });
      toast.error(message);
    }
  };

  const isProcessing = step.id !== "idle" && step.id !== "done" && step.id !== "error";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Image Upload ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Product Images *
          <span className="ml-1 text-muted-foreground font-normal">(up to 5, max 10MB each)</span>
        </label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
              : "border-border hover:border-brand-300"
          }`}
        >
          <input {...getInputProps()} aria-label="Upload product images" />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Drop images here..."
              : "Drag & drop images, or click to select"}
          </p>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {files.map((f, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs rounded-lg"
                >
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Name ─────────────────────────────────────────────────────── */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Product Name *
        </label>
        <input
          id="name"
          {...register("name")}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
          placeholder="e.g. Premium Wireless Headphones"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* ── Description ──────────────────────────────────────────────── */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description *
          <span className="ml-1 text-muted-foreground font-normal text-xs">
            (also used for AI audio description)
          </span>
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={4}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background resize-none"
          placeholder="Describe your product in detail. This will also be converted to audio by ElevenLabs..."
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* ── Price & Stock ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-1">
            Price (USD) *
          </label>
          <input
            id="price"
            {...register("price")}
            type="number"
            step="0.01"
            min="0.01"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
            placeholder="29.99"
          />
          {errors.price && (
            <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="stock" className="block text-sm font-medium mb-1">
            Stock *
          </label>
          <input
            id="stock"
            {...register("stock")}
            type="number"
            min="0"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-background"
            placeholder="100"
          />
          {errors.stock && (
            <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>
          )}
        </div>
      </div>

      {/* ── AI Options ───────────────────────────────────────────────── */}
      <div className="space-y-4 p-4 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold">AI Enhancements</span>
        </div>

        {/* Lifestyle prompt */}
        <div>
          <label htmlFor="lifestylePrompt" className="block text-xs font-medium mb-1 text-muted-foreground">
            Bria AI — Lifestyle Shot Prompt (optional)
          </label>
          <input
            id="lifestylePrompt"
            {...register("lifestylePrompt")}
            className="w-full bg-white dark:bg-gray-900 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. modern kitchen counter, natural lighting, minimalist style"
          />
        </div>

        {/* Audio toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register("generateAudio")}
            className="w-4 h-4 rounded accent-brand-500"
          />
          <span className="text-sm">
            Generate audio description with{" "}
            <span className="font-medium text-brand-600 dark:text-brand-400">ElevenLabs TTS</span>
          </span>
        </label>
      </div>

      {/* ── Processing Status ─────────────────────────────────────────── */}
      {step.id !== "idle" && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            step.id === "done"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : step.id === "error"
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : "bg-muted border-border"
          }`}
        >
          {step.id === "done" ? (
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          ) : step.id === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-brand-500 shrink-0" />
          )}
          <span className="text-sm">
            {step.id === "done"
              ? "Product created successfully!"
              : step.id === "error"
              ? step.message
              : step.label}
          </span>
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isProcessing || step.id === "done"}
        className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : step.id === "done" ? (
          <>
            <CheckCircle className="h-4 w-4" />
            Done! Redirecting...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Create Product with AI
          </>
        )}
      </button>
    </form>
  );
}
