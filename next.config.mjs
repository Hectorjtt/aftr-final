/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Asegurar que Fast Refresh esté habilitado (habilitado por defecto en desarrollo)
  reactStrictMode: true,
}

export default nextConfig
