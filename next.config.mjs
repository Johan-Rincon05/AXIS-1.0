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
  experimental: {
    // Next.js 14: clave correcta para excluir paquetes del bundle del servidor
    serverComponentsExternalPackages: [
      'pg',
      'pg-native',
      'whatsapp-web.js',
      'puppeteer',
      'puppeteer-core',
      'fluent-ffmpeg',
      'qrcode',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Forzar exclusión a nivel webpack como segunda capa de seguridad
      const externals = Array.isArray(config.externals) ? config.externals : []
      config.externals = [
        ...externals,
        'pg-native',
        'whatsapp-web.js',
        'puppeteer',
        'puppeteer-core',
        'fluent-ffmpeg',
      ]
    }
    return config
  },
}

export default nextConfig
