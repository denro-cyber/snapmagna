// GET /api/get-orders
// Fetches all orders from Cloudinary orders/ folder

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'nvkjjpn9'
  const API_KEY    = process.env.CLOUDINARY_API_KEY
  const API_SECRET = process.env.CLOUDINARY_API_SECRET

  try {
    // Fetch all resources in the orders/ folder
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')
    const url  = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?prefix=orders/&max_results=100&type=upload`

    const response = await fetch(url, {
      headers: { Authorization: `Basic ${auth}` }
    })

    const data = await response.json()

    // Group photos by order ID
    const orders = {}
    for (const resource of (data.resources || [])) {
      // public_id format: orders/ORD-xxxxx/slot_1
      const parts   = resource.public_id.split('/')
      const orderId = parts[1]   // e.g. ORD-1234567890
      const slot    = parts[2]   // e.g. slot_1

      if (!orderId) continue

      if (!orders[orderId]) {
        orders[orderId] = {
          orderId,
          photos: [],
          createdAt: resource.created_at,
          status: 'pending',
        }
      }

      orders[orderId].photos.push({
        slot,
        url: resource.secure_url,
        // Generate a 300x300 thumbnail URL
        thumbnail: resource.secure_url.replace('/upload/', '/upload/w_300,h_300,c_fill/'),
      })
    }

    // Sort photos within each order by slot number
    const orderList = Object.values(orders).map(order => ({
      ...order,
      photos: order.photos.sort((a, b) => {
        const numA = parseInt(a.slot.replace('slot_', ''))
        const numB = parseInt(b.slot.replace('slot_', ''))
        return numA - numB
      }),
    }))

    // Sort orders newest first
    orderList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.status(200).json({ orders: orderList, total: orderList.length })

  } catch (err) {
    console.error('Cloudinary error:', err)
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message })
  }
}
