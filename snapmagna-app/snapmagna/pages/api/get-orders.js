export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'nvkjjpn9'
  const API_KEY    = process.env.CLOUDINARY_API_KEY
  const API_SECRET = process.env.CLOUDINARY_API_SECRET

  try {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')

    const searchUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expression: 'public_id:orders/ORD-*',
        max_results: 200,
        sort_by: [{ created_at: 'desc' }],
      })
    })

    const data = await response.json()
    console.log('Search result:', JSON.stringify(data).slice(0, 300))

    const orders = {}

    for (const resource of (data.resources || [])) {
      const pubId = resource.public_id
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

    res.status(200).json({ orders: orderList, total: orderList.length })

  } catch (err) {
    console.error('Error:', err)
    res.status(500).json({ error: err.message })
  }
}
