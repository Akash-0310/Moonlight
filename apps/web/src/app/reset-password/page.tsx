'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api/auth';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black tracking-tight text-[#111] mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-[#888] mb-6">
            This reset link is missing a token. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="bg-[#111] text-white text-xs font-bold tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 3000);
    } catch (err: unknown) {
      type AxiosLike = { response?: { data?: { message?: string } } };
      const msg = (err as AxiosLike)?.response?.data?.message;
      setError(msg ?? 'This link is invalid or has expired. Please request a new one.');
    } finally {
      setIsSubmitting(false);
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
          <span className="text-white text-sm tracking-[0.3em] uppercase font-light">MoonLight</span>
          <div>
            <h2 className="text-white text-4xl font-light leading-tight mb-3">
              Create your<br />new password.
            </h2>
            <p className="text-white/50 text-sm tracking-wide">Choose something strong and memorable.</p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-white">
        <div className="w-full max-w-sm">
          <p className="lg:hidden text-center text-xs tracking-[0.3em] uppercase text-muted-foreground mb-8">
            MoonLight
          </p>

          {success ? (
            <div className="space-y-6 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto" />
              <div>
                <h1 className="text-2xl font-light tracking-tight text-foreground mb-2">
                  Password Updated!
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset successfully. Redirecting you to sign in…
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block bg-black text-white text-xs tracking-[0.25em] uppercase font-medium px-8 py-3.5 hover:bg-black/80 transition-colors"
              >
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-light tracking-tight text-foreground mb-1.5">
                  New Password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter a new password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <label htmlFor="password" className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      disabled={isSubmitting}
                      placeholder="Min. 8 characters"
                      className="w-full border-b border-border bg-transparent py-2.5 pr-8 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-4 py-3">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !password || !confirm}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 text-xs tracking-[0.25em] uppercase font-medium hover:bg-black/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link href="/login" className="text-foreground font-medium hover:underline underline-offset-2">
                    Sign in
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
