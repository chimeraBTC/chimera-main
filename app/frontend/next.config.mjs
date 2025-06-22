/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three', '@react-three/postprocessing', 'postprocessing'],
  // Configure for Cloudflare Pages
  output: 'standalone',
  images: {
    unoptimized: true, // Required for Cloudflare Pages
  },
};

export default nextConfig;
