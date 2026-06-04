'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register Firebase messaging service worker for push notifications
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('[SW] firebase-messaging-sw.js registered, scope:', registration.scope)
        })
        .catch((err) => {
          console.error('[SW] firebase-messaging-sw.js registration failed:', err)
        })
    }
  }, [])

  return null
}