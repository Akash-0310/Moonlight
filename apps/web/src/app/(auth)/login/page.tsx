'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

function getFriendlyError(err: unknown): string {
  type AxiosLike = { response?: { status?: number; data?: { message?: string | string[] } } };
  const e = err as AxiosLike;
  const status = e?.response?.status;

  // Status-based human messages — never expose raw backend/axios text
  if (status === 401) return 'The email or password you entered is incorrect. Please try again.';
  if (status === 404) return 'No account found with that email address.';
  if (status === 429) return 'Too many attempts. Please wait a moment before trying again.';
  if (status && status >= 500) return 'Something went wrong on our end. Please try again in a moment.';
  return 'Unable to sign in. Please check your connection and try again.';
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const login = useAuthStore((s) => s.login);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);
    try {
      await login(data.email, data.password);
      router.replace(redirect);
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
              Dress the way<br />you want to<br />be addressed.
            </h2>
            <p className="text-white/50 text-sm tracking-wide">Premium fashion, curated for you.</p>
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
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="text-xs tracking-widest uppercase text-muted-foreground"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  onChange={() => setAuthError(null)}
                  className="w-full border-b border-border bg-transparent py-2.5 pr-8 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                className="h-3.5 w-3.5 rounded-sm border-border accent-black"
              />
              <label htmlFor="remember" className="text-xs text-muted-foreground select-none">
                Remember me
              </label>
            </div>

            {/* Auth error banner */}
            {authError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" strokeWidth={2} />
                <p className="text-xs text-red-700 leading-relaxed">{authError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 text-xs tracking-[0.25em] uppercase font-medium hover:bg-black/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-foreground font-medium hover:underline underline-offset-2">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
