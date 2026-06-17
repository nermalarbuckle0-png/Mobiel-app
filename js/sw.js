const CACHE = 'gezondheid-v4';
const pathname = self.location.pathname;
const ROOT = pathname.substring(0, pathname.lastIndexOf('/js/sw.js')) + '/';
const OFFLINE_URL = ROOT + 'offline.html';

const FILES = [
  ROOT,
  ROOT + 'index.html',
  ROOT + 'offline.html',
  ROOT + 'pages/invoer.html',
  ROOT + 'pages/overzicht.html',
  ROOT + 'styles/style.css',
  ROOT + 'js/app.js',
  ROOT + 'json/nl.json',
  ROOT + 'json/en.json',
  ROOT + 'json/manifest.json'
];

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

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

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