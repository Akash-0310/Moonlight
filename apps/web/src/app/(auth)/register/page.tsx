'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';

function getFriendlyError(err: unknown): string {
  type AxiosLike = { response?: { status?: number; data?: { message?: string | string[] } } };
  const e = err as AxiosLike;
  const status = e?.response?.status;
  const raw = e?.response?.data?.message;

  // Use backend message directly if it exists and is user-friendly (non-5xx)
  if (raw && status && status < 500) {
    return Array.isArray(raw) ? raw[0] : raw;
  }

  if (status === 409) return 'An account with this email already exists. Try signing in instead.';
  if (status === 400) return 'Please check your details and try again.';
  if (status === 429) return 'Too many sign-up attempts. Please wait a moment before trying again.';
  if (status && status >= 500) return 'Something went wrong on our end. Please try again in a moment.';
  return 'Unable to create account. Please check your connection and try again.';
}

export default function RegisterPage() {
  const router = useRouter();
  const register_ = useAuthStore((s) => s.register);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setAuthError(null);
    try {
      await register_(data.name, data.email, data.password);
      router.replace('/');
    } catch (err: unknown) {
      setAuthError(getFriendlyError(err));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: editorial image */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
          alt="MoonLight fashion"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <span className="text-white text-sm tracking-[0.3em] uppercase font-light">
            MoonLight
          </span>
          <div>
            <h2 className="text-white text-4xl font-light leading-tight mb-3">
              Style is a way<br />to say who you<br />are without words.
            </h2>
            <p className="text-white/50 text-sm tracking-wide">Join 500,000+ fashion-forward shoppers.</p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <p className="lg:hidden text-center text-xs tracking-[0.3em] uppercase text-muted-foreground mb-8">
            MoonLight
          </p>

          <div className="mb-10">
            <h1 className="text-3xl font-light tracking-tight text-foreground mb-1.5">
              Create Account
            </h1>
            <p className="text-sm text-muted-foreground">Join MoonLight and discover your style.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="name"
                className="block text-xs tracking-widest uppercase text-muted-foreground mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register('name')}
                disabled={isSubmitting}
                placeholder="John Doe"
                className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs tracking-widest uppercase text-muted-foreground mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                disabled={isSubmitting}
                placeholder="you@example.com"
                onChange={() => setAuthError(null)}
                className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs tracking-widest uppercase text-muted-foreground mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                disabled={isSubmitting}
                placeholder="Min. 8 characters"
                className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs tracking-widest uppercase text-muted-foreground mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                disabled={isSubmitting}
                placeholder="••••••••"
                className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-0.5 h-3.5 w-3.5 rounded-sm border-border accent-black flex-shrink-0"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed select-none">
                I agree to the{' '}
                <Link href="/terms-of-use" className="text-foreground hover:underline underline-offset-2">
                  Terms of Service
                </Link>{' '}
                &amp;{' '}
                <Link href="/privacy-policy" className="text-foreground hover:underline underline-offset-2">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Auth error banner */}
            {authError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" strokeWidth={2} />
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Registration failed</p>
                  <p className="text-xs text-red-600 leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 text-xs tracking-[0.25em] uppercase font-medium hover:bg-black/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground font-medium hover:underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
