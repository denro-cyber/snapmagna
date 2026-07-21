// Simple file-based order storage using Vercel KV or in-memory
// This stores orders when placed and retrieves them for dashboard

// In-memory store (resets on redeploy — we'll upgrade to persistent later)
const orderStore = global.orderStore || (global.orderStore = [])

export default async function handler(req, res) {
  
  // GET — return all orders
  if (req.method === 'GET') {
    return res.status(200).json({ 
      orders: orderStore.sort((a,b) => b.ts - a.ts),
      total: orderStore.length 
    })
  }

  // POST — save new order
  if (req.method === 'POST') {
    const { orderId, pack, price, photoUrls, ts } = req.body

    console.log('=== NEW ORDER ===')
    console.log(`Order: ${orderId} · ${pack} pack · ${price}`)
    photoUrls?.forEach((url, i) => console.log(`  Photo ${i+1}: ${url}`))

    // Save to store
    orderStore.push({
      orderId,
      pack,
      price,
      photos: (photoUrls || []).map((url, i) => ({
        slot: `slot_${i+1}`,
        url,
        thumbnail: url.replace('/upload/', '/upload/w_300,h_300,c_fill/'),
      })),
      ts: ts || Date.now(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    })

    return res.status(200).json({ 
      success: true, 
      orderId,
      message: 'Order saved!',
    })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
