const CACHE = 'gezondheid-v1';

const FILES = [
  '../index.html',
  '../pages/invoer.html',
  '../pages/overzicht.html',
  '../styles/style.css',
  'app.js',
  '../json/nl.json',
  '../json/en.json',
  '../json/manifest.json',
  '../icons/icon-192.png',
  '../icons/icon-512.png',
  '../icons/icon.svg'
];

// Sla bestanden op bij installatie
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

// Verwijder oude cache bij update
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Geef gecachte versie terug, anders haal op van internet
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // optionally cache new GET requests
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
        const respClone = resp.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, respClone));
        return resp;
      }).catch(() => {
        // fallback to cached index for navigation requests
        if (e.request.mode === 'navigate') return caches.match('../index.html');
      });
    })
  );
});