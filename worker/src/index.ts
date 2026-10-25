import { buildPushPayload, type PushSubscription } from '@block65/webcrypto-web-push'

interface Env {
  DB: D1Database
  VAPID_PUBLIC_KEY: string
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
  /** The app's origin; browsers elsewhere can't call the API. */
  ALLOWED_ORIGIN: string
}

interface Reminder {
  id: string
  /** Epoch milliseconds */
  at: number
  title: string
  body: string
}

const MAX_REMINDERS = 500
const MAX_BRIDGE_BYTES = 300_000
// Device and bridge ids are random UUIDs made by the phone; knowing one is what lets you use it.
const DEVICE_PATH = /^\/devices\/([0-9a-f-]{36})(\/reminders|\/test)?$/
const BRIDGE_PATH = /^\/bridge\/([0-9a-f-]{36})$/

// Calendar links the feed fetcher will open; anything else is refused, so it can't be used as an open proxy.
const FEED_HOSTS = [/\.icloud\.com$/, /^calendar\.google\.com$/, /^outlook\.(office365|office|live)\.com$/, /^(www|download)\.hebcal\.com$/]

export default {
  async fetch(request, env, ctx) {
    // Browsers always send Origin; only Notey's may call. Without one it's e.g. the iPhone Shortcut.
    const origin = request.headers.get('Origin')
    const allowed = origin === env.ALLOWED_ORIGIN || !!origin?.startsWith('http://localhost:')
    const cors = {
      'Access-Control-Allow-Origin': allowed && origin ? origin : env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
    const reply = (status: number, body: unknown = null) =>
      new Response(body === null ? null : JSON.stringify(body), { status, headers: cors })

    if (request.method === 'OPTIONS') return reply(204)
    if (origin && !allowed) return reply(403)

    const url = new URL(request.url)

    // Fetch a published calendar for the app (iCloud and others don't allow it from a web page).
    if (url.pathname === '/feed' && request.method === 'GET') {
      let feed: URL
      try {
        feed = new URL((url.searchParams.get('url') ?? '').replace(/^webcal:/, 'https:'))
      } catch {
        return reply(400)
      }
      if (feed.protocol !== 'https:' || !FEED_HOSTS.some((host) => host.test(feed.hostname))) return reply(403)

      const cache = caches.default
      const cacheKey = new Request(`https://cache.notey/feed?url=${encodeURIComponent(feed.href)}`)
      let response = await cache.match(cacheKey)
      if (!response) {
        const upstream = await fetch(feed.href, { redirect: 'follow' })
        if (!upstream.ok) return reply(502, { status: upstream.status })
        response = new Response(await upstream.text(), {
          headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'max-age=300' },
        })
        ctx.waitUntil(cache.put(cacheKey, response.clone()))
      }
      return new Response(response.body, { headers: { ...cors, 'Content-Type': 'text/calendar; charset=utf-8' } })
    }

    // Events from an iPhone Shortcut (PUT), read back by the app (GET).
    const bridge = url.pathname.match(BRIDGE_PATH)
    if (bridge) {
      const [, bridgeId] = bridge
      if (request.method === 'PUT') {
        const text = await request.text()
        if (text.length > MAX_BRIDGE_BYTES) return reply(413)
        // Shortcuts may send the list itself or wrapped as { events: [...] }.
        const body = JSON.parse(text) as unknown
        const events = Array.isArray(body) ? body : (body as { events?: unknown })?.events
        if (!Array.isArray(events)) return reply(400)
        await env.DB.prepare(
          'INSERT INTO bridge (id, events, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT (id) DO UPDATE SET events = ?2, updated_at = ?3',
        )
          .bind(bridgeId, JSON.stringify(events), Date.now())
          .run()
        return reply(200, { saved: events.length })
      }
      if (request.method === 'GET') {
        const row = await env.DB.prepare('SELECT events, updated_at FROM bridge WHERE id = ?1')
          .bind(bridgeId)
          .first<{ events: string; updated_at: number }>()
        return reply(200, row ? { events: JSON.parse(row.events), updatedAt: row.updated_at } : { events: [], updatedAt: null })
      }
      return reply(405)
    }

    const match = url.pathname.match(DEVICE_PATH)
    if (!match) return reply(404)
    const [, deviceId, action] = match

    // Turn notifications on: remember where to push to.
    if (!action && request.method === 'PUT') {
      const { subscription } = await request.json<{ subscription: PushSubscription }>()
      if (!subscription?.endpoint?.startsWith('https://')) return reply(400)
      await env.DB.prepare(
        'INSERT INTO devices (id, subscription, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT (id) DO UPDATE SET subscription = ?2, updated_at = ?3',
      )
        .bind(deviceId, JSON.stringify(subscription), Date.now())
        .run()
      return reply(204)
    }

    // Turn notifications off.
    if (!action && request.method === 'DELETE') {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM reminders WHERE device_id = ?1').bind(deviceId),
        env.DB.prepare('DELETE FROM devices WHERE id = ?1').bind(deviceId),
      ])
      return reply(204)
    }

    const device = await env.DB.prepare('SELECT subscription FROM devices WHERE id = ?1')
      .bind(deviceId)
      .first<{ subscription: string }>()
    if (!device) return reply(404)

    // Replace everything this phone wants to be reminded of.
    if (action === '/reminders' && request.method === 'PUT') {
      const { reminders } = await request.json<{ reminders: Reminder[] }>()
      if (!Array.isArray(reminders) || reminders.length > MAX_REMINDERS) return reply(400)
      const valid = reminders.filter(
        (r) => typeof r.id === 'string' && Number.isFinite(r.at) && r.at > Date.now() && typeof r.title === 'string',
      )
      await env.DB.batch([
        env.DB.prepare('DELETE FROM reminders WHERE device_id = ?1').bind(deviceId),
        ...valid.map((r) =>
          env.DB.prepare('INSERT INTO reminders (device_id, id, at, title, body) VALUES (?1, ?2, ?3, ?4, ?5)').bind(
            deviceId,
            r.id.slice(0, 200),
            Math.round(r.at),
            r.title.slice(0, 200),
            (r.body ?? '').slice(0, 1000),
          ),
        ),
      ])
      return reply(200, { saved: valid.length })
    }

    // A notification right now, to check everything works.
    if (action === '/test' && request.method === 'POST') {
      const status = await push(env, JSON.parse(device.subscription), {
        title: 'Notifications are on',
        body: 'Notey will remind you here.',
      })
      return reply(status < 300 ? 200 : 502, { status })
    }

    return reply(405)
  },

  // Every minute: send what's due, then forget it.
  async scheduled(_controller, env) {
    const { results } = await env.DB.prepare(
      'SELECT r.device_id, r.id, r.title, r.body, d.subscription FROM reminders r JOIN devices d ON d.id = r.device_id WHERE r.at <= ?1',
    )
      .bind(Date.now())
      .all<{ device_id: string; id: string; title: string; body: string; subscription: string }>()

    for (const r of results) {
      const status = await push(env, JSON.parse(r.subscription), { title: r.title, body: r.body })
      // 404/410: the phone unsubscribed (e.g. Notey was removed), so drop it entirely.
      if (status === 404 || status === 410) {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM reminders WHERE device_id = ?1').bind(r.device_id),
          env.DB.prepare('DELETE FROM devices WHERE id = ?1').bind(r.device_id),
        ])
      } else {
        await env.DB.prepare('DELETE FROM reminders WHERE device_id = ?1 AND id = ?2').bind(r.device_id, r.id).run()
      }
    }
  },
} satisfies ExportedHandler<Env>

async function push(env: Env, subscription: PushSubscription, message: { title: string; body: string }) {
  const payload = await buildPushPayload(
    // Kept for an hour if the phone is offline; after that a reminder is too late to matter.
    { data: JSON.stringify(message), options: { ttl: 3600 } },
    subscription,
    { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY },
  )
  const response = await fetch(subscription.endpoint, payload)
  return response.status
}
