'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Instagram, Twitter, Facebook, ArrowRight } from 'lucide-react';

const SHOP_LINKS = [
  { href: '/collection?category=Men', label: 'Men' },
  { href: '/collection?category=Women', label: 'Women' },
  { href: '/collection?category=Kids', label: 'Kids' },
  { href: '/collection?sort=newest', label: 'New Arrivals' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];

const SOCIAL_LINKS = [
  {
    href: 'https://instagram.com',
    label: 'Instagram',
    Icon: Instagram,
  },
  {
    href: 'https://twitter.com',
    label: 'Twitter / X',
    Icon: Twitter,
  },
  {
    href: 'https://facebook.com',
    label: 'Facebook',
    Icon: Facebook,
  },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || subscribed) return;
    setLoading(true);
    // Simulated subscribe — wire to real API endpoint when ready
    await new Promise((r) => setTimeout(r, 800));
    setSubscribed(true);
    setLoading(false);
  };

  return (
    <footer style={{ backgroundColor: '#111111' }} className="text-white">

      {/* Upper footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2 group mb-5 block">
              <span className="text-xl font-light text-white/40 group-hover:text-white/60 transition-colors">○</span>
              <span className="text-sm font-semibold tracking-[0.3em] uppercase text-white">
                Moon Light
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-white/50 mb-6 max-w-xs">
              Curated luxury fashion for those who value quality, craft, and understated elegance.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all duration-200"
                >
                  <Icon size={15} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-5">
              Shop
            </h3>
            <ul className="space-y-3">
              {SHOP_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-5">
              Company
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/40 mb-5">
              Newsletter
            </h3>
            <p className="text-sm text-white/50 mb-4 leading-relaxed">
              Be the first to know about new arrivals, exclusive offers, and style inspiration.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <span className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center text-[10px]">✓</span>
                You&apos;re subscribed — thank you.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-white text-gray-900 text-xs font-semibold tracking-wider uppercase rounded-lg px-4 py-2.5 hover:bg-white/90 disabled:opacity-60 transition-all duration-200 group"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-white/8" />
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>© 2026 MoonLight. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy-policy" className="hover:text-white/60 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-use" className="hover:text-white/60 transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
