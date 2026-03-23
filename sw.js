/* ============================================================
   SERVICE WORKER — Go2Links PWA
   Ce fichier permet :
   - L'installation sur l'écran d'accueil (Android/iOS/Desktop)
   - Le chargement hors-ligne après la première visite
   - Une vitesse d'affichage améliorée (cache intelligent)
   ============================================================ */

const CACHE_NAME = 'go2links-v1';

/* Fichiers à mettre en cache dès l'installation */
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

/* ── Installation : mise en cache des assets de base ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  /* Active immédiatement sans attendre la fermeture des onglets */
  self.skipWaiting();
});

/* ── Activation : nettoyage des anciens caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch : stratégie Network First avec fallback cache ── */
self.addEventListener('fetch', event => {
  /* On ne gère que les requêtes GET */
  if (event.request.method !== 'GET') return;

  /* On ignore les requêtes vers d'autres domaines (polices Google, etc.) */
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        /* Si la réponse réseau est valide, on la met en cache et on la retourne */
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        /* Pas de réseau → on sert depuis le cache */
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          /* Fallback ultime : page d'accueil depuis le cache */
          return caches.match('/index.html');
        });
      })
  );
});
