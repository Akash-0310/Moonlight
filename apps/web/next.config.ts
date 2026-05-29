import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      { source: '/shop', destination: '/collection', permanent: true },
      { source: '/shop/:path*', destination: '/collection/:path*', permanent: true },
      { source: '/products', destination: '/collection', permanent: true },
      { source: '/products/:slug', destination: '/product/:slug', permanent: true },
      { source: '/collection/new', destination: '/collection?sort=newest', permanent: false },
      { source: '/collection/sale', destination: '/collection', permanent: false },
      { source: '/collection/bestsellers', destination: '/collection?bestseller=true', permanent: false },
      { source: '/sale', destination: '/collection', permanent: false },
      { source: '/new', destination: '/collection?sort=newest', permanent: false },
      { source: '/new-arrivals', destination: '/collection?sort=newest', permanent: false },
      { source: '/bestsellers', destination: '/collection?bestseller=true', permanent: false },
      { source: '/profile', destination: '/orders', permanent: false },
      { source: '/account', destination: '/orders', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
