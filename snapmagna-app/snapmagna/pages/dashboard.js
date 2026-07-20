import { useState, useEffect, useRef, useCallback } from 'react'
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

// Template slot positions (in the 2551x3301 template PNG)
const SLOTS = [
  [377, 227,  1123, 973 ],
  [1427,227,  2173, 973 ],
  [377, 1277, 1123, 2023],
  [1427,1277, 2173, 2023],
  [377, 2327, 1123, 3073],
  [1427,2327, 2173, 3073],
]
const TEMPLATE_W = 2551
const TEMPLATE_H = 3301

// ── Generate print PDF from order photos ──────────────
async function generatePDF(order) {
  return new Promise(async (resolve, reject) => {
    try {
      // Load jsPDF dynamically
      const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })

      // Load template image
      const templateImg = await loadImage('/template.png')

      // Split photos into sheets of 6
      const photos = order.photos
      for (let sheetIdx = 0; sheetIdx * 6 < photos.length; sheetIdx++) {
        if (sheetIdx > 0) pdf.addPage()

        const chunk = photos.slice(sheetIdx * 6, sheetIdx * 6 + 6)

        // Create canvas for this sheet
        const canvas  = document.createElement('canvas')
        canvas.width  = TEMPLATE_W
        canvas.height = TEMPLATE_H
        const ctx = canvas.getContext('2d')

        // White background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, TEMPLATE_W, TEMPLATE_H)

        // Draw each photo into its slot
        for (let i = 0; i < chunk.length; i++) {
          const [x1, y1, x2, y2] = SLOTS[i]
          const slotW = x2 - x1
          const slotH = y2 - y1
          try {
            const photoImg = await loadImage(chunk[i].url + '?_t=' + Date.now())
            ctx.drawImage(photoImg, x1, y1, slotW, slotH)
          } catch (e) {
            // If photo fails to load, draw a placeholder
            ctx.fillStyle = '#F5E9D5'
            ctx.fillRect(x1, y1, slotW, slotH)
          }
        }

        // Overlay the template frame on top
        ctx.drawImage(templateImg, 0, 0, TEMPLATE_W, TEMPLATE_H)

        // Add the canvas to PDF (8.5 x 11 inches)
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11)
      }

      pdf.save(`SnapMagna_${order.orderId}.pdf`)
      resolve()
    } catch (err) {
      reject(err)
    }
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// ── Order card ─────────────────────────────────────────
function OrderCard({ order, onComplete }) {
  const [generating, setGenerating] = useState(false)
  const [done,       setDone]       = useState(false)

  const handlePrint = async () => {
    setGenerating(true)
    try {
      await generatePDF(order)
    } catch (err) {
      alert('PDF generation failed. Please try again.\n' + err.message)
    }
    setGenerating(false)
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs  = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hrs < 24)  return `${hrs}h ago`
    return `${days}d ago`
  }

  return (
    <div style={{
      background: done ? C.greenLight : C.white,
      border: `1px solid ${done ? '#A8D5B0' : C.border}`,
      borderRadius: 14, padding: '16px',
      marginBottom: 14, transition: 'all 0.3s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.brown }}>{order.orderId}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{timeAgo(order.createdAt)}</div>
        </div>
        <div style={{
          fontSize: 11, padding: '3px 10px', borderRadius: 20,
          background: done ? C.greenLight : C.goldLight,
          color: done ? C.green : C.gold, border: `1px solid ${done ? '#A8D5B0' : C.border}`,
        }}>
          {done ? '✅ Complete' : `📸 ${order.photos.length} photos`}
        </div>
      </div>

      {/* Photo thumbnails */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(order.photos.length, 6)}, 1fr)`,
        gap: 4, marginBottom: 12,
      }}>
        {order.photos.map((photo, i) => (
          <div key={i} style={{
            aspectRatio: '1', borderRadius: 6, overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}>
            <img
              src={photo.thumbnail}
              alt={`Slot ${i+1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              crossOrigin="anonymous"
            />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      {!done ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handlePrint}
            disabled={generating}
            style={{
              flex: 2, padding: '10px', borderRadius: 8, border: 'none',
              background: generating ? C.border : C.gold,
              color: C.white, fontSize: 13, cursor: generating ? 'not-allowed' : 'pointer',
              fontFamily: 'Georgia, serif',
            }}
          >
            {generating ? '⏳ Generating PDF…' : '🖨 Print PDF'}
          </button>
          <button
            onClick={() => { setDone(true); onComplete(order.orderId) }}
            style={{
              flex: 1, padding: '10px', borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: 'transparent', color: C.muted,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            ✓ Done
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 13, color: C.green }}>
          ✅ Marked as complete · magnet pressed and shipped!
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────
export default function Dashboard() {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [completed, setCompleted] = useState(new Set())
  const [filter,    setFilter]    = useState('pending')

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch('/api/get-orders')
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
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleComplete = (orderId) => {
    setCompleted(prev => new Set([...prev, orderId]))
  }

  const pending   = orders.filter(o => !completed.has(o.orderId))
  const done      = orders.filter(o =>  completed.has(o.orderId))
  const displayed = filter === 'pending' ? pending : done

  return (
    <>
      <Head>
        <title>SnapMagna — Operator Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Georgia, serif; background: ${C.cream}; color: ${C.brown}; -webkit-font-smoothing: antialiased; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </Head>

      {/* Header */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.border}`,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 12, padding: '4px 12px', borderRadius: 20,
            background: C.goldLight, color: C.gold,
          }}>
            {pending.length} pending
          </div>
          <button
            onClick={() => { setLoading(true); fetchOrders() }}
            style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.muted, cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['pending', 'completed'].map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={{
              padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === tab ? C.gold : C.white,
              color: filter === tab ? C.white : C.muted,
              fontSize: 13, fontFamily: 'Georgia, serif',
              boxShadow: filter === tab ? 'none' : `0 0 0 1px ${C.border}`,
            }}>
              {tab === 'pending' ? `Pending (${pending.length})` : `Done (${done.length})`}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              width: 36, height: 36, border: `3px solid ${C.border}`,
              borderTop: `3px solid ${C.gold}`, borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <p style={{ fontSize: 13, color: C.muted }}>Loading orders…</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            background: '#FEE', borderRadius: 10, padding: '14px 16px',
            border: '1px solid #F5C6CB', color: C.red, fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {filter === 'pending' ? '📭' : '🎉'}
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

        {/* Order list */}
        {!loading && displayed.map(order => (
          <div key={order.orderId} style={{ animation: 'fadeUp 0.3s ease both' }}>
            <OrderCard order={order} onComplete={handleComplete} />
          </div>
        ))}

        {/* Auto-refresh note */}
        {!loading && orders.length > 0 && (
          <p style={{ fontSize: 11, color: C.border, textAlign: 'center', marginTop: 8 }}>
            Auto-refreshes every 30 seconds
          </p>
        )}
      </div>
    </>
  )
}
