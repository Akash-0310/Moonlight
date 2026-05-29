'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Instagram, Twitter, Facebook } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactInput = z.infer<typeof contactSchema>;

const contactDetails = [
  {
    icon: MapPin,
    label: 'Address',
    value: '123 Fashion Street, Mumbai, Maharashtra 400001',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+91 98765 43210',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@moonlight.in',
  },
  {
    icon: Clock,
    label: 'Hours',
    value: 'Mon–Sat, 9 AM – 6 PM IST',
  },
];

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (_data: ContactInput) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    reset();
  };

  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero — same style as About page ─────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[480px] flex items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=90"
          alt="Contact MoonLight"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-16 md:px-12">
          <p className="text-xs tracking-[0.35em] text-white/60 mb-3 uppercase">Get in Touch</p>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white leading-none">
            Contact Us
          </h1>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Contact info */}
          <div>
            <h2 className="text-2xl font-light mb-2">We&apos;d love to hear from you.</h2>
            <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
              Have a question about an order, a partnership inquiry, or just want to say hello?
              Reach out through any of the channels below or fill in the form.
            </p>

            <div className="space-y-6 mb-12">
              {contactDetails.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="mt-0.5 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full bg-black text-white">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">
                Follow Us
              </p>
              <div className="flex items-center gap-3">
                {[
                  { Icon: Instagram, href: '#', label: 'Instagram' },
                  { Icon: Twitter, href: '#', label: 'Twitter' },
                  { Icon: Facebook, href: '#', label: 'Facebook' },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-border hover:bg-black hover:text-white hover:border-black transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Contact form */}
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div>
                <label htmlFor="name" className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  disabled={isSubmitting}
                  placeholder="Your full name"
                  className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  disabled={isSubmitting}
                  placeholder="you@example.com"
                  className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  {...register('subject')}
                  disabled={isSubmitting}
                  placeholder="How can we help?"
                  className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
                {errors.subject && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-xs tracking-widest uppercase text-muted-foreground mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  {...register('message')}
                  disabled={isSubmitting}
                  placeholder="Tell us more..."
                  className="w-full border-b border-border bg-transparent py-2.5 text-sm outline-none focus:border-black transition-colors placeholder:text-muted-foreground/50 resize-none disabled:opacity-50"
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-3.5 text-xs tracking-[0.25em] uppercase font-medium hover:bg-black/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
