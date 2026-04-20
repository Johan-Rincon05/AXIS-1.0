/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Excluir paquetes nativos/pesados del bundle del servidor
  serverExternalPackages: [
    'pg',
    'pg-native',
    'whatsapp-web.js',
    'puppeteer',
    'puppeteer-core',
    'fluent-ffmpeg',
    'qrcode',
  ],
}

export default nextConfig
