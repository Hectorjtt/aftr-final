/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  // Que /favicon.ico sirva nuestro icono (evita que se use el de Vercel)
  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/icon.png' },
    ]
  },
}

export default nextConfig
