const CACHE_NAME = "sut-takip-v2.1";
const API_CACHE_NAME = "sut-takip-api-v1";

// Önbelleğe alınacak dosyalar
const urlsToCache = [
  "/",
  "/raporlar",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/favicon.ico"
];

// API endpoint'leri
const API_ENDPOINTS = [
  self.location.origin + "/.netlify/functions/airtable"
];

// Service Worker kurulumu
self.addEventListener("install", event => {
  console.log("SW: Kurulum başladı");
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("SW: Cache açıldı");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("SW: Dosyalar cache'lendi");
        return self.skipWaiting();
      })
      .catch(error => {
        console.error("SW: Cache hatası:", error);
      })
  );
});

// Service Worker aktifleşmesi
self.addEventListener("activate", event => {
  console.log("SW: Aktifleşme başladı");
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eski cache'leri temizle
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log("SW: Eski cache siliniyor:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log("SW: Aktifleşme tamamlandı");
      return self.clients.claim();
    })
  );
});

// Fetch olayları - Network First stratejisi
self.addEventListener("fetch", event => {
  const requestURL = new URL(event.request.url);
  
  // API istekleri için ayrı strateji
  if (isAPIRequest(event.request)) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }
  
  // Statik dosyalar için Cache First
  if (isStaticAsset(event.request)) {
    event.respondWith(handleStaticAsset(event.request));
    return;
  }
  
  // HTML sayfalar için Network First with Cache Fallback
  event.respondWith(handlePageRequest(event.request));
});

// API isteği kontrolü
function isAPIRequest(request) {
  return API_ENDPOINTS.some(endpoint => 
    request.url.startsWith(endpoint)
  );
}

// Statik dosya kontrolü
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/);
}

// API isteklerini işle - Network First with API Cache
async function handleAPIRequest(request) {
  const cacheName = API_CACHE_NAME;
  
  try {
    // Önce network'ten dene
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // Başarılı yanıtı cache'le
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log("SW: API Network hatası, cache'den dönülüyor:", error);
    
    // Network hata verirse cache'den dön
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Cache'de de yoksa offline yanıtı dön
    return new Response(
      JSON.stringify({ 
        error: "Offline", 
        message: "İnternet bağlantısı yok, veriler yerel olarak kaydedildi" 
      }),
      { 
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// Statik dosyaları işle - Cache First
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log("SW: Statik dosya yüklenemedi:", error);
    // Fallback görsel veya dosya döndürülebilir
    return new Response("Dosya bulunamadı", { status: 404 });
  }
}

// Sayfa isteklerini işle - Network First with Cache Fallback
async function handlePageRequest(request) {
  try {
    // Önce network'ten dene
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Başarılı yanıtı cache'le
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log("SW: Network hatası, cache'den dönülüyor:", error);
    
    // Cache'den dön
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Hiçbiri yoksa offline sayfası
    return caches.match("/") || new Response(
      `<!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Çevrimdışı - Süt Takip Sistemi</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          }
          .offline-container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
          }
          h1 { font-size: 2.5rem; margin-bottom: 20px; }
          p { font-size: 1.2rem; margin: 15px 0; }
          .btn {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1.1rem;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <h1>🔌 Çevrimdışı</h1>
          <p>İnternet bağlantınız yok gibi görünüyor.</p>
          <p>Lütfen bağlantınızı kontrol edin ve tekrar deneyin.</p>
          <button class="btn" onclick="location.reload()">🔄 Yeniden Dene</button>
        </div>
      </body>
      </html>`,
      { 
        headers: { "Content-Type": "text/html" }
      }
    );
  }
}

// Background Sync - Offline veri senkronizasyonu
self.addEventListener("sync", event => {
  if (event.tag === "background-sync-sut-data") {
    console.log("SW: Background sync başladı");
    event.waitUntil(syncOfflineData());
  }
});

// Offline verileri senkronize et
async function syncOfflineData() {
  try {
    // IndexedDB'den offline verileri al ve Airtable'a gönder
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        command: "SYNC_OFFLINE_DATA"
      });
    });
  } catch (error) {
    console.error("SW: Sync hatası:", error);
  }
}

// Push notifications için hazırlık
self.addEventListener("push", event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || "Yeni bildirim",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: data.tag || "general",
    requireInteraction: true,
    actions: [
      {
        action: "open",
        title: "Aç",
        icon: "/icons/icon-72.png"
      },
      {
        action: "close",
        title: "Kapat"
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || "Süt Takip Sistemi", options)
  );
});

// Notification click handler
self.addEventListener("notificationclick", event => {
  event.notification.close();
  
  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.openWindow("/")
    );
  }
});

// Mesaj handler - Client ile iletişim
self.addEventListener("message", event => {
  if (event.data && event.data.command) {
    switch (event.data.command) {
      case "SKIP_WAITING":
        self.skipWaiting();
        break;
      case "GET_VERSION":
        event.ports[0].postMessage({ version: CACHE_NAME });
        break;
      case "CLEAR_CACHE":
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ success: true });
        });
        break;
    }
  }
});

// Tüm cache'leri temizle
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Hata yönetimi
self.addEventListener("error", event => {
  console.error("SW: Global hata:", event.error);
});

self.addEventListener("unhandledrejection", event => {
  console.error("SW: Unhandled Promise rejection:", event.reason);
});

console.log("🔧 Service Worker v2.1 yüklendi!");
