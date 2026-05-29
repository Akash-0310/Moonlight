import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Size enum values available: XS | S | M | L | XL | XXL
type SizeEnum = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

interface ProductSeed {
  name: string;
  description: string;
  price: number;
  category: 'Men' | 'Women' | 'Kids';
  subCategory: 'Topwear' | 'Bottomwear' | 'Winterwear';
  isBestseller: boolean;
  imageUrl: string;
  cloudinaryId: string;
  variants: Array<{ size: SizeEnum; stock: number }>;
}

async function main() {
  console.log('Seeding database...');

  // ─── Users ────────────────────────────────────────────────────────────────

  const adminPassword = await hashPassword('Admin1234!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@moonlight.com' },
    update: {},
    create: {
      email: 'admin@moonlight.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'admin',
      isVerified: true,
    },
  });
  console.log('Created admin:', admin.email);

  const testPassword = await hashPassword('Test1234!');
  const testUser = await prisma.user.upsert({
    where: { email: 'test@moonlight.com' },
    update: {},
    create: {
      email: 'test@moonlight.com',
      passwordHash: testPassword,
      name: 'Test Customer',
      role: 'customer',
      isVerified: true,
    },
  });
  console.log('Created test user:', testUser.email);

  // ─── Products ─────────────────────────────────────────────────────────────

  const products: ProductSeed[] = [
    // ── Men's Topwear ──────────────────────────────────────────────────────
    {
      name: 'Classic Cotton T-Shirt',
      description:
        'A wardrobe staple crafted from 100% combed cotton for all-day comfort. Features a relaxed crew neck, short sleeves, and a clean, minimalist silhouette. Pre-shrunk fabric ensures a consistent fit wash after wash.',
      price: 499,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1598033-0d50?w=800&q=80',
      cloudinaryId: 'sample_men_tshirt_001',
      variants: [
        { size: 'S', stock: 30 },
        { size: 'M', stock: 50 },
        { size: 'L', stock: 45 },
        { size: 'XL', stock: 25 },
        { size: 'XXL', stock: 15 },
      ],
    },
    {
      name: 'Oxford Button-Down Shirt',
      description:
        'Timeless Oxford-weave shirt tailored for a smart-casual look. Made from breathable cotton blend with a button-down collar, chest pocket, and curved hem. Perfect for office days or weekend brunches.',
      price: 1299,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1584999475-1057?w=800&q=80',
      cloudinaryId: 'sample_men_shirt_002',
      variants: [
        { size: 'S', stock: 20 },
        { size: 'M', stock: 40 },
        { size: 'L', stock: 35 },
        { size: 'XL', stock: 18 },
        { size: 'XXL', stock: 10 },
      ],
    },
    {
      name: 'Slim Fit Chinos',
      description:
        'Versatile chinos cut from a stretch-cotton twill for a flattering slim fit. Features a mid-rise waist, tapered leg, and a clean flat front. Available in earthy tones that pair effortlessly with any top.',
      price: 1799,
      category: 'Men',
      subCategory: 'Bottomwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
      cloudinaryId: 'sample_men_chinos_003',
      variants: [
        { size: 'S', stock: 15 },
        { size: 'M', stock: 30 },
        { size: 'L', stock: 35 },
        { size: 'XL', stock: 25 },
        { size: 'XXL', stock: 12 },
      ],
    },
    {
      name: 'Quilted Winter Jacket',
      description:
        'Stay warm without bulk in this lightweight quilted jacket filled with recycled polyester insulation. Water-resistant shell, ribbed cuffs, and two zip pockets make it an ideal everyday outerwear piece for cold months.',
      price: 3499,
      category: 'Men',
      subCategory: 'Winterwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=800&q=80',
      cloudinaryId: 'sample_men_jacket_004',
      variants: [
        { size: 'S', stock: 12 },
        { size: 'M', stock: 20 },
        { size: 'L', stock: 18 },
        { size: 'XL', stock: 14 },
        { size: 'XXL', stock: 8 },
      ],
    },
    {
      name: 'Structured Blazer',
      description:
        'A sharp single-breasted blazer in a premium wool-blend fabric. Notch lapels, two-button closure, and a tailored silhouette deliver a polished look for business meetings or formal events. Fully lined interior.',
      price: 4999,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80',
      cloudinaryId: 'sample_men_blazer_005',
      variants: [
        { size: 'S', stock: 8 },
        { size: 'M', stock: 15 },
        { size: 'L', stock: 12 },
        { size: 'XL', stock: 10 },
        { size: 'XXL', stock: 5 },
      ],
    },

    // ── Women's ─────────────────────────────────────────────────────────────
    {
      name: 'Floral Summer Dress',
      description:
        'Light and breezy midi dress in an allover floral print on soft viscose fabric. Features a V-neckline, smocked back for stretch, and flowy A-line skirt. Ideal for beach outings, brunches, or garden parties.',
      price: 1599,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
      cloudinaryId: 'sample_women_dress_006',
      variants: [
        { size: 'XS', stock: 18 },
        { size: 'S', stock: 30 },
        { size: 'M', stock: 35 },
        { size: 'L', stock: 20 },
        { size: 'XL', stock: 10 },
      ],
    },
    {
      name: 'Cropped Knit Top',
      description:
        'Soft ribbed-knit crop top with a square neckline and subtle stretch for a comfortable fitted look. Pairs beautifully with high-waist jeans, skirts, or trousers. Machine washable and quick-drying.',
      price: 799,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&q=80',
      cloudinaryId: 'sample_women_top_007',
      variants: [
        { size: 'XS', stock: 22 },
        { size: 'S', stock: 38 },
        { size: 'M', stock: 30 },
        { size: 'L', stock: 15 },
        { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Pleated Midi Skirt',
      description:
        'Elegant pleated skirt in a fluid satin-finish fabric. Features an elasticated waistband for easy wearing and a calf-length hem that flows gracefully with movement. Dress up or down with ease.',
      price: 1199,
      category: 'Women',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1509631-9195?w=800&q=80',
      cloudinaryId: 'sample_women_skirt_008',
      variants: [
        { size: 'XS', stock: 14 },
        { size: 'S', stock: 25 },
        { size: 'M', stock: 28 },
        { size: 'L', stock: 18 },
        { size: 'XL', stock: 9 },
      ],
    },
    {
      name: 'Linen Relaxed Blouse',
      description:
        'Effortlessly chic blouse cut from pure washed linen — breathable, lightweight, and naturally textured. Oversized silhouette with a relaxed collar and rolled sleeve tabs. A go-to for warm-weather dressing.',
      price: 999,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1496747-1836?w=800&q=80',
      cloudinaryId: 'sample_women_blouse_009',
      variants: [
        { size: 'XS', stock: 16 },
        { size: 'S', stock: 28 },
        { size: 'M', stock: 32 },
        { size: 'L', stock: 20 },
        { size: 'XL', stock: 11 },
      ],
    },
    {
      name: 'Wool Blend Trench Coat',
      description:
        'Classic double-breasted trench coat in a warm wool-blend fabric. Storm flap, epaulettes, and a self-tie belt recreate the iconic silhouette. Fully lined and mid-thigh length for maximum coverage in cooler months.',
      price: 4499,
      category: 'Women',
      subCategory: 'Winterwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1548624313-0396886583e7?w=800&q=80',
      cloudinaryId: 'sample_women_coat_010',
      variants: [
        { size: 'XS', stock: 7 },
        { size: 'S', stock: 12 },
        { size: 'M', stock: 15 },
        { size: 'L', stock: 10 },
        { size: 'XL', stock: 5 },
      ],
    },
    {
      name: 'Graphic Print Hoodie',
      description:
        'Cozy fleece-lined hoodie with an oversized logo graphic on the chest. Made from a cotton-polyester blend with a kangaroo pocket, adjustable drawcord hood, and ribbed cuffs. Streetwear-ready comfort.',
      price: 1499,
      category: 'Men',
      subCategory: 'Winterwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=800&q=80',
      cloudinaryId: 'sample_men_hoodie_011',
      variants: [
        { size: 'S', stock: 25 },
        { size: 'M', stock: 40 },
        { size: 'L', stock: 38 },
        { size: 'XL', stock: 22 },
        { size: 'XXL', stock: 12 },
      ],
    },
    {
      name: 'Cargo Jogger Pants',
      description:
        'Modern utility joggers combining the comfort of a sweatpant with functional cargo pockets. Made from a durable cotton-blend fabric with an elastic waist, tapered leg, and zip-off side pockets.',
      price: 1399,
      category: 'Men',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
      cloudinaryId: 'sample_men_cargo_012',
      variants: [
        { size: 'S', stock: 18 },
        { size: 'M', stock: 28 },
        { size: 'L', stock: 30 },
        { size: 'XL', stock: 20 },
        { size: 'XXL', stock: 10 },
      ],
    },
    {
      name: 'Wrap Front Maxi Dress',
      description:
        'Effortlessly elegant wrap dress in a flowy crepe fabric. Deep V-neckline, adjustable tie waist, and a floor-grazing hem create a flattering, draped silhouette suitable for evenings out or special occasions.',
      price: 2199,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
      cloudinaryId: 'sample_women_maxi_013',
      variants: [
        { size: 'XS', stock: 10 },
        { size: 'S', stock: 18 },
        { size: 'M', stock: 22 },
        { size: 'L', stock: 14 },
        { size: 'XL', stock: 7 },
      ],
    },
    {
      name: 'High Waist Skinny Jeans',
      description:
        'Body-sculpting high-rise jeans in a four-way stretch denim for all-day comfort. Classic five-pocket styling with a zip fly, belt loops, and a tailored fit through the hips and thighs that tapers to the ankle.',
      price: 1899,
      category: 'Women',
      subCategory: 'Bottomwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1509631-9195?w=800&q=80',
      cloudinaryId: 'sample_women_jeans_014',
      variants: [
        { size: 'XS', stock: 20 },
        { size: 'S', stock: 32 },
        { size: 'M', stock: 28 },
        { size: 'L', stock: 18 },
        { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Puffer Vest',
      description:
        'Versatile quilted puffer vest filled with synthetic insulation for warmth without full-sleeve bulk. Zip-front closure, two hand pockets, and a packable design make it perfect for layering on transitional weather days.',
      price: 1999,
      category: 'Women',
      subCategory: 'Winterwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1548624313-0396886583e7?w=800&q=80',
      cloudinaryId: 'sample_women_vest_015',
      variants: [
        { size: 'XS', stock: 12 },
        { size: 'S', stock: 20 },
        { size: 'M', stock: 18 },
        { size: 'L', stock: 12 },
        { size: 'XL', stock: 6 },
      ],
    },

    // ── Kids (using XS–XL to match Size enum) ───────────────────────────────
    {
      name: 'Kids Dinosaur Hoodie',
      description:
        'Fun and cozy fleece hoodie featuring an all-over dinosaur print loved by little adventurers. Made from a soft cotton-polyester blend with a zip front, kangaroo pocket, and durable ribbed trims. Easy care and machine washable.',
      price: 799,
      category: 'Kids',
      subCategory: 'Winterwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1645458456724-8a8369240119?w=800&q=80',
      cloudinaryId: 'sample_kids_hoodie_016',
      variants: [
        { size: 'XS', stock: 25 },
        { size: 'S', stock: 30 },
        { size: 'M', stock: 28 },
        { size: 'L', stock: 20 },
        { size: 'XL', stock: 15 },
      ],
    },
    {
      name: 'Kids Graphic Tee Pack',
      description:
        'Set of two soft jersey T-shirts featuring playful graphic prints. Made from 100% combed cotton with a tagless label for itch-free comfort. Reinforced neckline and shoulder seams for extra durability during active play.',
      price: 599,
      category: 'Kids',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1519238-5869?w=800&q=80',
      cloudinaryId: 'sample_kids_tee_017',
      variants: [
        { size: 'XS', stock: 30 },
        { size: 'S', stock: 35 },
        { size: 'M', stock: 32 },
        { size: 'L', stock: 22 },
        { size: 'XL', stock: 14 },
      ],
    },
    {
      name: 'Kids Elastic Waist Trousers',
      description:
        'Comfortable pull-on trousers in a soft stretch-cotton fabric. Fully elasticated waistband for easy dressing, two side pockets, and a straight leg cut with just enough room for growing bodies. School or play ready.',
      price: 699,
      category: 'Kids',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1471286-9073?w=800&q=80',
      cloudinaryId: 'sample_kids_trousers_018',
      variants: [
        { size: 'XS', stock: 20 },
        { size: 'S', stock: 28 },
        { size: 'M', stock: 25 },
        { size: 'L', stock: 18 },
        { size: 'XL', stock: 12 },
      ],
    },
    {
      name: 'Girls Twirl Party Dress',
      description:
        'Adorable A-line dress with a soft cotton bodice and layered tulle skirt for maximum twirl factor. Bow detail at the waist, invisible back zip, and a fully lined interior keep little ones comfortable all day long.',
      price: 999,
      category: 'Kids',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1560070-7834?w=800&q=80',
      cloudinaryId: 'sample_kids_dress_019',
      variants: [
        { size: 'XS', stock: 18 },
        { size: 'S', stock: 22 },
        { size: 'M', stock: 20 },
        { size: 'L', stock: 14 },
        { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Boys Quilted Winter Jacket',
      description:
        'Warm and lightweight quilted jacket for boys, filled with synthetic insulation. Features a full-zip front, two zip pockets, and a stand-up collar to block the wind. Easy-wipe outer fabric handles playground mess with ease.',
      price: 1499,
      category: 'Kids',
      subCategory: 'Winterwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1645458456724-8a8369240119?w=800&q=80',
      cloudinaryId: 'sample_kids_jacket_020',
      variants: [
        { size: 'XS', stock: 14 },
        { size: 'S', stock: 20 },
        { size: 'M', stock: 18 },
        { size: 'L', stock: 12 },
        { size: 'XL', stock: 8 },
      ],
    },

    // ── Men – New 10 ─────────────────────────────────────────────────────────
    {
      name: 'Striped Oxford Shirt',
      description: 'Crisp cotton Oxford shirt with classic Bengal stripes. Features a button-down collar, chest pocket, and a slightly relaxed fit perfect for both office and weekend wear.',
      price: 1299,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&q=80',
      cloudinaryId: 'new_men_shirt_021',
      variants: [
        { size: 'S', stock: 20 }, { size: 'M', stock: 30 }, { size: 'L', stock: 28 }, { size: 'XL', stock: 18 }, { size: 'XXL', stock: 10 },
      ],
    },
    {
      name: 'Slim Fit Polo Shirt',
      description: 'Premium piqué cotton polo with a ribbed collar and two-button placket. A timeless wardrobe staple that pairs effortlessly with chinos or jeans for a smart-casual look.',
      price: 999,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800&q=80',
      cloudinaryId: 'new_men_polo_022',
      variants: [
        { size: 'S', stock: 25 }, { size: 'M', stock: 40 }, { size: 'L', stock: 35 }, { size: 'XL', stock: 20 }, { size: 'XXL', stock: 10 },
      ],
    },
    {
      name: 'Denim Bomber Jacket',
      description: 'Rugged denim bomber with a snap-button front, ribbed cuffs, and two side pockets. Washed for a lived-in look and feel. Layers effortlessly over hoodies or tees on cool days.',
      price: 2799,
      category: 'Men',
      subCategory: 'Winterwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1611817757591-c3f345024273?w=800&q=80',
      cloudinaryId: 'new_men_bomber_023',
      variants: [
        { size: 'S', stock: 12 }, { size: 'M', stock: 20 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 14 }, { size: 'XXL', stock: 6 },
      ],
    },
    {
      name: 'Tapered Cargo Pants',
      description: 'Utility-inspired cargo pants in a stretch-cotton twill with six functional pockets. Tapered leg and elasticated waistband keep them comfortable from morning to night.',
      price: 1599,
      category: 'Men',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1542406775-ade58c52d2e4?w=800&q=80',
      cloudinaryId: 'new_men_cargo_024',
      variants: [
        { size: 'S', stock: 15 }, { size: 'M', stock: 25 }, { size: 'L', stock: 22 }, { size: 'XL', stock: 18 }, { size: 'XXL', stock: 8 },
      ],
    },
    {
      name: 'Relaxed Linen Shirt',
      description: 'Breathable 100% linen shirt in a relaxed fit with a mandarin collar and drop shoulder. Naturally moisture-wicking and gets softer with every wash — your summer essential.',
      price: 1499,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1688111421205-a0a85415b224?w=800&q=80',
      cloudinaryId: 'new_men_linen_025',
      variants: [
        { size: 'S', stock: 18 }, { size: 'M', stock: 28 }, { size: 'L', stock: 24 }, { size: 'XL', stock: 16 }, { size: 'XXL', stock: 8 },
      ],
    },
    {
      name: 'Zip-Up Fleece Hoodie',
      description: 'Cosy mid-weight fleece hoodie with a full-zip front, kangaroo pockets, and a lined hood. The perfect layer for cool mornings or evening runs — soft, warm, and endlessly wearable.',
      price: 1899,
      category: 'Men',
      subCategory: 'Winterwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1673092147872-5ddb03194341?w=800&q=80',
      cloudinaryId: 'new_men_fleece_026',
      variants: [
        { size: 'S', stock: 20 }, { size: 'M', stock: 35 }, { size: 'L', stock: 30 }, { size: 'XL', stock: 22 }, { size: 'XXL', stock: 10 },
      ],
    },
    {
      name: 'Casual Bermuda Shorts',
      description: 'Lightweight cotton-blend Bermuda shorts with a mid-rise waist, zip fly, and two side pockets. Sits just above the knee for a clean, versatile look that works beach to brunch.',
      price: 999,
      category: 'Men',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1632682582909-2b3a2581eef7?w=800&q=80',
      cloudinaryId: 'new_men_shorts_027',
      variants: [
        { size: 'S', stock: 22 }, { size: 'M', stock: 32 }, { size: 'L', stock: 28 }, { size: 'XL', stock: 18 }, { size: 'XXL', stock: 8 },
      ],
    },
    {
      name: 'Ribbed Turtleneck Sweater',
      description: 'Fine-knit ribbed turtleneck in a wool-blend fabric with a slim fit and fold-over neckline. Wear it solo or as a layering piece under a blazer or coat for polished cold-weather style.',
      price: 2299,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1617331647819-2495792e53e4?w=800&q=80',
      cloudinaryId: 'new_men_turtle_028',
      variants: [
        { size: 'S', stock: 14 }, { size: 'M', stock: 22 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 14 }, { size: 'XXL', stock: 6 },
      ],
    },
    {
      name: 'Classic White Polo',
      description: 'Essential white polo crafted from breathable piqué cotton. Features a clean two-button placket, ribbed collar, and a timeless regular fit. Dress it up or down — a true capsule wardrobe piece.',
      price: 899,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?w=800&q=80',
      cloudinaryId: 'new_men_wpoло_029',
      variants: [
        { size: 'S', stock: 30 }, { size: 'M', stock: 45 }, { size: 'L', stock: 40 }, { size: 'XL', stock: 25 }, { size: 'XXL', stock: 12 },
      ],
    },
    {
      name: 'Oversized Graphic Tee',
      description: 'Dropped-shoulder graphic tee in a heavyweight 250gsm cotton jersey. Bold chest print, ribbed crewneck, and a boxy cut that is made for streetwear layering or relaxed everyday wear.',
      price: 799,
      category: 'Men',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80',
      cloudinaryId: 'new_men_gtee_030',
      variants: [
        { size: 'S', stock: 25 }, { size: 'M', stock: 38 }, { size: 'L', stock: 35 }, { size: 'XL', stock: 22 }, { size: 'XXL', stock: 10 },
      ],
    },

    // ── Women – New 10 ───────────────────────────────────────────────────────
    {
      name: 'Satin Slip Midi Dress',
      description: 'Fluid satin-feel midi dress with delicate adjustable straps, a V-neckline, and a bias-cut skirt that skims the body beautifully. Pair with heels for evenings or trainers for daytime cool.',
      price: 2199,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
      cloudinaryId: 'new_women_satin_031',
      variants: [
        { size: 'XS', stock: 16 }, { size: 'S', stock: 25 }, { size: 'M', stock: 28 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 10 },
      ],
    },
    {
      name: 'Oversized Power Blazer',
      description: 'Sharp tailored blazer with an oversized silhouette, padded shoulders, and a single-button closure. Wear open over a tee or buttoned as a standalone statement piece — versatile and powerful.',
      price: 3299,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800&q=80',
      cloudinaryId: 'new_women_blazer_032',
      variants: [
        { size: 'XS', stock: 12 }, { size: 'S', stock: 20 }, { size: 'M', stock: 22 }, { size: 'L', stock: 16 }, { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Ruffle Hem Blouse',
      description: 'Lightweight chiffon blouse with a delicate ruffle hem, V-neckline, and long sleeves with cuff buttons. The romantic silhouette tucks neatly into skirts or high-waist trousers.',
      price: 1199,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7?w=800&q=80',
      cloudinaryId: 'new_women_blouse_033',
      variants: [
        { size: 'XS', stock: 18 }, { size: 'S', stock: 28 }, { size: 'M', stock: 25 }, { size: 'L', stock: 16 }, { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Wide Leg Linen Trousers',
      description: 'Relaxed wide-leg trousers in a premium linen blend with a high-rise elasticated waist. Breathable, effortlessly chic, and flattering across all body types — your summer wardrobe hero.',
      price: 1699,
      category: 'Women',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=800&q=80',
      cloudinaryId: 'new_women_wide_034',
      variants: [
        { size: 'XS', stock: 15 }, { size: 'S', stock: 24 }, { size: 'M', stock: 22 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Open Knit Cardigan',
      description: 'Relaxed longline cardigan in an open-weave knit with drop shoulders and a draped open front. Layer over bralettes or camisoles for effortless boho-chic that works from day to evening.',
      price: 1899,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=800&q=80',
      cloudinaryId: 'new_women_cardi_035',
      variants: [
        { size: 'XS', stock: 14 }, { size: 'S', stock: 22 }, { size: 'M', stock: 20 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 7 },
      ],
    },
    {
      name: 'High-Waist Denim Shorts',
      description: 'Classic high-waist denim shorts with frayed hems, five-pocket styling, and a zip-fly closure. Medium-wash finish that pairs with everything from crop tops to oversized shirts.',
      price: 1299,
      category: 'Women',
      subCategory: 'Bottomwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=800&q=80',
      cloudinaryId: 'new_women_dshorts_036',
      variants: [
        { size: 'XS', stock: 20 }, { size: 'S', stock: 32 }, { size: 'M', stock: 28 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 10 },
      ],
    },
    {
      name: 'Quilted Down Puffer Jacket',
      description: 'Warm and lightweight puffer jacket filled with down insulation and a water-resistant outer shell. Channel-quilted design, zip pockets, and a high collar for full wind protection.',
      price: 3999,
      category: 'Women',
      subCategory: 'Winterwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=800&q=80',
      cloudinaryId: 'new_women_puffer_037',
      variants: [
        { size: 'XS', stock: 10 }, { size: 'S', stock: 18 }, { size: 'M', stock: 20 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Bodycon Mini Dress',
      description: 'Figure-hugging mini dress in a soft stretch fabric with a scoop neckline and sleeveless silhouette. Understated and confident — style with heels or ankle boots for a night out.',
      price: 1499,
      category: 'Women',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=800&q=80',
      cloudinaryId: 'new_women_bodycon_038',
      variants: [
        { size: 'XS', stock: 18 }, { size: 'S', stock: 26 }, { size: 'M', stock: 22 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 6 },
      ],
    },
    {
      name: 'Wool Blend Overcoat',
      description: 'Elegant longline overcoat in a premium wool-blend fabric with a notch lapel, single-breasted button closure, and two side pockets. Fully lined for warmth and a polished drape.',
      price: 5499,
      category: 'Women',
      subCategory: 'Winterwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
      cloudinaryId: 'new_women_overcoat_039',
      variants: [
        { size: 'XS', stock: 8 }, { size: 'S', stock: 14 }, { size: 'M', stock: 16 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 6 },
      ],
    },
    {
      name: 'Pleated Mini Skirt',
      description: 'Flirty pleated mini skirt with a high-rise elasticated waist and a swishy A-line silhouette. Available in a seasonal palette — pairs with everything from fitted tops to oversized knits.',
      price: 1199,
      category: 'Women',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5218b5f5b5?w=800&q=80',
      cloudinaryId: 'new_women_pskirt_040',
      variants: [
        { size: 'XS', stock: 20 }, { size: 'S', stock: 30 }, { size: 'M', stock: 28 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 10 },
      ],
    },

    // ── Kids – New 10 ────────────────────────────────────────────────────────
    {
      name: 'Boys Graphic Sweatshirt',
      description: 'Cosy cotton-fleece sweatshirt with a bold chest graphic and ribbed cuffs. Pre-shrunk and machine-washable — tough enough for school, soft enough for the sofa.',
      price: 799,
      category: 'Kids',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1622218286192-95f6a20083c7?w=800&q=80',
      cloudinaryId: 'new_kids_sweat_041',
      variants: [
        { size: 'XS', stock: 20 }, { size: 'S', stock: 28 }, { size: 'M', stock: 25 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 10 },
      ],
    },
    {
      name: 'Girls Floral Leggings',
      description: 'Soft stretch leggings in a vibrant all-over floral print. Full elasticated waistband, four-way stretch fabric, and a flatlock seam finish for maximum comfort during play.',
      price: 599,
      category: 'Kids',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=800&q=80',
      cloudinaryId: 'new_kids_leggings_042',
      variants: [
        { size: 'XS', stock: 25 }, { size: 'S', stock: 32 }, { size: 'M', stock: 28 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 12 },
      ],
    },
    {
      name: 'Kids Denim Dungarees',
      description: 'Classic denim dungarees with adjustable shoulder straps, a bib front pocket, and soft elasticated side panels for a comfortable fit. Easy press-stud fastenings at the legs.',
      price: 1299,
      category: 'Kids',
      subCategory: 'Bottomwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1670014541811-9b0ec280ed60?w=800&q=80',
      cloudinaryId: 'new_kids_dungarees_043',
      variants: [
        { size: 'XS', stock: 18 }, { size: 'S', stock: 24 }, { size: 'M', stock: 22 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Boys Cargo Shorts',
      description: 'Durable ripstop cargo shorts with an elasticated waistband, multiple utility pockets, and a straight-leg cut. Built for adventure — lightweight and quick-drying for outdoor play.',
      price: 699,
      category: 'Kids',
      subCategory: 'Bottomwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1560859259-fcf2b952aed8?w=800&q=80',
      cloudinaryId: 'new_kids_cshorts_044',
      variants: [
        { size: 'XS', stock: 22 }, { size: 'S', stock: 30 }, { size: 'M', stock: 26 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 10 },
      ],
    },
    {
      name: 'Girls Cozy Knit Cardigan',
      description: 'Soft chunky-knit cardigan with a button-through front, patch pockets, and a relaxed fit. Made from a gentle cotton-acrylic blend that is easy to care for and kind to skin.',
      price: 999,
      category: 'Kids',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1611428813653-aa606c998586?w=800&q=80',
      cloudinaryId: 'new_kids_cardigan_045',
      variants: [
        { size: 'XS', stock: 16 }, { size: 'S', stock: 22 }, { size: 'M', stock: 20 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Kids Tie-Dye Tee',
      description: 'Fun hand-dyed tie-dye tee in a soft single-jersey cotton. Unique colour pattern means every piece is one of a kind. Crew neck, short sleeves, and a relaxed easy-fit cut.',
      price: 499,
      category: 'Kids',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1622218286192-95f6a20083c7?w=800&q=80',
      cloudinaryId: 'new_kids_tiedye_046',
      variants: [
        { size: 'XS', stock: 28 }, { size: 'S', stock: 35 }, { size: 'M', stock: 30 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 12 },
      ],
    },
    {
      name: 'Boys Zip Tracksuit',
      description: 'Two-piece tracksuit with a full-zip hoodie top and matching jogger bottoms. Soft fleece lining, elasticated cuffs, and side pockets — great for sport, travel, or relaxed days.',
      price: 1799,
      category: 'Kids',
      subCategory: 'Winterwear',
      isBestseller: true,
      imageUrl: 'https://images.unsplash.com/photo-1632232963035-bc14755747c9?w=800&q=80',
      cloudinaryId: 'new_kids_tracksuit_047',
      variants: [
        { size: 'XS', stock: 15 }, { size: 'S', stock: 22 }, { size: 'M', stock: 20 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Girls Tulle Party Dress',
      description: 'Magical party dress with a satin bodice and multi-layered tulle skirt. Sparkle waistband, invisible zip at back, and a fully lined interior for all-day comfort during celebrations.',
      price: 1399,
      category: 'Kids',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1502451885777-16c98b07834a?w=800&q=80',
      cloudinaryId: 'new_kids_tulle_048',
      variants: [
        { size: 'XS', stock: 14 }, { size: 'S', stock: 20 }, { size: 'M', stock: 18 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 6 },
      ],
    },
    {
      name: 'Kids Hooded Rain Jacket',
      description: 'Waterproof rain jacket with taped seams, an adjustable hood, and reflective strips for visibility. Lightweight packable design rolls into its own pocket — ready for any weather.',
      price: 1699,
      category: 'Kids',
      subCategory: 'Winterwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&q=80',
      cloudinaryId: 'new_kids_rain_049',
      variants: [
        { size: 'XS', stock: 18 }, { size: 'S', stock: 25 }, { size: 'M', stock: 22 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 8 },
      ],
    },
    {
      name: 'Kids Striped Polo Tee',
      description: 'Classic striped polo in a soft jersey fabric with a three-button placket and ribbed collar. School-smart and playground-ready — easy wash and retains shape wash after wash.',
      price: 649,
      category: 'Kids',
      subCategory: 'Topwear',
      isBestseller: false,
      imageUrl: 'https://images.unsplash.com/photo-1560859259-fcf2b952aed8?w=800&q=80',
      cloudinaryId: 'new_kids_spolo_050',
      variants: [
        { size: 'XS', stock: 25 }, { size: 'S', stock: 32 }, { size: 'M', stock: 28 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 12 },
      ],
    },
  ];

  for (const product of products) {
    const slug = slugify(product.name);

    // Upsert the product record (no variants/images in update to avoid duplication)
    const existing = await prisma.product.findUnique({ where: { slug } });

    if (existing) {
      console.log(`Skipped (already exists): ${product.name}`);
      continue;
    }

    const created = await prisma.product.create({
      data: {
        name: product.name,
        slug,
        description: product.description,
        price: product.price,
        category: product.category,
        subCategory: product.subCategory,
        isBestseller: product.isBestseller,
        images: {
          create: [
            {
              url: product.imageUrl,
              cloudinaryId: product.cloudinaryId,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
        variants: {
          create: product.variants.map((v) => ({
            size: v.size,
            stock: v.stock,
          })),
        },
      },
    });

    console.log(`Created product: ${created.name} (${created.slug})`);
  }

  const bestsellersCount = products.filter((p) => p.isBestseller).length;

  console.log('\nSeed completed successfully.');
  console.log('  Users   : 2 (admin + test customer)');
  console.log(`  Products: ${products.length}`);
  console.log(`  Bestsellers: ${bestsellersCount}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
