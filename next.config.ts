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
  
  // Configuration optimisée des headers de cache pour FRONT OFFICE
  async headers() {
    return [
      // Assets statiques - Cache 1 an
      {
        source: '/:all*(css|js|gif|svg|jpg|jpeg|png|woff|woff2|avif|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      
      // API Events - Cache 5 minutes
      {
        source: '/api/events/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,OPTIONS,PATCH,DELETE'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60'
          }
        ]
      },
      
      // API Tours - Cache 30 minutes
      {
        source: '/api/tours/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,OPTIONS,PATCH,DELETE'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, stale-while-revalidate=300'
          }
        ]
      },
      
      // API Participants Front Office - Cache 2 minutes
      {
        source: '/api/participants_fo/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,OPTIONS,PATCH,DELETE'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=120, stale-while-revalidate=30'
          }
        ]
      },
      
      // API Tirage - Cache 1 minute (données critiques)
      {
        source: '/api/tirage/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,OPTIONS,PATCH,DELETE'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=15'
          }
        ]
      },
      
      // API Vainqueurs - Cache 1 minute (données critiques)
      {
        source: '/api/vainqueurs/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,OPTIONS,PATCH,DELETE'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=15'
          }
        ]
      },
      
      // API Auth - Pas de cache (sécurité)
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,OPTIONS,PATCH,DELETE'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate'
          }
        ]
      },
      
      // API Check Participant - Cache 30 secondes
      {
        source: '/api/check-participant',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,OPTIONS,PATCH,DELETE'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=30, stale-while-revalidate=10'
          }
        ]
      }
    ]
  }
};

export default nextConfig;