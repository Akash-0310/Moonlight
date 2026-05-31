import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  // ─── Men's Topwear ───────────────────────────────────────────────────────────
  {
    name: 'Classic White Oxford Shirt',
    slug: 'classic-white-oxford-shirt',
    description: 'A timeless white Oxford shirt crafted from 100% premium cotton. Perfect for both formal and smart-casual occasions. Features a button-down collar and chest pocket.',
    price: 1299, category: 'Men', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80'],
    sizes: [{ size: 'S', stock: 15 }, { size: 'M', stock: 20 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 12 }],
  },
  {
    name: 'Slim Fit Casual Shirt',
    slug: 'slim-fit-casual-shirt',
    description: 'Modern slim-fit casual shirt in a versatile blue check pattern. Made from breathable cotton-linen blend, ideal for weekend outings or relaxed office days.',
    price: 999, category: 'Men', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 25 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Essential Cotton T-Shirt',
    slug: 'essential-cotton-tshirt',
    description: 'The wardrobe staple you can never have too many of. Made from soft 180gsm combed cotton with a relaxed fit. Available in a rich dark color that stays vibrant after multiple washes.',
    price: 499, category: 'Men', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'],
    sizes: [{ size: 'S', stock: 30 }, { size: 'M', stock: 35 }, { size: 'L', stock: 30 }, { size: 'XL', stock: 20 }, { size: 'XXL', stock: 10 }],
  },
  {
    name: 'Premium Polo T-Shirt',
    slug: 'premium-polo-tshirt',
    description: 'Crafted from 100% pique cotton, this polo shirt offers both comfort and style. Features a two-button placket and ribbed collar. A versatile choice for any occasion.',
    price: 799, category: 'Men', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 10 }],
  },
  {
    name: 'Linen Casual Shirt',
    slug: 'linen-casual-shirt',
    description: 'Stay cool and stylish in this breathable linen shirt. Features a relaxed fit with a spread collar and roll-up sleeves. Perfect for summer days and beach vacations.',
    price: 1199, category: 'Men', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&q=80'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 14 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 6 }],
  },
  {
    name: 'Graphic Print Oversized Tee',
    slug: 'graphic-print-oversized-tee',
    description: 'Make a bold statement with this oversized graphic tee. Made from 100% cotton with a dropped shoulder design. Features a unique artistic print on the front.',
    price: 599, category: 'Men', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80'],
    sizes: [{ size: 'S', stock: 20 }, { size: 'M', stock: 28 }, { size: 'L', stock: 22 }, { size: 'XL', stock: 15 }],
  },
  {
    name: 'Denim Chambray Shirt',
    slug: 'denim-chambray-shirt',
    description: 'The perfect casual layer for any season. This lightweight chambray shirt can be worn open over a tee or buttoned up solo. Features chest pockets and a classic fit.',
    price: 1099, category: 'Men', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 16 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 }],
  },

  // ─── Men's Bottomwear ─────────────────────────────────────────────────────────
  {
    name: 'Slim Fit Dark Jeans',
    slug: 'slim-fit-dark-jeans',
    description: 'Premium slim-fit jeans in a deep indigo wash. Made from stretch denim for all-day comfort. Features a mid-rise waist and tapered leg opening.',
    price: 1799, category: 'Men', subCategory: 'Bottomwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 10 }],
  },
  {
    name: 'Chinos Slim Fit Trousers',
    slug: 'chinos-slim-fit-trousers',
    description: 'Versatile chino trousers that work for the office or weekend. Made from a cotton-twill blend with a slight stretch. Features a flat-front design and tapered leg.',
    price: 1499, category: 'Men', subCategory: 'Bottomwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1473966968600-fa4cfd638d4f?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 15 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Relaxed Fit Cargo Pants',
    slug: 'relaxed-fit-cargo-pants',
    description: 'Functional and stylish cargo pants with multiple pockets. Made from durable cotton canvas with a relaxed fit. Perfect for outdoor activities or casual streetwear.',
    price: 1599, category: 'Men', subCategory: 'Bottomwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7b35a?w=800&q=80'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 12 }, { size: 'L', stock: 10 }, { size: 'XL', stock: 6 }],
  },
  {
    name: 'Formal Dress Trousers',
    slug: 'formal-dress-trousers',
    description: 'Sharp and elegant formal trousers perfect for office wear or events. Made from a premium poly-viscose blend with a flat front and straight leg. Wrinkle-resistant fabric.',
    price: 1899, category: 'Men', subCategory: 'Bottomwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&q=80'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 14 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Distressed Blue Jeans',
    slug: 'distressed-blue-jeans',
    description: 'Trendy distressed jeans with a lived-in feel. Features strategic rips and fading for an authentic worn look. Made from sturdy denim with a comfortable mid-rise fit.',
    price: 1699, category: 'Men', subCategory: 'Bottomwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1604176354204-9268737652ed?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 20 }, { size: 'L', stock: 16 }, { size: 'XL', stock: 10 }],
  },

  // ─── Men's Winterwear ─────────────────────────────────────────────────────────
  {
    name: 'Quilted Puffer Jacket',
    slug: 'quilted-puffer-jacket',
    description: 'Stay warm in style with this lightweight quilted puffer jacket. Features a water-resistant outer shell and diamond-quilted design. Packable into its own pocket for easy travel.',
    price: 2999, category: 'Men', subCategory: 'Winterwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1539533113208-f17a9e9e3a38?w=800&q=80'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 12 }, { size: 'L', stock: 10 }, { size: 'XL', stock: 6 }],
  },
  {
    name: 'Wool Blend Overcoat',
    slug: 'wool-blend-overcoat',
    description: 'A sophisticated wool-blend overcoat for the modern gentleman. Features a double-breasted button closure, notched lapels, and two side pockets. Fully lined for extra warmth.',
    price: 4999, category: 'Men', subCategory: 'Winterwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'],
    sizes: [{ size: 'S', stock: 5 }, { size: 'M', stock: 8 }, { size: 'L', stock: 7 }, { size: 'XL', stock: 4 }],
  },
  {
    name: 'Fleece Zip Hoodie',
    slug: 'fleece-zip-hoodie',
    description: 'Super soft fleece zip-up hoodie perfect for chilly evenings. Features a full-zip front, two hand pockets, and an adjustable drawstring hood. Made from anti-pill fleece.',
    price: 1499, category: 'Men', subCategory: 'Winterwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 10 }],
  },
  {
    name: 'Bomber Jacket',
    slug: 'bomber-jacket-men',
    description: 'Classic bomber jacket with a modern twist. Features ribbed collar, cuffs and hem, two side pockets and one chest pocket. Made from premium nylon with satin lining.',
    price: 2499, category: 'Men', subCategory: 'Winterwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 14 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 7 }],
  },

  // ─── Women's Topwear ──────────────────────────────────────────────────────────
  {
    name: 'Floral Wrap Blouse',
    slug: 'floral-wrap-blouse',
    description: 'Elegant floral wrap blouse with a flattering V-neckline and tie-waist design. Made from lightweight chiffon that flows beautifully. Perfect for work or evening occasions.',
    price: 1099, category: 'Women', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Classic White Button-Down',
    slug: 'classic-white-button-down-women',
    description: 'A wardrobe essential for every woman. This classic white button-down shirt is made from crisp 100% cotton. Features a slightly relaxed fit that can be tucked or left out.',
    price: 1299, category: 'Women', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1496747086635-9b23d0e4f2f7?w=800&q=80'],
    sizes: [{ size: 'S', stock: 15 }, { size: 'M', stock: 20 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 10 }],
  },
  {
    name: 'Crop Top Ribbed',
    slug: 'crop-top-ribbed',
    description: 'Trendy ribbed crop top in a fitted silhouette. Made from a stretchy cotton-spandex blend that hugs your curves comfortably. Pairs well with high-waist bottoms.',
    price: 599, category: 'Women', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
    sizes: [{ size: 'S', stock: 20 }, { size: 'M', stock: 25 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 12 }],
  },
  {
    name: 'Embroidered Kurti',
    slug: 'embroidered-kurti',
    description: 'Beautiful embroidered kurti with intricate floral patterns on the neckline and sleeves. Made from soft cotton fabric. Perfect for festive occasions or everyday ethnic wear.',
    price: 1499, category: 'Women', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 16 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Striped Casual Top',
    slug: 'striped-casual-top',
    description: 'Fun and versatile striped top made from soft jersey fabric. Features a relaxed fit with a round neckline and short sleeves. A great everyday essential.',
    price: 699, category: 'Women', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80'],
    sizes: [{ size: 'S', stock: 18 }, { size: 'M', stock: 22 }, { size: 'L', stock: 16 }, { size: 'XL', stock: 10 }],
  },
  {
    name: 'Puff Sleeve Blouse',
    slug: 'puff-sleeve-blouse',
    description: 'Romantic puff sleeve blouse with a square neckline. Made from lightweight cotton voile. The dramatic sleeves add a feminine touch to any outfit.',
    price: 1199, category: 'Women', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 15 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 7 }],
  },
  {
    name: 'Off-Shoulder Top',
    slug: 'off-shoulder-top',
    description: 'Flirty off-shoulder top with a ruffle trim. Made from lightweight woven fabric with an elasticated neckline. Perfect for summer evenings and casual outings.',
    price: 899, category: 'Women', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80'],
    sizes: [{ size: 'S', stock: 14 }, { size: 'M', stock: 20 }, { size: 'L', stock: 16 }, { size: 'XL', stock: 9 }],
  },

  // ─── Women's Bottomwear ────────────────────────────────────────────────────────
  {
    name: 'High Waist Skinny Jeans',
    slug: 'high-waist-skinny-jeans',
    description: 'Flattering high-waist skinny jeans that elongate the legs. Made from premium stretch denim that holds its shape all day. Available in a classic indigo wash.',
    price: 1999, category: 'Women', subCategory: 'Bottomwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80'],
    sizes: [{ size: 'S', stock: 15 }, { size: 'M', stock: 22 }, { size: 'L', stock: 18 }, { size: 'XL', stock: 10 }],
  },
  {
    name: 'Floral Midi Skirt',
    slug: 'floral-midi-skirt',
    description: 'Feminine floral midi skirt with a flowy silhouette. Features an elasticated waistband for a comfortable fit. The vibrant print adds a pop of colour to any outfit.',
    price: 1299, category: 'Women', subCategory: 'Bottomwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1594938298603-d7090568ebe3?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Wide Leg Palazzo Pants',
    slug: 'wide-leg-palazzo-pants',
    description: 'Elegant wide-leg palazzo pants with a flowy drape. Made from lightweight crepe fabric with an elasticated waistband. Comfortable and stylish for all occasions.',
    price: 1199, category: 'Women', subCategory: 'Bottomwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1611521060732-ac5ff2e54157?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 16 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Yoga Leggings',
    slug: 'yoga-leggings',
    description: 'High-performance yoga leggings made from moisture-wicking fabric. Features a wide waistband and four-way stretch for maximum movement. Squat-proof and ultra-comfortable.',
    price: 999, category: 'Women', subCategory: 'Bottomwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1612722432474-b971cdcea546?w=800&q=80'],
    sizes: [{ size: 'S', stock: 20 }, { size: 'M', stock: 28 }, { size: 'L', stock: 22 }, { size: 'XL', stock: 12 }],
  },
  {
    name: 'A-Line Mini Skirt',
    slug: 'a-line-mini-skirt',
    description: 'Classic A-line mini skirt in a versatile solid colour. Made from a structured fabric that holds its shape. Features a concealed back zip and a flattering flared silhouette.',
    price: 899, category: 'Women', subCategory: 'Bottomwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 }],
  },

  // ─── Women's Winterwear ────────────────────────────────────────────────────────
  {
    name: 'Oversized Wool Cardigan',
    slug: 'oversized-wool-cardigan',
    description: 'Cosy oversized cardigan knitted from soft wool blend. Features deep pockets, a draped open front, and ribbed trim. The ultimate comfort layer for winter days.',
    price: 2299, category: 'Women', subCategory: 'Winterwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1548624149-f9c2bcb3a6fe?w=800&q=80'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 12 }, { size: 'L', stock: 10 }, { size: 'XL', stock: 6 }],
  },
  {
    name: 'Puffer Quilted Jacket Women',
    slug: 'puffer-quilted-jacket-women',
    description: 'Stylish quilted puffer jacket with a feminine silhouette. Lightweight yet incredibly warm, with a water-resistant outer shell. Features a detachable fur-trimmed hood.',
    price: 3299, category: 'Women', subCategory: 'Winterwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1578681994506-b8d9b9e5d54b?w=800&q=80'],
    sizes: [{ size: 'S', stock: 7 }, { size: 'M', stock: 10 }, { size: 'L', stock: 8 }, { size: 'XL', stock: 5 }],
  },
  {
    name: 'Turtleneck Sweater',
    slug: 'turtleneck-sweater-women',
    description: 'Classic turtleneck sweater in a cosy ribbed knit. Made from a soft acrylic blend that is warm without being heavy. Pairs perfectly with jeans or skirts.',
    price: 1599, category: 'Women', subCategory: 'Winterwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 14 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Trench Coat Classic',
    slug: 'trench-coat-classic',
    description: 'Timeless double-breasted trench coat in beige. Features a belted waist, storm flap, and wrist straps. Made from water-resistant cotton gabardine — a wardrobe investment piece.',
    price: 5999, category: 'Women', subCategory: 'Winterwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80'],
    sizes: [{ size: 'S', stock: 4 }, { size: 'M', stock: 6 }, { size: 'L', stock: 5 }, { size: 'XL', stock: 3 }],
  },
  {
    name: 'Cropped Knit Sweater',
    slug: 'cropped-knit-sweater',
    description: 'Trendy cropped knit sweater with long sleeves. Made from a soft acrylic blend with a slightly boxy fit. Perfect for layering over high-waist jeans or skirts.',
    price: 1299, category: 'Women', subCategory: 'Winterwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1620012254070-b60e025c3f07?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 15 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 7 }],
  },

  // ─── Kids' Topwear ────────────────────────────────────────────────────────────
  {
    name: 'Kids Graphic Tee',
    slug: 'kids-graphic-tee',
    description: 'Fun and colourful graphic tee for kids. Made from 100% soft cotton that is gentle on young skin. The vibrant print is fade-resistant after multiple washes.',
    price: 399, category: 'Kids', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1471286174890-9c112ff6122b?w=800&q=80'],
    sizes: [{ size: 'S', stock: 20 }, { size: 'M', stock: 25 }, { size: 'L', stock: 20 }],
  },
  {
    name: 'Kids Polo Shirt',
    slug: 'kids-polo-shirt',
    description: 'Smart polo shirt perfect for school or casual outings. Made from breathable pique cotton with a ribbed collar and two-button placket. Easy care and long-lasting.',
    price: 499, category: 'Kids', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1518831959059-becf61cdf9d2?w=800&q=80'],
    sizes: [{ size: 'S', stock: 15 }, { size: 'M', stock: 20 }, { size: 'L', stock: 18 }],
  },
  {
    name: 'Kids Striped T-Shirt',
    slug: 'kids-striped-tshirt',
    description: 'Cheerful striped t-shirt for active kids. Made from soft jersey cotton that stretches and moves with them. Machine washable and easy to care for.',
    price: 349, category: 'Kids', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'],
    sizes: [{ size: 'S', stock: 18 }, { size: 'M', stock: 22 }, { size: 'L', stock: 16 }],
  },
  {
    name: 'Kids Denim Shirt',
    slug: 'kids-denim-shirt',
    description: 'Cool denim shirt for stylish young ones. Lightweight and comfortable with a classic button-front design. Can be worn as a shirt or as a light jacket over tees.',
    price: 699, category: 'Kids', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 16 }, { size: 'L', stock: 12 }],
  },
  {
    name: 'Kids Hooded Sweatshirt',
    slug: 'kids-hooded-sweatshirt',
    description: 'Cosy hooded sweatshirt made from soft fleece-lined fabric. Features a kangaroo pocket and adjustable drawstring hood. Perfect for school run or playground.',
    price: 799, category: 'Kids', subCategory: 'Topwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80'],
    sizes: [{ size: 'S', stock: 15 }, { size: 'M', stock: 20 }, { size: 'L', stock: 16 }],
  },

  // ─── Kids' Bottomwear ──────────────────────────────────────────────────────────
  {
    name: 'Kids Slim Jeans',
    slug: 'kids-slim-jeans',
    description: 'Durable slim-fit jeans for active kids. Made from stretch denim that allows easy movement. Features an adjustable waistband for a perfect fit as they grow.',
    price: 799, category: 'Kids', subCategory: 'Bottomwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1471286174890-9c112ff6122b?w=800&q=80'],
    sizes: [{ size: 'S', stock: 14 }, { size: 'M', stock: 18 }, { size: 'L', stock: 14 }],
  },
  {
    name: 'Kids Cotton Shorts',
    slug: 'kids-cotton-shorts',
    description: 'Comfortable cotton shorts perfect for summer play. Features an elasticated waistband with a drawstring and two side pockets. Quick-drying and easy to wash.',
    price: 399, category: 'Kids', subCategory: 'Bottomwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1518831959059-becf61cdf9d2?w=800&q=80'],
    sizes: [{ size: 'S', stock: 20 }, { size: 'M', stock: 25 }, { size: 'L', stock: 18 }],
  },
  {
    name: 'Kids Track Pants',
    slug: 'kids-track-pants',
    description: 'Sporty track pants with side stripes. Made from moisture-wicking polyester for active days. Features an elasticated waist with drawstring and ankle zips.',
    price: 599, category: 'Kids', subCategory: 'Bottomwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80'],
    sizes: [{ size: 'S', stock: 15 }, { size: 'M', stock: 20 }, { size: 'L', stock: 16 }],
  },
  {
    name: 'Kids Printed Leggings',
    slug: 'kids-printed-leggings',
    description: 'Fun printed leggings made from soft stretchy fabric. Features an elasticated waistband for easy dressing. Available in playful prints that kids love.',
    price: 449, category: 'Kids', subCategory: 'Bottomwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'],
    sizes: [{ size: 'S', stock: 18 }, { size: 'M', stock: 24 }, { size: 'L', stock: 18 }],
  },

  // ─── Kids' Winterwear ──────────────────────────────────────────────────────────
  {
    name: 'Kids Puffer Jacket',
    slug: 'kids-puffer-jacket',
    description: 'Warm and lightweight puffer jacket for kids. Features a water-resistant shell and cosy padding. The bold colour makes kids easy to spot at the playground.',
    price: 1999, category: 'Kids', subCategory: 'Winterwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 14 }, { size: 'L', stock: 10 }],
  },
  {
    name: 'Kids Fleece Hoodie',
    slug: 'kids-fleece-hoodie',
    description: 'Super soft fleece hoodie that kids will want to wear every day. Features a front zip, kangaroo pocket, and a cosy lined hood. Machine washable.',
    price: 999, category: 'Kids', subCategory: 'Winterwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1471286174890-9c112ff6122b?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 16 }, { size: 'L', stock: 12 }],
  },
  {
    name: 'Kids Wool Blend Sweater',
    slug: 'kids-wool-blend-sweater',
    description: 'Warm and soft wool-blend sweater with a fun cable-knit pattern. Features ribbed collar, cuffs and hem. Easy to layer under a coat for extra warmth.',
    price: 1199, category: 'Kids', subCategory: 'Winterwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1518831959059-becf61cdf9d2?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 14 }, { size: 'L', stock: 10 }],
  },

  // ─── Extra Men's ──────────────────────────────────────────────────────────────
  {
    name: 'Mandarin Collar Shirt',
    slug: 'mandarin-collar-shirt',
    description: 'Contemporary mandarin collar shirt in a premium cotton fabric. The minimalist collar design gives a modern, refined look. Perfect for smart-casual occasions.',
    price: 1399, category: 'Men', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80'],
    sizes: [{ size: 'S', stock: 8 }, { size: 'M', stock: 14 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 6 }],
  },
  {
    name: 'Crew Neck Sweatshirt',
    slug: 'crew-neck-sweatshirt',
    description: 'Minimalist crew neck sweatshirt made from heavyweight French terry. Features a relaxed fit with ribbed cuffs and hem. A wardrobe essential for cooler days.',
    price: 1099, category: 'Men', subCategory: 'Winterwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 18 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 8 }],
  },
  {
    name: 'Tailored Fit Chinos',
    slug: 'tailored-fit-chinos',
    description: 'Impeccably tailored chinos with a clean, refined look. Made from a premium cotton-stretch blend for comfort and structure. Features a flat-front design and straight leg.',
    price: 1699, category: 'Men', subCategory: 'Bottomwear', isBestseller: true,
    images: ['https://images.unsplash.com/photo-1473966968600-fa4cfd638d4f?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 16 }, { size: 'L', stock: 13 }, { size: 'XL', stock: 8 }],
  },

  // ─── Extra Women's ────────────────────────────────────────────────────────────
  {
    name: 'Satin Cami Top',
    slug: 'satin-cami-top',
    description: 'Luxurious satin cami top with adjustable spaghetti straps and a delicate lace trim. Can be dressed up or down. The fluid drape creates an effortlessly elegant look.',
    price: 899, category: 'Women', subCategory: 'Topwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=800&q=80'],
    sizes: [{ size: 'S', stock: 12 }, { size: 'M', stock: 16 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 7 }],
  },
  {
    name: 'Maxi Wrap Skirt',
    slug: 'maxi-wrap-skirt',
    description: 'Boho-inspired maxi wrap skirt with a flowing silhouette. Made from lightweight printed fabric that moves beautifully. The wrap design allows for an adjustable fit.',
    price: 1499, category: 'Women', subCategory: 'Bottomwear', isBestseller: false,
    images: ['https://images.unsplash.com/photo-1594938298603-d7090568ebe3?w=800&q=80'],
    sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 14 }, { size: 'L', stock: 12 }, { size: 'XL', stock: 6 }],
  },
];

async function main() {
  console.log(`\n🌱 Seeding ${products.length} products into the database...\n`);

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) {
      console.log(`  ⏭  Skipped (already exists): ${p.name}`);
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        category:    p.category    as any,
        subCategory: p.subCategory as any,
        isBestseller: p.isBestseller,
        images: {
          create: p.images.map((url, i) => ({
            url,
            cloudinaryId: `seed_${p.slug}_${i}`,
            isPrimary:  i === 0,
            sortOrder:  i,
          })),
        },
        variants: {
          create: p.sizes.map((v) => ({
            size:  v.size  as any,
            stock: v.stock,
          })),
        },
      },
    });

    console.log(`  ✓  ${p.name} (₹${p.price})`);
    created++;
  }

  console.log(`\n✅ Done! ${created} products created, ${skipped} skipped.\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
