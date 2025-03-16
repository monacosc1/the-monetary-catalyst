/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      // Add production Strapi URL
      {
        protocol: 'https',
        hostname: 'cms.themonetarycatalyst.com',
        port: '',
        pathname: '/uploads/**',
      },
      // Add Strapi Cloud media CDN
      {
        protocol: 'https',
        hostname: 'kind-darling-0028761e1e.media.strapiapp.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;