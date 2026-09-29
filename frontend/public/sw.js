// Service worker de désinstallation.
//
// L'application n'utilise plus de service worker (next-pwa retiré) : l'installation sur
// l'écran d'accueil repose uniquement sur manifest.json.
// Les navigateurs qui avaient enregistré l'ancien service worker revérifient /sw.js à chaque
// visite : ils récupèrent ce fichier, suppriment tous les caches (dont les réponses /api
// mises en cache par next-pwa), se désinscrivent et rechargent les onglets ouverts.
//
// À supprimer une fois que les appareils déjà installés ont été mis à jour (quelques mois).

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
      await self.registration.unregister()
      const windows = await self.clients.matchAll({ type: 'window' })
      windows.forEach((client) => client.navigate(client.url))
    })()
  )
})
