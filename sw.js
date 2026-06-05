const CACHE = "vena-talks-v4";
const ASSETS = ["/Talks/", "/Talks/index.html", "/Talks/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("firestore") || e.request.url.includes("firebase")) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});

// Push notification
self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || "Vena Talks";
  const options = {
    body: data.body || "Pesan baru masuk",
    icon: "/Talks/icon-192.png",
    badge: "/Talks/icon-192.png",
    vibrate: [200, 100, 200],
    data: data,
    actions: [{ action: "open", title: "Buka" }]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow("/Talks/"));
});
