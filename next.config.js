/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
};

// Only apply static export + custom distDir for production builds.
// This gives you a smooth `next dev` experience (normal .next folder, reliable CSS/HMR)
// while `npm run build` still produces the clean static site in dist/ for Cloudflare Pages.
if (process.env.NODE_ENV === 'production' || process.env.BUILD_STATIC === 'true') {
  nextConfig.output = 'export';
  nextConfig.distDir = 'dist';
}

module.exports = nextConfig;
