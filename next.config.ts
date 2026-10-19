import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Foto de perfil do Instagram: a Meta serve por dois CDNs, conforme a conta —
    // `scontent-*.xx.fbcdn.net` ou `scontent-*.cdninstagram.com`.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
    ],
  },
};
export default nextConfig;
