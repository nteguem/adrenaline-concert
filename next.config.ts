import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vos configurations existantes */
  
  // Configuration pour ignorer les erreurs TypeScript
  typescript: {
    // Ignorer les erreurs TypeScript pendant le build
    ignoreBuildErrors: true
  },
  
  // Configuration pour ignorer les erreurs ESLint
  eslint: {
    // Ignorer les erreurs ESLint pendant le build
    ignoreDuringBuilds: true
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,OPTIONS,PATCH,DELETE'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          }
        ]
      }
    ]
  }
};

export default nextConfig;