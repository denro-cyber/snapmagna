// POST /api/orders
// Receives: { orderId, pack, price, photoUrls, ts }
// Saves order details — photoUrls are Cloudinary links

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { orderId, pack, price, photoUrls, ts } = req.body

  // Log the order with Cloudinary URLs
  console.log('=== NEW ORDER ===')
  console.log(`Order ID: ${orderId}`)
  console.log(`Pack: ${pack} magnets · ${price}`)
  console.log(`Photos (${photoUrls?.length}):`)
  photoUrls?.forEach((url, i) => console.log(`  ${i+1}. ${url}`))
  console.log(`Time: ${new Date(ts).toLocaleString()}`)
  console.log('================')

  // Return success
  res.status(200).json({
    success: true,
    orderId,
    message: 'Order received! Photos saved to Cloudinary.',
    photoUrls,
  })
}
