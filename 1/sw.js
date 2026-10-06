const CACHE_NAME = 'mc-wse-v6';

// Core assets to cache on install for full offline support
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './projectlogo.png',
  './minecraftwebsimedition.png',
  
  // Library CDNs
  'https://esm.sh/three@0.150.0',
  'https://esm.sh/three@0.150.0/examples/jsm/loaders/GLTFLoader.js',
  'https://esm.sh/nipplejs',
  'https://esm.sh/peerjs@1.5.2',
  'https://esm.sh/jszip@3.10.1',
  
  // Critical JS Hierarchy
  './src/js/Start.js',
  './src/js/net/minecraft/client/Minecraft.js',
  './src/js/net/minecraft/client/world/World.js',
  './src/js/net/minecraft/client/entity/PlayerEntity.js',
  './src/js/net/minecraft/client/world/block/BlockRegistry.js',
  './src/js/net/minecraft/client/render/WorldRenderer.js',
  './src/js/net/minecraft/client/gui/screens/GuiMainMenu.js'
];

// Install Event - Caching the app shell and core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching core assets');
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Cache First strategy for game assets, Network First for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // We only cache GET requests
  if (event.request.method !== 'GET') return;

  // Strategy: Cache-First for static assets (textures, models, sounds, libraries)
  // These are heavy and change rarely, so local loading is much better for performance.
  const isGameAsset = 
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.gltf') || 
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.mp3') || 
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.host === 'esm.sh' ||
    url.host === 'cdn.jsdelivr.net' ||
    url.host === 'files.catbox.moe';

  if (isGameAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          // Cache the new asset dynamically
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        }).catch(() => {
            // Fallback for offline if not in cache
            return new Response('Offline', { status: 503 });
        });
      })
    );
  } else {
    // Default Network-First for HTML and other dynamic endpoints
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
