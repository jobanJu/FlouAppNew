const CACHE_NAME = 'flou-v2-20260108';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logos/FLOU.png',
  '/FLOU.svg'
];

// Installation du Service Worker - Skip waiting pour activer immédiatement
self.addEventListener('install', event => {
  self.skipWaiting(); // Force l'activation immédiate
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prendre le contrôle immédiatement de toutes les pages
      return self.clients.claim();
    })
  );
});

// Stratégie: Network First, fallback to Cache
self.addEventListener('fetch', event => {
  // Ne pas cacher les requêtes POST, les APIs Supabase ou Agora
  if (event.request.method !== 'GET' || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('agora.io') ||
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone la réponse avant de la mettre en cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, cherche dans le cache
        return caches.match(event.request);
      })
  );
});
