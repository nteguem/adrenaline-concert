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
  }
};

export default nextConfig;