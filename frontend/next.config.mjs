/** @type {import('next').NextConfig} */

// Where the PHP backend (API + admin) runs. On Render both run in one container, so PHP is private
// on 127.0.0.1:8000 and everything is served from ONE public URL:
//   /            -> the banner (Next.js)
//   /admin       -> admin panel (PHP)
//   /api/...     -> API (PHP)
// Locally it is the same: start PHP on :8000 and open http://localhost:3000/admin
const BACKEND = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000';

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false, // hide the "N" badge in the corner while developing
  // lets a production build live next to the dev server's .next folder (NEXT_DIST=.next-prod)
  distDir: process.env.NEXT_DIST || '.next',
  // keep the trailing slash on /admin/ (the admin panel uses relative links; middleware.js adds it)
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/admin/', destination: `${BACKEND}/admin/` },
      { source: '/admin/:path*', destination: `${BACKEND}/admin/:path*` },
    ];
  },
};

export default nextConfig;
