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
      }
    ],
  },
};

export default nextConfig;
