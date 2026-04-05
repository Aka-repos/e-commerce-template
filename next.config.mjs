/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Support large file uploads
    },
  },
}

export default nextConfig
