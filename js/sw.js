const CACHE = 'gezondheid-v1';

const FILES = [
  '/',
  '/index.html',
  '/invoer.html',
  '/overzicht.html',
  '/style.css',
  '/app.js'
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
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});