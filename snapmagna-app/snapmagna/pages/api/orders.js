// Combined orders API — handles GET (list) and POST (save)
// Uses global in-memory store — persists until Vercel redeploys

const store = global._orders || (global._orders = [])

export default async function handler(req, res) {

  // GET — return all orders newest first
  if (req.method === 'GET') {
    return res.status(200).json({
      orders: [...store].sort((a, b) => b.ts - a.ts),
      total: store.length,
    })
  }

  // DELETE — clear all orders (for testing)
  if (req.method === 'DELETE') {
    store.length = 0
    return res.status(200).json({ success: true, message: 'All orders cleared' })
  }

  // POST — save new order
  if (req.method === 'POST') {
    const { orderId, pack, price, photoUrls, mode, ts } = req.body

    if (!orderId || !photoUrls?.length) {
      return res.status(400).json({ error: 'Missing orderId or photoUrls' })
    }

    console.log(`New order: ${orderId} · ${pack} pack · ${mode || 'event'} mode`)
    console.log(`Photos: ${photoUrls.length}`)
    photoUrls.forEach((url, i) => console.log(`  ${i+1}. ${url}`))

    const order = {
      orderId,
      pack,
      price,
      mode: mode || 'event',
      photos: photoUrls.map((url, i) => ({
        slot: `slot_${i + 1}`,
        url,
        thumbnail: url.replace('/upload/', '/upload/w_300,h_300,c_fill/'),
      })),
      ts: ts || Date.now(),
      createdAt: new Date().toISOString(),
    }

    // Remove duplicate if same orderId exists
    const existing = store.findIndex(o => o.orderId === orderId)
    if (existing >= 0) store.splice(existing, 1)

    // Add to front
    store.unshift(order)

    // Keep max 100 orders
    if (store.length > 100) store.splice(100)

    return res.status(200).json({
      success: true,
      orderId,
      photoCount: photoUrls.length,
    })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
