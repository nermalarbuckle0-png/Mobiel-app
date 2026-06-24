const CACHE = 'gezondheid-v6';
const OFFLINE_URL = 'offline.html';

// Alle bestanden die offline beschikbaar moeten zijn
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
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(
        FILES.map(url =>
          fetch(url)
            .then(resp => resp.status === 200 ? cache.put(url, resp) : null)
            .catch(err => console.warn('Cache mislukt voor ' + url + ':', err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// Activatie: verwijder oude cache-versies
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: geef cached versie terug, anders netwerk, anders offline-pagina
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request)
          .then(resp => {
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