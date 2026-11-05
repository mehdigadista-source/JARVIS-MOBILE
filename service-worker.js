const CACHE_NAME = "jarvis-stark-v1";

const FICHIERS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.allSettled(
        FICHIERS.map(async fichier => {
          const reponse = await fetch(fichier, { cache: "no-store" });
          if (reponse.ok) {
            await cache.put(fichier, reponse);
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const cachesExistants = await caches.keys();

      await Promise.all(
        cachesExistants
          .filter(nom => nom !== CACHE_NAME)
          .map(nom => caches.delete(nom))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const requete = event.request;
  const url = new URL(requete.url);

  if (requete.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Ne jamais mettre en cache les API ou les données personnelles.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/rest/")
  ) return;

  // Navigation : réseau d'abord, interface en cache si hors ligne.
  if (requete.mode === "navigate") {
    event.respondWith(
      fetch(requete)
        .then(reponse => {
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put("/index.html", copie)
            );
          }
          return reponse;
        })
        .catch(async () => {
          return (
            await caches.match("/index.html") ||
            await caches.match("/")
          );
        })
    );
    return;
  }

  // Ressources locales : cache d'abord.
  event.respondWith(
    caches.match(requete).then(async reponseCache => {
      const actualisation = fetch(requete)
        .then(reponse => {
          if (reponse.ok) {
            const copie = reponse.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(requete, copie)
            );
          }
          return reponse;
        });

      return reponseCache || actualisation;
    })
  );
});
