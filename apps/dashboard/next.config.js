/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Handle optional dependencies that cause warnings
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
    }
    // Ignore optional peer dependencies
    config.externals.push('pino-pretty', 'encoding')
    return config
  },
}

module.exports = nextConfig
