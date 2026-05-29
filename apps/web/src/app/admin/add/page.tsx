'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { productsApi } from '@/lib/api/products';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;
type SizeKey = (typeof SIZES)[number];

interface SizeEntry {
  enabled: boolean;
  stock: number;
}

interface FormValues {
  name: string;
  description: string;
  price: number;
  category: 'Men' | 'Women' | 'Kids';
  subCategory: 'Topwear' | 'Bottomwear' | 'Winterwear';
  isBestseller: boolean;
  imageUrls: { url: string }[];
}

export default function AddProductPage() {
  const [sizeMap, setSizeMap] = useState<Record<SizeKey, SizeEntry>>(
    Object.fromEntries(SIZES.map((s) => [s, { enabled: false, stock: 0 }])) as Record<
      SizeKey,
      SizeEntry
    >,
  );
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrls: [{ url: '' }, { url: '' }, { url: '' }, { url: '' }],
    },
  });

  const { fields: imageFields } = useFieldArray({ control, name: 'imageUrls' });
  const watchedImages = watch('imageUrls');

  const toggleSize = (size: SizeKey) => {
    setSizeMap((prev) => ({
      ...prev,
      [size]: { ...prev[size], enabled: !prev[size].enabled },
    }));
  };

  const updateStock = (size: SizeKey, stock: number) => {
    setSizeMap((prev) => ({ ...prev, [size]: { ...prev[size], stock } }));
  };

  const onSubmit = async (data: FormValues) => {
    const variants = SIZES.filter((s) => sizeMap[s].enabled).map((s) => ({
      size: s,
      stock: sizeMap[s].stock,
    }));

    if (variants.length === 0) {
      toast.error('Select at least one size');
      return;
    }

    const images = data.imageUrls
      .map((img, i) => ({
        url: img.url.trim(),
        cloudinaryId: `manual_${Date.now()}_${i}`,
        isPrimary: i === 0,
        sortOrder: i,
      }))
      .filter((img) => img.url.length > 0);

    if (images.length === 0) {
      toast.error('Add at least one image URL');
      return;
    }

    setSubmitting(true);
    try {
      await productsApi.create({
        name: data.name,
        description: data.description,
        price: Number(data.price),
        category: data.category,
        subCategory: data.subCategory,
        isBestseller: data.isBestseller,
        images,
        variants,
      });
      toast.success('Product created successfully');
      reset();
      setSizeMap(
        Object.fromEntries(SIZES.map((s) => [s, { enabled: false, stock: 0 }])) as Record<
          SizeKey,
          SizeEntry
        >,
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create product';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-bold text-[#111] uppercase tracking-wide">Basic Information</h2>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name', { required: 'Product name is required' })}
            placeholder="e.g. Slim Fit Cotton Shirt"
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:border-[#c9a96e] transition-colors"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            placeholder="Describe the product..."
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:border-[#c9a96e] transition-colors resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            {...register('price', {
              required: 'Price is required',
              min: { value: 0, message: 'Price must be 0 or more' },
              valueAsNumber: true,
            })}
            placeholder="999"
            className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:border-[#c9a96e] transition-colors"
          />
          {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
        </div>

        {/* Category + SubCategory */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category')}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:border-[#c9a96e] transition-colors bg-white"
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Kids">Kids</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Sub-Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('subCategory')}
              className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm outline-none focus:border-[#c9a96e] transition-colors bg-white"
            >
              <option value="Topwear">Topwear</option>
              <option value="Bottomwear">Bottomwear</option>
              <option value="Winterwear">Winterwear</option>
            </select>
          </div>
        </div>

        {/* Bestseller */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('isBestseller')}
            className="w-4 h-4 accent-[#c9a96e]"
          />
          <span className="text-sm font-medium text-[#111]">Mark as Bestseller</span>
        </label>
      </div>

      {/* Sizes */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#111] uppercase tracking-wide">
          Sizes &amp; Stock
        </h2>
        <div className="space-y-3">
          {SIZES.map((size) => (
            <div key={size} className="flex items-center gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer min-w-[60px]">
                <input
                  type="checkbox"
                  checked={sizeMap[size].enabled}
                  onChange={() => toggleSize(size)}
                  className="w-4 h-4 accent-[#c9a96e]"
                />
                <span className="text-sm font-semibold text-[#111]">{size}</span>
              </label>
              {sizeMap[size].enabled && (
                <input
                  type="number"
                  min={0}
                  value={sizeMap[size].stock}
                  onChange={(e) => updateStock(size, parseInt(e.target.value, 10) || 0)}
                  placeholder="Stock qty"
                  className="w-32 border border-gray-200 rounded px-3 py-1.5 text-sm outline-none focus:border-[#c9a96e] transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#111] uppercase tracking-wide">
          Product Images (URL)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {imageFields.map((field, index) => {
            const currentUrl = watchedImages[index]?.url ?? '';
            return (
              <div key={field.id} className="space-y-2">
                <label className="block text-xs text-gray-500 font-medium">
                  Image {index + 1} {index === 0 && '(Primary)'}
                </label>
                <input
                  {...register(`imageUrls.${index}.url`)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-[#c9a96e] transition-colors"
                />
                {currentUrl ? (
                  <div className="relative w-full aspect-square bg-gray-50 rounded overflow-hidden border border-gray-100">
                    <Image
                      src={currentUrl}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-50 rounded border border-dashed border-gray-200 flex items-center justify-center">
                    <ImageIcon size={24} className="text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-[#111] text-white text-xs font-bold tracking-widest uppercase px-8 py-3 hover:bg-[#222] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          {submitting ? 'Creating...' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setSizeMap(
              Object.fromEntries(SIZES.map((s) => [s, { enabled: false, stock: 0 }])) as Record<
                SizeKey,
                SizeEntry
              >,
            );
          }}
          className="text-sm text-gray-500 hover:text-[#111] transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
