// pages/api/get-orders.js
// Legacy shim — forwards GET requests to /api/orders
// Keeps any old dashboard code working without changes

export default async function handler(req, res) {
  const host    = req.headers.host
  const proto   = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const apiRes  = await fetch(`${proto}://${host}/api/orders`, {
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await apiRes.json()
  return res.status(apiRes.status).json(data)
}
