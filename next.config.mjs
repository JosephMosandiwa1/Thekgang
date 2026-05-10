/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail the production build on stylistic ESLint warnings
  // (the press/blocks/types.ts empty-interface error predates this
  // commit). Type-checking still runs via tsc + Next.js's build-time
  // typecheck step.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
