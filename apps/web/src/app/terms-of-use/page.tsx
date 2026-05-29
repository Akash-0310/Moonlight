import Link from 'next/link';

export const metadata = { title: 'Terms of Use — MoonLight' };

export default function TermsOfUsePage() {
  return (
    <div className="bg-white min-h-screen text-[#111]">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <p className="text-[10px] tracking-[0.35em] uppercase text-[#888] mb-3">Legal</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Terms of Use</h1>
        <p className="text-sm text-[#888] mb-12">Last updated: January 2026</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By accessing or using MoonLight, you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not use our services.',
          },
          {
            title: '2. Use of the Site',
            body: 'You may use MoonLight for lawful personal shopping purposes only. You must not misuse our site by introducing viruses, attempting unauthorised access, or engaging in any conduct that disrupts or damages the site.',
          },
          {
            title: '3. Account Responsibility',
            body: 'When you create an account, you are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately if you suspect any unauthorised use.',
          },
          {
            title: '4. Orders and Payments',
            body: 'Placing an order constitutes an offer to purchase. We reserve the right to refuse or cancel orders at our discretion. All prices are inclusive of applicable taxes. Payment is processed securely through our third-party payment providers.',
          },
          {
            title: '5. Returns and Refunds',
            body: 'We offer a 30-day return policy for unused items in their original condition. Refunds are processed within 5–7 business days of receiving the returned item. Certain items may be excluded from returns — see our returns page for full details.',
          },
          {
            title: '6. Intellectual Property',
            body: 'All content on MoonLight — including images, text, logos, and design — is the property of MoonLight and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our written consent.',
          },
          {
            title: '7. Limitation of Liability',
            body: 'MoonLight shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site or inability to access it. Our total liability for any claim shall not exceed the amount paid for the relevant order.',
          },
          {
            title: '8. Governing Law',
            body: 'These terms are governed by the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Bangalore, Karnataka.',
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
