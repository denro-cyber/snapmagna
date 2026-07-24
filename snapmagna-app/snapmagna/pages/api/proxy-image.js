// pages/api/proxy-image.js
// Proxies Cloudinary images through your own domain to avoid CORS issues in canvas/PDF generation

export default async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'url parameter required' })
  }

  // Only allow Cloudinary URLs for security
  if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
    return res.status(403).json({ error: 'Only Cloudinary URLs allowed' })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(Buffer.from(buffer))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
