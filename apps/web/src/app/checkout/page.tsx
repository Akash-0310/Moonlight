'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, CreditCard, Smartphone, Loader2, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth.store';
import { useCartStore } from '@/lib/store/cart.store';
import { ordersApi } from '@/lib/api/orders';
import type { CartItem } from '@/lib/api/cart';

// ─── Validation ───────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(4, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().regex(/^[+]?[\d\s\-().]{8,15}$/, 'Enter a valid phone number'),
});

type CheckoutInput = z.infer<typeof checkoutSchema>;

type PaymentMethod = 'cod' | 'stripe' | 'razorpay';

// ─── Input Field Component ────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-[0.2em] uppercase text-[#555] mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Payment Option ───────────────────────────────────────────────────────────

function PaymentOption({
  value,
  selected,
  onSelect,
  icon,
  label,
  description,
}: {
  value: PaymentMethod;
  selected: boolean;
  onSelect: (v: PaymentMethod) => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full flex items-center gap-4 p-4 border-2 transition-all duration-150 text-left ${
        selected
          ? 'border-[#111] bg-[#111] text-white'
          : 'border-[#e8e8e8] bg-white text-[#111] hover:border-[#111]'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          selected ? 'bg-white/10' : 'bg-[#f5f5f5]'
        }`}
      >
        <span className={selected ? 'text-white' : 'text-[#555]'}>{icon}</span>
      </div>
      <div>
        <p className="text-sm font-bold tracking-wide">{label}</p>
        <p className={`text-[11px] mt-0.5 ${selected ? 'text-white/60' : 'text-[#888]'}`}>
          {description}
        </p>
      </div>
      <div
        className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
          selected ? 'border-white bg-white' : 'border-[#ccc]'
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-[#111]" />}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const { items, isLoading: cartLoading, fetchCart, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: 'India',
      email: user?.email ?? '',
    },
  });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch cart
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#c9a96e]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!cartLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <ShoppingBag size={56} strokeWidth={1} className="text-[#ccc]" />
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#111] mb-2">
            Your cart is empty
          </h2>
          <p className="text-[#888] text-sm">Add items before checking out.</p>
        </div>
        <button
          onClick={() => router.push('/shop')}
          className="bg-[#111] text-white text-xs font-bold tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#333] transition-colors"
        >
          Shop Now
        </button>
      </div>
    );
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.product.price),
    0,
  );
  const deliveryFee = subtotal > 999 ? 0 : 10;
  const total = subtotal + deliveryFee;

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (data: CheckoutInput) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsPlacing(true);
    try {
      const result = await ordersApi.place({
        paymentMethod,
        items: items.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
        address: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          street: data.street,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          phone: data.phone,
        },
      });

      clearCart();

      // Handle payment gateway redirects
      if (paymentMethod === 'stripe' && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      if (paymentMethod === 'razorpay' && result.razorpayOrderId) {
        toast.info('Razorpay integration coming soon');
        router.replace('/orders');
        return;
      }

      toast.success('Order placed successfully!');
      router.replace('/orders');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      toast.error(message);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-[#f0f0f0] px-6 md:px-12 lg:px-16 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#c9a96e] text-[10px] font-bold tracking-[0.4em] uppercase mb-0.5">
              MoonLight
            </p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#111]">
              CHECKOUT
            </h1>
          </div>
          <button
            className="lg:hidden flex items-center gap-2 text-sm font-semibold text-[#111]"
            onClick={() => setShowSummary((v) => !v)}
          >
            Order Summary
            {showSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Mobile order summary toggle */}
        {showSummary && (
          <div className="lg:hidden max-w-7xl mx-auto mt-4 pt-4 border-t border-[#f0f0f0]">
            <MobileSummary items={items} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">

            {/* ── LEFT: Address + Payment ─────────────────────────────── */}
            <div className="space-y-8">

              {/* Delivery Address */}
              <div className="bg-white border border-[#f0f0f0] p-6 md:p-8">
                <h2 className="text-xs font-bold tracking-[0.35em] uppercase text-[#111] mb-6 pb-4 border-b border-[#ebebeb]">
                  Delivery Address
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First Name" error={errors.firstName?.message}>
                    <input
                      {...register('firstName')}
                      placeholder="Rahul"
                      className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </Field>

                  <Field label="Last Name" error={errors.lastName?.message}>
                    <input
                      {...register('lastName')}
                      placeholder="Sharma"
                      className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </Field>

                  <Field label="Email" error={errors.email?.message}>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </Field>

                  <Field label="Phone" error={errors.phone?.message}>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Street Address" error={errors.street?.message}>
                      <input
                        {...register('street')}
                        placeholder="123, MG Road, Apartment 4B"
                        className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                      />
                    </Field>
                  </div>

                  <Field label="City" error={errors.city?.message}>
                    <input
                      {...register('city')}
                      placeholder="Mumbai"
                      className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </Field>

                  <Field label="State" error={errors.state?.message}>
                    <input
                      {...register('state')}
                      placeholder="Maharashtra"
                      className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </Field>

                  <Field label="ZIP / PIN Code" error={errors.zipCode?.message}>
                    <input
                      {...register('zipCode')}
                      placeholder="400001"
                      className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </Field>

                  <Field label="Country" error={errors.country?.message}>
                    <input
                      {...register('country')}
                      placeholder="India"
                      className="w-full border border-[#e8e8e8] bg-[#fafafa] px-3 py-2.5 text-sm text-[#111] placeholder:text-[#bbb] outline-none focus:border-[#c9a96e] transition-colors"
                    />
                  </Field>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-[#f0f0f0] p-6 md:p-8">
                <h2 className="text-xs font-bold tracking-[0.35em] uppercase text-[#111] mb-6 pb-4 border-b border-[#ebebeb]">
                  Payment Method
                </h2>

                <div className="space-y-3">
                  <PaymentOption
                    value="cod"
                    selected={paymentMethod === 'cod'}
                    onSelect={setPaymentMethod}
                    icon={<Package size={18} />}
                    label="Cash on Delivery"
                    description="Pay when your order arrives"
                  />
                  <PaymentOption
                    value="stripe"
                    selected={paymentMethod === 'stripe'}
                    onSelect={setPaymentMethod}
                    icon={<CreditCard size={18} />}
                    label="Pay Online"
                    description="Visa, Mastercard, Debit Card via Stripe"
                  />
                  <PaymentOption
                    value="razorpay"
                    selected={paymentMethod === 'razorpay'}
                    onSelect={setPaymentMethod}
                    icon={<Smartphone size={18} />}
                    label="UPI / Razorpay"
                    description="Pay via UPI, Net Banking, or Wallet"
                  />
                </div>
              </div>
            </div>

            {/* ── RIGHT: Order Summary ──────────────────────────────────── */}
            <div className="hidden lg:block sticky top-6">
              <div className="bg-white border border-[#f0f0f0] p-6 md:p-8">
                <h2 className="text-xs font-bold tracking-[0.35em] uppercase text-[#111] mb-6 pb-4 border-b border-[#ebebeb]">
                  Order Summary
                </h2>

                {/* Items */}
                <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                  {items.map((item) => {
                    const img =
                      item.product.images.find((i) => i.isPrimary)?.url ??
                      item.product.images[0]?.url ??
                      '';
                    return (
                      <div key={item.id} className="flex gap-3 items-start">
                        <div className="relative w-14 h-14 shrink-0 bg-[#f5f5f5] overflow-hidden">
                          {img ? (
                            <Image src={img} alt={item.product.name} fill sizes="56px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag size={16} className="text-[#ccc]" />
                            </div>
                          )}
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#111] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#111] truncate">{item.product.name}</p>
                          <p className="text-[11px] text-[#888] mt-0.5">Size: {item.variant.size}</p>
                        </div>
                        <span className="text-xs font-bold text-[#111] shrink-0">
                          ₹{(item.quantity * parseFloat(item.product.price)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-4 border-t border-[#ebebeb] mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#555]">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#555]">Delivery</span>
                    <span className="font-semibold">
                      {deliveryFee === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-[#ebebeb]">
                    <span className="text-sm font-bold text-[#111]">Total</span>
                    <span className="text-lg font-black text-[#111]">
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  disabled={isPlacing}
                  className="w-full flex items-center justify-center gap-2 bg-[#111] text-white text-xs font-bold tracking-[0.25em] uppercase py-4 hover:bg-[#333] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPlacing && <Loader2 size={14} className="animate-spin" />}
                  {isPlacing ? 'Placing Order...' : 'Place Order'}
                </button>

                <p className="text-center text-[11px] text-[#aaa] tracking-wide mt-3">
                  By placing your order you agree to our terms.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Place Order Button */}
          <div className="lg:hidden mt-8">
            <button
              type="submit"
              disabled={isPlacing}
              className="w-full flex items-center justify-center gap-2 bg-[#111] text-white text-xs font-bold tracking-[0.25em] uppercase py-4 hover:bg-[#333] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPlacing && <Loader2 size={14} className="animate-spin" />}
              {isPlacing ? 'Placing Order...' : `Place Order — ₹${total.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Mobile Summary Helper ────────────────────────────────────────────────────

function MobileSummary({
  items,
  subtotal,
  deliveryFee,
  total,
}: {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const img =
          item.product.images.find((i) => i.isPrimary)?.url ??
          item.product.images[0]?.url ??
          '';
        return (
          <div key={item.id} className="flex gap-3 items-start">
            <div className="relative w-12 h-12 shrink-0 bg-[#f5f5f5] overflow-hidden">
              {img ? (
                <Image src={img} alt={item.product.name} fill sizes="48px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={14} className="text-[#ccc]" />
                </div>
              )}
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#111] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#111] truncate">{item.product.name}</p>
              <p className="text-[11px] text-[#888]">Size: {item.variant.size}</p>
            </div>
            <span className="text-xs font-bold text-[#111] shrink-0">
              ₹{(item.quantity * parseFloat(item.product.price)).toLocaleString('en-IN')}
            </span>
          </div>
        );
      })}
      <div className="border-t border-[#f0f0f0] pt-3 flex justify-between">
        <div className="text-sm text-[#555]">
          Subtotal: ₹{subtotal.toLocaleString('en-IN')}
          <span className="ml-3">
            Delivery: {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
          </span>
        </div>
        <span className="text-sm font-black text-[#111]">₹{total.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}
