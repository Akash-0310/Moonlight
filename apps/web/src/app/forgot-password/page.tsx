'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await authApi.forgotPassword(email.trim().toLowerCase());
      setSuccess(res.message);
      // Development only: backend returns the URL directly
      if (res.resetUrl) setDevResetUrl(res.resetUrl);
    } catch {
      setError('Something went wrong. Please try again.');
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
              Forgot your<br />password?<br />No worries.
            </h2>
            <p className="text-white/50 text-sm tracking-wide">We&apos;ll send you a reset link.</p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-white">
        <div className="w-full max-w-sm">
          <p className="lg:hidden text-center text-xs tracking-[0.3em] uppercase text-muted-foreground mb-8">
            MoonLight
          </p>

          <div className="mb-10">
            <h1 className="text-3xl font-light tracking-tight text-foreground mb-1.5">
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your account email and we&apos;ll send you a reset link.
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              {/* Success state */}
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 px-4 py-4">
                <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-700 leading-relaxed">{success}</p>
              </div>

              {/* Dev-only: show clickable reset link */}
              {devResetUrl && (
                <div className="bg-amber-50 border border-amber-200 px-4 py-4 space-y-2">
                  <p className="text-xs font-bold tracking-widest uppercase text-amber-700">
                    Dev Mode — Reset Link
                  </p>
                  <p className="text-[11px] text-amber-600 break-all leading-relaxed">
                    {devResetUrl}
                  </p>
                  <Link
                    href={devResetUrl.replace(/^https?:\/\/[^/]+/, '')}
                    className="inline-block mt-1 text-xs font-bold text-amber-800 underline underline-offset-2"
                  >
                    Click to reset password →
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  disabled={isSubmitting}
                  placeholder="you@example.com"
                  className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 text-xs tracking-[0.25em] uppercase font-medium hover:bg-black/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
