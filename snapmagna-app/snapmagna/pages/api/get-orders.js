export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'nvkjjpn9'
  const API_KEY    = process.env.CLOUDINARY_API_KEY
  const API_SECRET = process.env.CLOUDINARY_API_SECRET

  try {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')

    // Fetch ALL images to see what paths exist
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?max_results=50&type=upload`

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` }
    })

    const data = await response.json()

    // Log all public_ids so we can see exact paths
    const allPaths = (data.resources || []).map(r => ({
      public_id: r.public_id,
      created_at: r.created_at,
      url: r.secure_url,
    }))

    console.log('ALL PATHS IN CLOUDINARY:')
    allPaths.forEach(p => console.log(' -', p.public_id))

    // Now group by ORD- pattern regardless of path
    const orders = {}

    for (const resource of (data.resources || [])) {
      const pubId = resource.public_id

      // Match ORD- pattern anywhere in the path
      const match = pubId.match(/ORD-\d+/)
      if (!match) continue

      const orderId = match[0]

      if (!orders[orderId]) {
        orders[orderId] = {
          orderId,
          photos: [],
          createdAt: resource.created_at,
        }
      }

      orders[orderId].photos.push({
        slot: pubId,
        url: resource.secure_url,
        thumbnail: resource.secure_url.replace('/upload/', '/upload/w_300,h_300,c_fill/'),
      })
    }

    const orderList = Object.values(orders).map(order => ({
      ...order,
      photos: order.photos.sort((a, b) => a.slot.localeCompare(b.slot)),
    }))

    orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Return both the orders AND all paths for debugging
    res.status(200).json({
      orders: orderList,
      total: orderList.length,
      debug_all_paths: allPaths.map(p => p.public_id),
    })

  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: err.message })
  }
}
