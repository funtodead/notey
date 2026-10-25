/** Talks to Notey's push Worker (see worker/), which sends notifications at the right time. */

const PUSH_API = 'https://notey-push.notey-push.workers.dev'
// Public half of the Worker's VAPID key pair; the private half is a Cloudflare secret.
const VAPID_PUBLIC_KEY = 'BIhyhZrz7Q8XwmHZ7LN0xHgS_Kd0WkbK5TzMDGMF0wzRjftCHf5i96QqB08zN4u-VjBhiaObRVG9pkptW4y2Bms'

export interface ScheduledNotification {
  id: string
  /** Epoch milliseconds */
  at: number
  title: string
  body: string
}

/** iOS only allows push in apps opened from the Home Screen (16.4+). */
export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

async function api(path: string, method: string, body?: unknown) {
  const response = await fetch(`${PUSH_API}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error(`Push server answered ${response.status}`)
}

/** Asks for permission and registers this phone. Resolves false if notifications were refused. */
export async function subscribe(deviceId: string) {
  if ((await Notification.requestPermission()) !== 'granted') return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: Uint8Array.from(atob(VAPID_PUBLIC_KEY.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
      c.charCodeAt(0),
    ),
  })
  await api(`/devices/${deviceId}`, 'PUT', { subscription: subscription.toJSON() })
  return true
}

export async function unsubscribe(deviceId: string) {
  const registration = await navigator.serviceWorker.ready
  await (await registration.pushManager.getSubscription())?.unsubscribe()
  await api(`/devices/${deviceId}`, 'DELETE')
}

/** Replaces everything the Worker will send to this phone. */
export const sendSchedule = (deviceId: string, notifications: ScheduledNotification[]) =>
  api(`/devices/${deviceId}/reminders`, 'PUT', { reminders: notifications })

export const sendTest = (deviceId: string) => api(`/devices/${deviceId}/test`, 'POST')
