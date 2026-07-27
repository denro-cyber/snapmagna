// pages/api/template.js
// Serves the template PNG by fetching from GitHub with cache-busting

export default async function handler(req, res) {
  try {
    // Add timestamp to bypass GitHub CDN cache
    const githubUrl = 'https://raw.githubusercontent.com/denro-cyber/snapmagna/main/snapmagna-app/snapmagna/template.png?t=' + Date.now()
    const response = await fetch(githubUrl, { cache: 'no-store' })
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
    const buffer = await response.arrayBuffer()
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(Buffer.from(buffer))
  } catch (err) {
    res.status(500).json({ error: 'Template load failed: ' + err.message })
  }
}
