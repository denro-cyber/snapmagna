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
}

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
const TEMPLATE_URL = 'https://raw.githubusercontent.com/denro-cyber/snapmagna/main/snapmagna-app/snapmagna/public/template.png'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load: ' + src))
    img.src = src
  })
}

async function generatePDF(order) {
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  document.head.appendChild(script)
  await new Promise(res => { script.onload = res })

  const { jsPDF } = window.jspdf
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' })

  // Load template
  let templateImg = null
  try { templateImg = await loadImage(TEMPLATE_URL) } catch(e) { console.warn('Template load failed:', e) }

  const photos = order.photos
  for (let sheetIdx = 0; sheetIdx * 6 < photos.length; sheetIdx++) {
    if (sheetIdx > 0) pdf.addPage()
    const chunk = photos.slice(sheetIdx * 6, sheetIdx * 6 + 6)
    const canvas = document.createElement('canvas')
    canvas.width  = TEMPLATE_W
    canvas.height = TEMPLATE_H
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, TEMPLATE_W, TEMPLATE_H)

    for (let i = 0; i < chunk.length; i++) {
      const [x1, y1, x2, y2] = SLOTS[i]
      try {
        const photoImg = await loadImage(chunk[i].url)
        ctx.drawImage(photoImg, x1, y1, x2-x1, y2-y1)
      } catch(e) {
        ctx.fillStyle = '#F5E9D5'
        ctx.fillRect(x1, y1, x2-x1, y2-y1)
        console.warn('Photo load failed:', chunk[i].url)
      }
    }

    if (templateImg) ctx.drawImage(templateImg, 0, 0, TEMPLATE_W, TEMPLATE_H)

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11)
  }

  pdf.save(`SnapMagna_${order.orderId}.pdf`)
}

function OrderCard({ order, onComplete }) {
  const [generating, setGenerating] = useState(false)
  const [done,       setDone]       = useState(false)

  const handlePrint = async () => {
    setGenerating(true)
    try { await generatePDF(order) }
    catch(err) { alert('PDF failed: ' + err.message) }
    setGenerating(false)
  }

  const timeAgo = d => {
    const m = Math.floor((Date.now()-new Date(d))/60000)
    if (m<60) return m+'m ago'
    if (m<1440) return Math.floor(m/60)+'h ago'
    return Math.floor(m/1440)+'d ago'
  }

  return (
    <div style={{
      background: done ? C.greenLight : C.white,
      border: `1px solid ${done ? '#A8D5B0' : C.border}`,
      borderRadius: 14, padding: 16, marginBottom: 14,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:500, color:C.brown }}>{order.orderId}</div>
          <div style={{ fontSize:11, color:C.muted }}>{timeAgo(order.createdAt)} · {order.mode || 'event'} mode</div>
        </div>
        <div style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:C.goldLight, color:C.gold }}>
          {done ? '✅ Done' : `📸 ${order.photos.length} photos`}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(order.photos.length,6)},1fr)`, gap:4, marginBottom:12 }}>
        {order.photos.map((p,i) => (
          <div key={i} style={{ aspectRatio:'1', borderRadius:6, overflow:'hidden', border:`1px solid ${C.border}` }}>
            <img src={p.thumbnail} crossOrigin="anonymous"
              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
        ))}
      </div>

      {!done ? (
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handlePrint} disabled={generating} style={{
            flex:2, padding:10, borderRadius:8, border:'none',
            background: generating ? C.border : C.gold,
            color:'white', fontSize:13, cursor: generating?'not-allowed':'pointer',
            fontFamily:'Georgia,serif',
          }}>
            {generating ? '⏳ Generating PDF…' : '🖨 Print PDF'}
          </button>
          <button onClick={()=>{setDone(true);onComplete(order.orderId)}} style={{
            flex:1, padding:10, borderRadius:8,
            border:`1px solid ${C.border}`, background:'transparent',
            color:C.muted, fontSize:13, cursor:'pointer',
          }}>✓ Done</button>
        </div>
      ) : (
        <div style={{ textAlign:'center', fontSize:13, color:C.green }}>✅ Complete!</div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [completed, setCompleted] = useState(new Set())
  const [filter,    setFilter]    = useState('pending')

  const fetchOrders = useCallback(async () => {
    try {
      const res  = await fetch('/api/orders')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setOrders(data.orders || [])
      setError(null)
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchOrders()
    const t = setInterval(fetchOrders, 30000)
    return () => clearInterval(t)
  }, [fetchOrders])

  const clearOrders = async () => {
    if (!confirm('Clear all orders? This cannot be undone.')) return
    await fetch('/api/orders', { method: 'DELETE' })
    setOrders([])
    setCompleted(new Set())
  }

  const pending = orders.filter(o => !completed.has(o.orderId))
  const done    = orders.filter(o =>  completed.has(o.orderId))
  const shown   = filter === 'pending' ? pending : done

  return (
    <>
      <Head>
        <title>SnapMagna Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`* {box-sizing:border-box;margin:0;padding:0} body {font-family:Georgia,serif;background:#FAF7F2;color:#2C2415} @keyframes spin {to{transform:rotate(360deg)}}`}</style>
      </Head>

      <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <div style={{ fontSize:18, color:C.gold }}>snap<span style={{color:C.brown}}>magna</span></div>
          <div style={{ fontSize:11, color:C.muted }}>Operator Dashboard</div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ fontSize:12, padding:'4px 12px', borderRadius:20, background:C.goldLight, color:C.gold }}>{pending.length} pending</div>
          <button onClick={fetchOrders} style={{ fontSize:12, padding:'6px 14px', borderRadius:20, border:`1px solid ${C.border}`, background:'transparent', color:C.muted, cursor:'pointer' }}>↻ Refresh</button>
          <button onClick={clearOrders} style={{ fontSize:12, padding:'6px 14px', borderRadius:20, border:`1px solid #ffcccc`, background:'transparent', color:'#cc0000', cursor:'pointer' }}>🗑 Clear all</button>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 16px 48px' }}>
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {['pending','completed'].map(tab => (
            <button key={tab} onClick={()=>setFilter(tab)} style={{
              padding:'7px 18px', borderRadius:20, border:'none', cursor:'pointer',
              background: filter===tab ? C.gold : C.white,
              color: filter===tab ? C.white : C.muted,
              fontSize:13, boxShadow: filter===tab ? 'none' : `0 0 0 1px ${C.border}`,
            }}>
              {tab==='pending' ? `Pending (${pending.length})` : `Done (${done.length})`}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.gold}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
            <p style={{ fontSize:13, color:C.muted }}>Loading orders…</p>
          </div>
        )}

        {error && <div style={{ background:'#FEE', borderRadius:10, padding:'14px', color:'#C0392B', fontSize:13 }}>⚠️ {error}</div>}

        {!loading && shown.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 20px' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>{filter==='pending' ? '📭' : '🎉'}</div>
            <div style={{ fontSize:16, color:C.brown }}>{filter==='pending' ? 'No pending orders' : 'No completed orders'}</div>
          </div>
        )}

        {!loading && shown.map(order => (
          <OrderCard key={order.orderId} order={order}
            onComplete={id => setCompleted(prev => new Set([...prev, id]))} />
        ))}
      </div>
    </>
  )
}
