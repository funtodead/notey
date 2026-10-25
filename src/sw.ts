/// <reference lib="webworker" />
// Notey's service worker: offline caching (as before) plus showing pushed notifications.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// New versions take over right away (the app reloads itself when that happens).
self.addEventListener('install', () => void self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  const { title, body } = (event.data?.json() ?? {}) as { title?: string; body?: string }
  event.waitUntil(self.registration.showNotification(title ?? 'Notey', { body, icon: 'pwa-192x192.png' }))
})

// Tapping a notification opens Notey (or brings it to the front).
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windows) => windows[0]?.focus() ?? self.clients.openWindow('./')),
  )
})
