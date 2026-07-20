// POST /api/orders
// Receives: { image (base64), size, ts }
// For now saves to console — later connects to Firebase + PrintNode

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { image, size, ts } = req.body

  // Log the order (replace with Firebase save later)
  console.log(`New order: size=${size} timestamp=${ts} imageLength=${image?.length}`)

  // Return order confirmation
  res.status(200).json({
    success: true,
    orderId: Math.floor(1000 + Math.random() * 9000),
    size,
    ts,
  })
}
