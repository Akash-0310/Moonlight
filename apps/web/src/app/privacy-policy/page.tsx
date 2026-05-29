import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — MoonLight' };

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen text-[#111]">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <p className="text-[10px] tracking-[0.35em] uppercase text-[#888] mb-3">Legal</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#888] mb-12">Last updated: January 2026</p>

        {[
          {
            title: '1. Information We Collect',
            body: 'We collect information you provide when creating an account, placing an order, or contacting us — including your name, email address, shipping address, and payment details. We also collect browsing data such as pages visited, items viewed, and device information to improve your experience.',
          },
          {
            title: '2. How We Use Your Information',
            body: 'Your information is used to process orders, send order confirmations and shipping updates, personalise your shopping experience, and communicate offers or updates you have opted into. We do not sell your personal data to third parties.',
          },
          {
            title: '3. Cookies',
            body: 'We use cookies to keep you signed in, remember your cart, and understand how visitors use our site. You can control cookies through your browser settings. Disabling cookies may affect certain features of the site.',
          },
          {
            title: '4. Data Security',
            body: 'We implement industry-standard security measures including SSL encryption and secure payment processing. While we take all reasonable steps to protect your data, no method of transmission over the internet is 100% secure.',
          },
          {
            title: '5. Third-Party Services',
            body: 'We use trusted third-party services for payment processing, shipping, and analytics. These providers have their own privacy policies and are obligated to protect your data in accordance with applicable laws.',
          },
          {
            title: '6. Your Rights',
            body: 'You have the right to access, correct, or delete your personal data at any time. To exercise these rights or raise any privacy concern, please contact us at privacy@moonlight.com.',
          },
          {
            title: '7. Changes to This Policy',
            body: 'We may update this policy from time to time. Changes will be posted on this page with an updated date. Continued use of MoonLight after changes constitutes acceptance of the revised policy.',
          },
        ].map(({ title, body }) => (
          <div key={title} className="mb-10">
            <h2 className="text-base font-bold text-[#111] mb-3">{title}</h2>
            <p className="text-sm text-[#555] leading-relaxed">{body}</p>
          </div>
        ))}

        <div className="border-t border-[#eee] pt-10 mt-10">
          <p className="text-sm text-[#888]">
            Questions? <Link href="/contact" className="text-[#111] underline underline-offset-2 hover:text-[#c9a96e] transition-colors">Contact us</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
