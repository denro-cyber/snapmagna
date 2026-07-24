import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const C = {
  gold:      '#C4964A',
  goldLight: '#F5E9D5',
  brown:     '#2C2415',
  muted:     '#7A6A52',
  border:    '#E8DFD0',
  cream:     '#FAF7F2',
  white:     '#FFFFFF',
  green:     '#2D7A3A',
  greenLight:'#E8F5EB',
  red:       '#C0392B',
}

const SLOTS = [
  [335, 183,  1165, 1013],
  [1383,183,  2214, 1013],
  [335, 1234, 1165, 2064],
  [1383,1234, 2214, 2064],
  [335, 2285, 1165, 3116],
  [1383,2285, 2214, 3116],
]
const TEMPLATE_W = 1545
const TEMPLATE_H = 2000
const TEMPLATE_SRC = '/api/template'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function generatePDF(order) {
  return new Promise(async (resolve, reject) => {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
      const jsPDF = window.jspdf && window.jspdf.jsPDF
      if (!jsPDF) throw new Error('jsPDF failed to load from CDN')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })
      const templateImg = await loadImage(TEMPLATE_SRC)
      const photos = order.photos
      for (let sheetIdx = 0; sheetIdx * 6 < photos.length; sheetIdx++) {
        if (sheetIdx > 0) pdf.addPage()
        const chunk = photos.slice(sheetIdx * 6, sheetIdx * 6 + 6)
        const canvas = document.createElement('canvas')
        canvas.width  = TEMPLATE_W
        canvas.height = TEMPLATE_H
        const ctx = canvas.getContext('2d')
        // Step 1: white background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, TEMPLATE_W, TEMPLATE_H)

        // Step 2: draw photos into slots
        for (let i = 0; i < chunk.length; i++) {
          const [x1, y1, x2, y2] = SLOTS[i]
          const slotW = x2 - x1
          const slotH = y2 - y1
          try {
            const proxiedUrl = '/api/proxy-image?url=' + encodeURIComponent(chunk[i].url)
            const photoImg = await loadImage(proxiedUrl)
            const imgW = photoImg.naturalWidth
            const imgH = photoImg.naturalHeight
            const scale = Math.max(slotW / imgW, slotH / imgH)
            const drawW = imgW * scale
            const drawH = imgH * scale
            const offsetX = x1 + (slotW - drawW) / 2
            const offsetY = y1 + (slotH - drawH) / 2
            ctx.save()
            ctx.beginPath()
            ctx.rect(x1, y1, slotW, slotH)
            ctx.clip()
            ctx.drawImage(photoImg, offsetX, offsetY, drawW, drawH)
            ctx.restore()
          } catch {
            ctx.fillStyle = '#F5E9D5'
            ctx.fillRect(x1, y1, slotW, slotH)
          }
        }

        // Step 3: overlay template PNG using a second canvas to handle transparency
        const composite = document.createElement('canvas')
        composite.width  = TEMPLATE_W
        composite.height = TEMPLATE_H
        const cctx = composite.getContext('2d')
        // Draw photos layer first
        cctx.drawImage(canvas, 0, 0)
        // Draw template on top (transparent slots let photos show through)
        cctx.drawImage(templateImg, 0, 0, TEMPLATE_W, TEMPLATE_H)
        // Export as PNG to preserve transparency compositing
        pdf.addImage(composite.toDataURL('image/png'), 'PNG', 0, 0, 8.5, 11)
      }
      pdf.save('SnapMagna_' + order.orderId + '.pdf')
      resolve()
    } catch (err) { reject(err) }
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return mins + 'm ago'
  if (hrs < 24)  return hrs + 'h ago'
  return days + 'd ago'
}

