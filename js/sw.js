/* ============================================================
  SW.JS — Service Worker voor offline ondersteuning (PWA)

  Verantwoordelijkheden:
  - pre-cache belangrijke resources tijdens installatie
  - verwijder oude cacheversies bij activatie
  - beantwoord fetch-verzoeken met cache-first/strategieën
  - fallback naar een offline-pagina wanneer navigatie faalt

  Versiebeheer: update `CACHE` bij het veranderen van resources.
  ============================================================ */

const CACHE = 'gezondheid-v6';
const OFFLINE_URL = 'offline.html';

// Lijst met bestanden die we bij installatie willen cachen
// (basis assets en pagina's die essentieel zijn voor offline ervaring)
const FILES = [
  './',
  'index.html',
  'offline.html',
  'pages/invoer.html',
  'pages/overzicht.html',
  'styles/style.css',
  'js/app.js',
  'json/manifest.json'
];

// Installatie: cache alle bestanden
// Installatie: open cache en voeg geselecteerde bestanden toe.
// We gebruiken `skipWaiting()` zodat de nieuwe SW snel actief kan worden.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(
        FILES.map(url =>
          fetch(url)
            .then(resp => resp.status === 200 ? cache.put(url, resp) : null)
            .catch(err => {
              // Fouten tijdens het cachen loggen we, maar we laten
              // de installatie niet per se volledig falen
              console.warn('Cache mislukt voor ' + url + ':', err);
              return null;
            })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Activatie: verwijder oude cache-versies
// Activatie: verwijder oude caches zodat we schone cache-namespace houden.
// `clients.claim()` zorgt dat de SW direct controle neemt over pagina's.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: geef cached versie terug, anders netwerk, anders offline-pagina
// Fetch-handler:
// - Voor navigatie (pagina-aanvragen) gebruiken we cache-first, met
//   netwerk-fallback en een offline-pagina als laatste redmiddel.
// - Voor assets gebruiken we eerst cache, daarna netwerk; succesvolle
//   netwerk-responses worden toegevoegd aan de cache (runtime caching).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Navigatieverzoeken (volledige pagina's): probeer eerst cache,
  // dan netwerk en anders offline fallback.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request)
          .then(resp => {
            // Sla succesvolle navigatie-responses op in cache
            const clone = resp.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
            return resp;
          })
          .catch(() => caches.match(OFFLINE_URL))
        )
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Andere GET-verzoeken: probeer cache eerst, dan netwerk.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => null);
    })
  );
});