// pages/api/orders.js
// GET    /api/orders            — list all orders
// POST   /api/orders            — create new order
// PATCH  /api/orders            — mark order complete  { orderId, completed: true }
// DELETE /api/orders            — clear all orders     (no body)
// DELETE /api/orders?id=ORD-xx  — delete single order
//
// Persistence: Upstash Redis via REST API
// Set these in Vercel environment variables:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const ORDERS_KEY  = 'snapmagna:orders'

// ── Upstash REST helpers ──────────────────────────────────────────────────────

async function redisCmd(...args) {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  })
  const json = await res.json()
  if (json.error) throw new Error(`Redis error: ${json.error}`)
  return json.result
}

async function getOrders() {
  const raw = await redisCmd('GET', ORDERS_KEY)
  if (!raw) return []
  return JSON.parse(raw)
}

async function saveOrders(orders) {
  await redisCmd('SET', ORDERS_KEY, JSON.stringify(orders))
}

// ── Route handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Fallback: if Redis not configured, use in-memory (old behaviour)
  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({
      error: 'Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.',
    })
  }

  try {
    // ── GET — list all orders ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const orders = await getOrders()
      return res.status(200).json({ orders })
    }

    // ── POST — create order ───────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { orderId, pack, price, photoUrls, ts } = req.body

      if (!orderId || !photoUrls?.length) {
        return res.status(400).json({ error: 'orderId and photoUrls are required' })
      }

      const newOrder = {
        orderId,
        pack,
        price,
        photos: photoUrls.map((url, i) => ({ slot: i + 1, url })),
        ts: ts || Date.now(),
        completed: false,
        completedAt: null,
      }

      const orders = await getOrders()
      // Prevent duplicate order IDs
      if (!orders.find(o => o.orderId === orderId)) {
        orders.unshift(newOrder)          // newest first
        await saveOrders(orders)
      }

      console.log(`[SnapMagna] New order: ${orderId} · ${pack} magnets`)

      return res.status(200).json({ success: true, orderId })
    }

    // ── PATCH — mark complete ─────────────────────────────────────────────────
    if (req.method === 'PATCH') {
      const { orderId, completed } = req.body

      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' })
      }

      const orders = await getOrders()
      const idx    = orders.findIndex(o => o.orderId === orderId)

      if (idx === -1) {
        return res.status(404).json({ error: 'Order not found' })
      }

      orders[idx].completed   = completed ?? true
      orders[idx].completedAt = completed ? Date.now() : null
      await saveOrders(orders)

      return res.status(200).json({ success: true })
    }

    // ── DELETE — remove one or all ────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.query   // ?id=ORD-xxx to delete one

      if (id) {
        const orders = await getOrders()
        await saveOrders(orders.filter(o => o.orderId !== id))
        return res.status(200).json({ success: true, deleted: id })
      }

      // No id param → clear everything
      await saveOrders([])
      return res.status(200).json({ success: true, deleted: 'all' })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (err) {
    console.error('[SnapMagna orders API]', err)
    return res.status(500).json({ error: err.message })
  }
}
