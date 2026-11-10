/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false, // hide the "N" badge in the corner while developing
  // lets a production build live next to the dev server's .next folder (NEXT_DIST=.next-prod)
  distDir: process.env.NEXT_DIST || '.next',
};

export default nextConfig;
