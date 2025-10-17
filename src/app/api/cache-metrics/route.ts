import { NextRequest, NextResponse } from 'next/server';

// Cache en mémoire pour les métriques
const cacheMetrics = {
  hits: 0,
  misses: 0,
  totalRequests: 0,
  lastReset: new Date().toISOString(),
  endpoints: {
    '/api/events': { hits: 0, misses: 0, avgResponseTime: 0 },
    '/api/tours': { hits: 0, misses: 0, avgResponseTime: 0 },
    '/api/participants_fo': { hits: 0, misses: 0, avgResponseTime: 0 },
    '/api/tirage': { hits: 0, misses: 0, avgResponseTime: 0 },
    '/api/vainqueurs': { hits: 0, misses: 0, avgResponseTime: 0 },
    '/api/check-participant': { hits: 0, misses: 0, avgResponseTime: 0 }
  }
};

// Fonction pour enregistrer une métrique
export function recordCacheMetric(endpoint: string, isHit: boolean, responseTime: number) {
  cacheMetrics.totalRequests++;
  
  if (isHit) {
    cacheMetrics.hits++;
    if (cacheMetrics.endpoints[endpoint]) {
      cacheMetrics.endpoints[endpoint].hits++;
    }
  } else {
    cacheMetrics.misses++;
    if (cacheMetrics.endpoints[endpoint]) {
      cacheMetrics.endpoints[endpoint].misses++;
    }
  }
  
  // Mettre à jour le temps de réponse moyen
  if (cacheMetrics.endpoints[endpoint]) {
    const currentAvg = cacheMetrics.endpoints[endpoint].avgResponseTime;
    const totalRequests = cacheMetrics.endpoints[endpoint].hits + cacheMetrics.endpoints[endpoint].misses;
    cacheMetrics.endpoints[endpoint].avgResponseTime = 
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
  }
}

export async function GET() {
  const hitRatio = cacheMetrics.totalRequests > 0 
    ? (cacheMetrics.hits / cacheMetrics.totalRequests * 100).toFixed(2)
    : 0;

  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics: {
      global: {
        totalRequests: cacheMetrics.totalRequests,
        hits: cacheMetrics.hits,
        misses: cacheMetrics.misses,
        hitRatio: `${hitRatio}%`,
        lastReset: cacheMetrics.lastReset
      },
      endpoints: cacheMetrics.endpoints,
      system: {
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        nodeVersion: process.version,
        platform: process.platform
      }
    }
  }, {
    headers: {
      'Cache-Control': 'private, max-age=30',
      'Content-Type': 'application/json'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'purge') {
      // Réinitialiser toutes les métriques
      cacheMetrics.hits = 0;
      cacheMetrics.misses = 0;
      cacheMetrics.totalRequests = 0;
      cacheMetrics.lastReset = new Date().toISOString();
      
      // Réinitialiser les métriques par endpoint
      Object.keys(cacheMetrics.endpoints).forEach(endpoint => {
        cacheMetrics.endpoints[endpoint] = { 
          hits: 0, 
          misses: 0, 
          avgResponseTime: 0 
        };
      });
      
      return NextResponse.json({
        success: true,
        message: 'Cache et métriques purgés avec succès',
        timestamp: new Date().toISOString()
      });
    }
    
    if (body.action === 'reset') {
      // Réinitialiser seulement les compteurs
      cacheMetrics.hits = 0;
      cacheMetrics.misses = 0;
      cacheMetrics.totalRequests = 0;
      cacheMetrics.lastReset = new Date().toISOString();
      
      return NextResponse.json({
        success: true,
        message: 'Métriques réinitialisées avec succès',
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Action non reconnue. Actions disponibles: purge, reset'
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Erreur lors du traitement de la requête',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
