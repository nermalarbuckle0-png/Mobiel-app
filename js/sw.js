const CACHE = 'gezondheid-v2';
// Bepaal basis-URL: /Mobiel-app/js/sw.js -> /Mobiel-app/
const ROOT = self.location.pathname.replace(/\/js\/sw\.js$/, '/');
const OFFLINE_URL = `${ROOT}offline.html`;

const FILES = [
  `${ROOT}index.html`,
  `${ROOT}offline.html`,
  `${ROOT}pages/invoer.html`,
  `${ROOT}pages/overzicht.html`,
  `${ROOT}styles/style.css`,
  `${ROOT}js/app.js`,
  `${ROOT}json/nl.json`,
  `${ROOT}json/en.json`,
  `${ROOT}json/manifest.json`
];

// Sla bestanden op bij installatie
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Voeg bestanden toe met fallback - mislukte requests stoppen niet de hele install
      return Promise.all(
        FILES.map(url =>
          fetch(url)
            .then(resp => resp.status === 200 ? cache.put(url, resp) : null)
            .catch(err => console.warn(`Cache failed for ${url}:`, err))
        )
      ).then(() => self.skipWaiting());
    })
  );
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

async function fetchAndCache(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return null;
  }
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetchAndCache(e.request).then(response => {
        if (response) return response;
        if (e.request.mode === 'navigate') return caches.match(OFFLINE_URL);
        return null;
      });
    }).catch(() => {
      if (e.request.mode === 'navigate') return caches.match(OFFLINE_URL);
      return null;
    })
  );
});