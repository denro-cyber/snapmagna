// pages/api/template.js
// Serves the template PNG by fetching it from GitHub raw URL

export default async function handler(req, res) {
  try {
    const githubUrl = 'https://raw.githubusercontent.com/denro-cyber/snapmagna/main/snapmagna-app/snapmagna/template.png'
    const response = await fetch(githubUrl)
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`)
    const buffer = await response.arrayBuffer()
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(Buffer.from(buffer))
  } catch (err) {
    res.status(500).json({ error: 'Template load failed: ' + err.message })
  }
}
