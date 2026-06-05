// Vena Talks Service Worker v8.4
const VERSION = "vt-v8.4";
const CACHE_FILES = [
  "/Talks/",
  "/Talks/index.html"
];

// Install - cache file utama
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(CACHE_FILES).catch(()=>{}))
  );
  self.skipWaiting();
});

// Activate - hapus cache lama
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - serve dari cache kalau offline
self.addEventListener("fetch", e => {
  const url = e.request.url;
  if(e.request.method !== "GET") return;
  if(url.includes("firebaseio") || url.includes("firebase") || 
     url.includes("googleapis") || url.includes("gstatic")) return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if(res.ok){
          caches.open(VERSION).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});

// Push notification
self.addEventListener("push", e => {
  const d = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(d.title || "Vena Talks", {
      body: d.body || "Pesan baru",
      icon: "/Talks/icon.svg",
      badge: "/Talks/icon.svg",
      vibrate: [200, 100, 200],
      tag: "vt-msg",
      renotify: true,
      data: { url: "/Talks/" }
    })
  );
});

// Klik notifikasi - buka app
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:"window"}).then(cs => {
      for(const c of cs){
        if(c.url.includes("/Talks/") && "focus" in c) return c.focus();
      }
      return clients.openWindow("/Talks/");
    })
  );
});

// Deteksi update - beritahu app
self.addEventListener("message", e => {
  if(e.data === "CHECK_UPDATE"){
    e.source.postMessage({type:"VERSION", version: VERSION});
  }
});
