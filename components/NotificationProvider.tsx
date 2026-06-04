'use client'

import { useEffect, useRef } from 'react'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { firebaseApp } from '@/src/lib/firebase/client'
import { supabase } from '@/lib/supabase/client'

/**
 * NotificationProvider — handles:
 * 1. Requesting notification permission
 * 2. Getting FCM token & saving to user_devices table
 * 3. Listening for foreground messages via onMessage
 *
 * Must be rendered inside the layout (client-side only).
 */
export default function NotificationProvider() {
  const hasRegistered = useRef(false)

  useEffect(() => {
    if (hasRegistered.current) return
    hasRegistered.current = true

    async function setupNotifications() {
      try {
        // 1. Check if user is logged in
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          console.log('[NotificationProvider] No session, skipping FCM registration')
          return
        }

        const userId = session.user.id

        // 2. Check if notifications are supported
        if (!('Notification' in window)) {
          console.warn('[NotificationProvider] Notifications not supported')
          return
        }

        // 3. Request permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          console.warn('[NotificationProvider] Notification permission denied')
          return
        }

        // 4. Wait for service worker to be ready
        const swRegistration = await navigator.serviceWorker.ready
        console.log('[NotificationProvider] Service worker ready')

        // 5. Get FCM token
        const messaging = getMessaging(firebaseApp)
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        })

        if (!token) {
          console.warn('[NotificationProvider] Failed to get FCM token')
          return
        }

        console.log('[NotificationProvider] FCM token obtained:', token.slice(0, 20) + '...')

        // 6. Save token to user_devices (upsert so we don't duplicate)
        const { error } = await supabase.from('user_devices').upsert(
          {
            user_id: userId,
            fcm_token: token,
            device_type: 'web',
            device_name: navigator.userAgent.slice(0, 100),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,fcm_token',
          }
        )

        if (error) {
          console.error('[NotificationProvider] Failed to save token:', error.message)
        } else {
          console.log('[NotificationProvider] FCM token saved to user_devices')
        }

        // 7. Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('[NotificationProvider] Foreground message received:', payload)

          const title = payload.notification?.title || 'Notifikasi'
          const body = payload.notification?.body || ''

          // Show a browser notification even when app is in foreground
          if (Notification.permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/logo/Laundry2.png',
              tag: 'fcm-foreground',
            })
          }
        })
      } catch (err) {
        console.error('[NotificationProvider] Setup error:', err)
      }
    }

    setupNotifications()
  }, [])

  return null
}
