/* eslint-disable no-restricted-globals */
const CACHE_NAME = "expense-tracker-cache-v3";
const API_CACHE_NAME = "expense-tracker-api-cache-v3";
const URLS_TO_CACHE = ["/", "/index.html", "/static/js/bundle.js"];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching static files...");
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch Handler
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // ✅ Cache ALL API calls
  if (request.url.includes("/api/")) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) =>
        fetch(request)
          .then((response) => {
            // Save fresh API response to cache
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => {
            // If offline, return cached API response
            return caches.match(request);
          })
      )
    );
  } else {
    // ✅ Static files: Cache First Strategy
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).catch(() =>
            caches.match("/index.html") // SPA fallback
          )
        );
      })
    );
  }
});

self.addEventListener("install", (event) => {
  self.skipWaiting(); // immediately activate new SW
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim()); // take control of all pages
});

// Optional: clean old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = ["your-app-cache-v1"];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) return caches.delete(cacheName);
        })
      )
    )
  );
});
