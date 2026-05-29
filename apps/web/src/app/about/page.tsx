import Image from 'next/image';

export const metadata = {
  title: 'About Us | MoonLight',
  description: 'Our story — premium fashion made accessible.',
};

const stats = [
  { value: '500K+', label: 'Customers' },
  { value: '10K+', label: 'Products' },
  { value: '50+', label: 'Brands' },
  { value: '5', label: 'Years' },
];

const values = [
  {
    title: 'Quality',
    description:
      'Every piece we curate meets exacting standards. We partner only with brands that share our commitment to craftsmanship and materials that stand the test of time.',
  },
  {
    title: 'Sustainability',
    description:
      'Fashion has a responsibility to the planet. We actively source from brands with ethical supply chains, sustainable fabrics, and transparent production practices.',
  },
  {
    title: 'Innovation',
    description:
      'From our personalised discovery engine to seamless checkout, we build technology that gets out of the way and lets the clothing speak for itself.',
  },
  {
    title: 'Customer First',
    description:
      'Every decision starts with one question: does this make the experience better for our customers? If the answer is no, we don\'t do it.',
  },
];

export default function AboutPage() {
  return (
    <main className="bg-white text-foreground">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] flex items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=80"
          alt="MoonLight editorial"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16 md:px-12">
          <p className="text-xs tracking-[0.35em] text-white/60 mb-3 uppercase">Est. 2019</p>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-white leading-none">
            OUR STORY
          </h1>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] text-muted-foreground mb-5 uppercase">
              Our Mission
            </p>
            <h2 className="text-3xl md:text-4xl font-light leading-snug mb-6">
              Premium fashion<br />made accessible.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              MoonLight was founded on a simple belief: exceptional style should not be a privilege.
              We built a destination where discerning shoppers can discover curated labels from
              across India and the world, delivered directly to their door.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              From quiet luxury to bold statements, our edit spans every mood and occasion.
              We do the curation so you can focus on the joy of wearing something truly special.
            </p>
          </div>
          <div className="relative h-80 md:h-[480px] rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"
              alt="Fashion editorial"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl md:text-5xl font-light mb-2">{s.value}</p>
                <p className="text-xs tracking-[0.3em] uppercase text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <p className="text-xs tracking-[0.3em] text-muted-foreground mb-4 uppercase">
          What We Stand For
        </p>
        <h2 className="text-3xl md:text-4xl font-light mb-16">Our Values</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          {values.map((v, i) => (
            <div key={v.title} className="border-t border-border pt-6">
              <p className="text-xs text-muted-foreground mb-3">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="text-lg font-medium mb-3">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand image */}
      <section className="relative h-64 md:h-96 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80"
          alt="MoonLight store"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <p className="text-white text-2xl md:text-4xl font-light tracking-[0.2em] uppercase">
            MoonLight
          </p>
        </div>
      </section>
    </main>
  );
}
