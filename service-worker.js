const CACHE_NAME = 'nobre-vidros-v3';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// Instala e cacheia TODOS os arquivos imediatamente
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cacheando arquivos...');
      return Promise.allSettled(
        ASSETS.map(url => 
          cache.add(url).catch(err => console.log('Falhou cachear:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache first para assets locais, network first para externos
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Assets locais: cache first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
  } else {
    // CDN externos: network first, fallback cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
