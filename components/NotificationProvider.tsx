'use client'

import { useEffect, useRef } from 'react'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { firebaseApp } from '@/src/lib/firebase/client'
import { supabase } from '@/lib/supabase/client'

export default function NotificationProvider() {
  const hasRegistered = useRef(false)

  useEffect(() => {
    // Listen ke auth state — jalan setiap kali session berubah
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Hanya jalankan saat user baru login atau sudah ada session
      if (!session?.user || hasRegistered.current) return
      hasRegistered.current = true

      const userId = session.user.id

      try {
        if (!('Notification' in window)) {
          console.warn('[NotificationProvider] Notifications not supported')
          return
        }

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          console.warn('[NotificationProvider] ⚠️ Notification permission denied by user')
          // Store that user denied for later reference
          localStorage.setItem('notification_permission_denied', 'true')
          return
        }
        
        console.log('[NotificationProvider] ✅ Notification permission granted')

        const swRegistration = await navigator.serviceWorker.ready
        console.log('[NotificationProvider] ✅ Service worker registered:', swRegistration.scope)

        const messaging = getMessaging(firebaseApp)
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        })

        if (!token) {
          console.error('[NotificationProvider] ❌ Failed to get FCM token - check Firebase config')
          return
        }

        console.log('[NotificationProvider] ✅ FCM token received:', token.slice(0, 20) + '...')

        const { error } = await supabase.from('user_devices').upsert(
          {
            user_id: userId,
            fcm_token: token,
            device_type: 'web',
            device_name: navigator.userAgent.slice(0, 100),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,fcm_token' }
        )

        if (error) {
          console.error('[NotificationProvider] Failed to save token:', error.message)
        } else {
          console.log('[NotificationProvider] Token saved successfully')
        }

        // Foreground message handler
        onMessage(messaging, (payload) => {
          console.log('[NotificationProvider] Foreground message:', payload)
          const title = payload.notification?.title || 'Notifikasi'
          const body = payload.notification?.body || ''
          
          // Emit custom event untuk NotificationToast component (in-app)
          const event = new CustomEvent('notification:received', {
            detail: {
              title,
              body,
              timestamp: new Date(),
              type: 'info',
            },
          })
          window.dispatchEvent(event)
          
          // Also show OS notification via Service Worker
          if (swRegistration && Notification.permission === 'granted') {
            try {
              swRegistration.showNotification(title, {
                body,
                icon: '/logo/Laundry2.png',
                badge: '/logo/Laundry2.png',
                tag: 'laundry-notification',
                renotify: true,
                requireInteraction: true,
                color: '#6366f1',
                vibrate: [200, 100, 200],
                sound: 'default',
                silent: false,
                dir: 'ltr',
                data: {
                  link: payload.webpush?.fcmOptions?.link || '/',
                  timestamp: Date.now(),
                },
              })
              console.log('[NotificationProvider] ✅ OS notification shown (foreground)')
            } catch (err) {
              console.error('[NotificationProvider] ❌ Failed to show OS notification:', err)
            }
          }
        })

      } catch (err) {
        console.error('[NotificationProvider] Setup error:', err)
      }
    })

    // Cleanup listener saat unmount
    return () => subscription.unsubscribe()
  }, [])

  return null
}