function OrderCard({ order, onComplete }) {
  const [generating, setGenerating] = useState(false)
  const [marking,    setMarking]    = useState(false)
  const isDone = order.completed

  const handlePrint = async () => {
    setGenerating(true)
    try { await generatePDF(order) }
    catch (err) { alert('PDF generation failed.\n' + err.message) }
    setGenerating(false)
  }

  const handleComplete = async () => {
    setMarking(true)
    await onComplete(order.orderId)
    setMarking(false)
  }

  return (
    <div style={{
      background: isDone ? C.greenLight : C.white,
      border: '1px solid ' + (isDone ? '#A8D5B0' : C.border),
      borderRadius: 14, padding: '16px', marginBottom: 14, transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.brown }}>{order.orderId}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {timeAgo(order.ts)}{order.pack ? ' · ' + order.pack + ' magnets' : ''}{order.price ? ' · ' + order.price : ''}
          </div>
        </div>
        <div style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 20,
          background: isDone ? C.greenLight : C.goldLight,
          color: isDone ? C.green : C.gold,
          border: '1px solid ' + (isDone ? '#A8D5B0' : C.border),
        }}>
          {isDone ? 'Complete' : (order.photos ? order.photos.length + ' photos' : '')}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(' + Math.min((order.photos || []).length, 6) + ', 1fr)',
        gap: 4, marginBottom: 12,
      }}>
        {(order.photos || []).map((photo, i) => (
          <div key={i} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', border: '1px solid ' + C.border }}>
            <img src={photo.url} alt={'Slot ' + (i+1)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          </div>
        ))}
      </div>

      {!isDone ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handlePrint} disabled={generating} style={{
            flex: 2, padding: '10px', borderRadius: 8, border: 'none',
            background: generating ? C.border : C.gold,
            color: C.white, fontSize: 13, cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif',
          }}>
            {generating ? 'Generating PDF\u2026' : '\uD83D\uDDA8 Print PDF'}
          </button>
          <button onClick={handleComplete} disabled={marking} style={{
            flex: 1, padding: '10px', borderRadius: 8,
            border: '1px solid ' + C.border, background: 'transparent',
            color: C.muted, fontSize: 13, cursor: marking ? 'not-allowed' : 'pointer',
          }}>
            {marking ? '\u2026' : '\u2713 Done'}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 13, color: C.green }}>
          Marked complete{order.completedAt ? ' \u00B7 ' + timeAgo(order.completedAt) : ''}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [filter,   setFilter]   = useState('pending')
  const [clearing, setClearing] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch('/api/orders')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOrders(data.orders || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleComplete = async (orderId) => {
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, completed: true }),
      })
      setOrders(prev => prev.map(o =>
        o.orderId === orderId ? { ...o, completed: true, completedAt: Date.now() } : o
      ))
    } catch (err) {
      alert('Could not save status: ' + err.message)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Clear ALL orders from the database? This cannot be undone.')) return
    setClearing(true)
    try {
      await fetch('/api/orders', { method: 'DELETE' })
      setOrders([])
    } catch (err) {
      alert('Clear failed: ' + err.message)
    } finally {
      setClearing(false)
    }
  }

  const pending   = orders.filter(o => !o.completed)
  const done      = orders.filter(o =>  o.completed)
  const displayed = filter === 'pending' ? pending : done

  return (
    <>
      <Head>
        <title>SnapMagna - Operator Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Georgia, serif; background: ${C.cream}; color: ${C.brown}; -webkit-font-smoothing: antialiased; }
          @keyframes spin   { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </Head>

      <div style={{
        background: C.white, borderBottom: '1px solid ' + C.border,
        padding: '14px 20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 18, color: C.gold, letterSpacing: 1 }}>
            snap<span style={{ color: C.brown }}>magna</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>Operator Dashboard</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: C.goldLight, color: C.gold }}>
            {pending.length} pending
          </div>
          <button onClick={() => { setLoading(true); fetchOrders() }} style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 20,
            border: '1px solid ' + C.border, background: 'transparent',
            color: C.muted, cursor: 'pointer',
          }}>
            Refresh
          </button>
          {orders.length > 0 && (
            <button onClick={handleClearAll} disabled={clearing} style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 20,
              border: '1px solid ' + C.red + '40', background: 'transparent',
              color: C.red, cursor: clearing ? 'not-allowed' : 'pointer', opacity: clearing ? 0.5 : 1,
            }}>
              {clearing ? 'Clearing\u2026' : 'Clear all'}
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 48px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['pending', 'completed'].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={{
              padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === tab ? C.gold : C.white,
              color: filter === tab ? C.white : C.muted,
              fontSize: 13, fontFamily: 'Georgia, serif',
              boxShadow: filter === tab ? 'none' : '0 0 0 1px ' + C.border,
            }}>
              {tab === 'pending' ? 'Pending (' + pending.length + ')' : 'Done (' + done.length + ')'}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              width: 36, height: 36, border: '3px solid ' + C.border,
              borderTop: '3px solid ' + C.gold, borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ fontSize: 13, color: C.muted }}>Loading orders\u2026</p>
          </div>
        )}

        {error && (
          <div style={{
            background: '#FEE', borderRadius: 10, padding: '14px 16px',
            border: '1px solid #F5C6CB', color: C.red, fontSize: 13, marginBottom: 16,
          }}>
            {error}
            {error.includes('Redis') && (
              <div style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel Environment Variables.
              </div>
            )}
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {filter === 'pending' ? '\uD83D\uDCED' : '\uD83C\uDF89'}
            </div>
            <div style={{ fontSize: 16, color: C.brown, marginBottom: 6 }}>
              {filter === 'pending' ? 'No pending orders' : 'No completed orders yet'}
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {filter === 'pending'
                ? 'New orders will appear here automatically'
                : 'Mark orders as done after pressing the magnets'}
            </div>
          </div>
        )}

        {!loading && displayed.map(order => (
          <div key={order.orderId} style={{ animation: 'fadeUp 0.3s ease both' }}>
            <OrderCard order={order} onComplete={handleComplete} />
          </div>
        ))}

        {!loading && orders.length > 0 && (
          <p style={{ fontSize: 11, color: C.border, textAlign: 'center', marginTop: 8 }}>
            Orders saved to database · auto-refreshes every 30 seconds
          </p>
        )}
      </div>
    </>
  )
}
