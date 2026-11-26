import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  devIndicators: false,
  // página estática da identidade visual (public/identidade-visual), para o Raul aprovar
  async rewrites() {
    return [{ source: '/identidade-visual', destination: '/identidade-visual/index.html' }]
  },
}
export default nextConfig
