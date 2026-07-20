import { useState, useRef, useCallback } from 'react'
import Head from 'next/head'

const C = {
  gold:      '#C4964A',
  goldLight: '#F5E9D5',
  goldBorder:'#E8D5B0',
  brown:     '#2C2415',
  muted:     '#7A6A52',
  border:    '#E8DFD0',
  cream:     '#FAF7F2',
  white:     '#FFFFFF',
  green:     '#2D7A3A',
  overlay:   'rgba(0,0,0,0.55)',
}

const PACKS = [
  { id: 5,  label: '5 Pack',  price: '$21.99', per: '$4.40 each' },
  { id: 9,  label: '9 Pack',  price: '$34.99', per: '$3.89 each' },
  { id: 25, label: '25 Pack', price: '$84.99', per: '$3.40 each' },
  { id: 50, label: '50 Pack', price: '$159.99',per: '$3.20 each' },
]

const CLOUD_NAME    = 'nvkjjpn9'
const UPLOAD_PRESET = 'snapmagna_uploads'

const Logo = () => (
  <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
    <img
      src="https://raw.githubusercontent.com/denro-cyber/snapmagna/main/snapmagna-app/snapmagna/SnapMagna_Logo.png"
      alt="SnapMagna"
      style={{ height: 60, width: 'auto', objectFit: 'contain' }}
    />
  </div>
)

const Btn = ({ children, onClick, disabled, secondary, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: '100%', padding: '14px 20px', borderRadius: 50,
    border: secondary ? `1.5px solid ${C.border}` : 'none',
    background: disabled ? '#E0D8CC' : secondary ? 'transparent' : C.gold,
    color: disabled ? C.muted : secondary ? C.muted : C.white,
    fontFamily: 'Georgia, serif', fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s', letterSpacing: 0.3, ...style,
  }}>{children}</button>
)

// ── Upload photo to Cloudinary ─────────────────────────
async function uploadToCloudinary(base64DataUrl, slotIndex, orderId) {
  const formData = new FormData()
  formData.append('file', base64DataUrl)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `orders/${orderId}`)
  formData.append('public_id', `slot_${slotIndex + 1}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await res.json()
  return data.secure_url
}

// ── Crop modal ─────────────────────────────────────────
function CropModal({ image, onConfirm, onCancel }) {
  const imgRef = useRef(null)
  const drag   = useRef({ on: false, sx: 0, sy: 0, ox: 0, oy: 0 })
  const [loaded, setLoaded] = useState(false)
  const [dims,   setDims]   = useState({ w: 0, h: 0 })
  const [box,    setBox]    = useState({ x: 0, y: 0, w: 0, h: 0 })

  const init = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const { width, height } = img.getBoundingClientRect()
    const size = Math.min(width, height) * 0.85
    setDims({ w: width, h: height })
    setBox({ x: (width - size) / 2, y: (height - size) / 2, w: size, h: size })
    setLoaded(true)
  }, [])

  const xy = e => { const t = e.touches?.[0] ?? e; return { x: t.clientX, y: t.clientY } }
  const onDown = useCallback(e => {
    e.preventDefault()
    const { x, y } = xy(e)
    drag.current = { on: true, sx: x, sy: y, ox: box.x, oy: box.y }
  }, [box])
  const onMove = useCallback(e => {
    if (!drag.current.on) return
    const { x, y } = xy(e)
    setBox(b => ({
      ...b,
      x: Math.max(0, Math.min(dims.w - b.w, drag.current.ox + x - drag.current.sx)),
      y: Math.max(0, Math.min(dims.h - b.h, drag.current.oy + y - drag.current.sy)),
    }))
  }, [dims])
  const onUp = useCallback(() => { drag.current.on = false }, [])

  const confirm = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const sx = img.naturalWidth  / dims.w
    const sy = img.naturalHeight / dims.h
    const OUT = 900
    const canvas = document.createElement('canvas')
    canvas.width = OUT; canvas.height = OUT
    canvas.getContext('2d').drawImage(img,
      box.x * sx, box.y * sy, box.w * sx, box.h * sy,
      0, 0, OUT, OUT)
    onConfirm(canvas.toDataURL('image/jpeg', 0.92))
  }, [imgRef, dims, box, onConfirm])

  const H = { position: 'absolute', width: 14, height: 14, background: 'white', borderRadius: 2 }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '14px 18px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none',
          color: 'white', borderRadius: 20, padding: '6px 14px',
          fontSize: 13, cursor: 'pointer',
        }}>Cancel</button>
        <span style={{ color: 'white', fontSize: 14, fontFamily: 'Georgia, serif' }}>
          Drag to crop
        </span>
        <button onClick={confirm} style={{
          background: C.gold, border: 'none', color: 'white',
          borderRadius: 20, padding: '6px 14px',
          fontSize: 13, cursor: 'pointer', fontFamily: 'Georgia, serif',
        }}>Use photo</button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchMove={onMove} onTouchEnd={onUp}
      >
        <img ref={imgRef} src={image} alt="Crop" onLoad={init}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', opacity: loaded ? 1 : 0 }}
          draggable={false} />
        {loaded && (
          <>
            {[
              { top: 0, left: 0, width: '100%', height: box.y },
              { top: box.y + box.h, left: 0, width: '100%', bottom: 0 },
              { top: box.y, left: 0, width: box.x, height: box.h },
              { top: box.y, left: box.x + box.w, right: 0, height: box.h },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', background: C.overlay, pointerEvents: 'none', ...s }} />
            ))}
            <div onMouseDown={onDown} onTouchStart={onDown} style={{
              position: 'absolute', left: box.x, top: box.y,
              width: box.w, height: box.h,
              border: '2px solid rgba(255,255,255,0.9)',
              cursor: 'grab', boxSizing: 'border-box',
            }}>
              <div style={{ ...H, top: -7, left: -7 }} />
              <div style={{ ...H, top: -7, right: -7 }} />
              <div style={{ ...H, bottom: -7, left: -7 }} />
              <div style={{ ...H, bottom: -7, right: -7 }} />
              {[33, 66].map(p => (
                <div key={'v'+p} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, borderLeft: '1px solid rgba(255,255,255,0.25)' }} />
              ))}
              {[33, 66].map(p => (
                <div key={'h'+p} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.25)' }} />
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ padding: '12px', textAlign: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          Square crop · drag to reposition
        </span>
      </div>
    </div>
  )
}

// ── Single slot ────────────────────────────────────────
function Slot({ index, photo, onCropped, onRemove }) {
  const fileRef = useRef(null)
  const [raw, setRaw]         = useState(null)
  const [cropping, setCropping] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => { setRaw(e.target.result); setCropping(true) }
    reader.readAsDataURL(file)
  }, [])

  return (
    <>
      {cropping && raw && (
        <CropModal
          image={raw}
          onConfirm={cropped => { setCropping(false); setRaw(null); onCropped(index, cropped) }}
          onCancel={() => { setCropping(false); setRaw(null); fileRef.current.value = '' }}
        />
      )}
      <div
        onClick={() => !photo && fileRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        style={{
          aspectRatio: '1', borderRadius: 10,
          border: photo ? `2px solid ${C.goldBorder}` : `2px dashed ${C.border}`,
          background: photo ? 'transparent' : C.white,
          cursor: photo ? 'default' : 'pointer',
          position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
        }}
      >
        {photo ? (
          <>
            <img src={photo} alt={`Photo ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <button onClick={e => { e.stopPropagation(); onRemove(index) }} style={{
              position: 'absolute', top: 4, right: 4, width: 22, height: 22,
              borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white',
              border: 'none', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
            <div style={{
              position: 'absolute', bottom: 4, left: 4, background: C.gold,
              color: 'white', fontSize: 10, borderRadius: 10, padding: '1px 6px',
            }}>{index + 1}</div>
          </>
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <div style={{ fontSize: 22, opacity: 0.35 }}>+</div>
            <div style={{ fontSize: 10, color: C.border, textAlign: 'center' }}>Photo {index + 1}</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      </div>
    </>
  )
}

// ── Main App ───────────────────────────────────────────
export default function App() {
  const [step,       setStep]       = useState('pack')
  const [pack,       setPack]       = useState(null)
  const [photos,     setPhotos]     = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [progress,   setProgress]   = useState('')
  const [orderId]    = useState(() => `ORD-${Date.now()}`)

  const filled    = photos.filter(Boolean).length
  const total     = pack?.id ?? 0
  const allFilled = filled === total && total > 0

  const selectPack = (p) => { setPack(p); setPhotos(Array(p.id).fill(null)) }
  const setCropped = useCallback((i, src) => {
    setPhotos(prev => { const n = [...prev]; n[i] = src; return n })
  }, [])
  const removePhoto = useCallback((i) => {
    setPhotos(prev => { const n = [...prev]; n[i] = null; return n })
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Upload all photos to Cloudinary
      const urls = []
      for (let i = 0; i < photos.length; i++) {
        setProgress(`Uploading photo ${i + 1} of ${photos.length}…`)
        const url = await uploadToCloudinary(photos[i], i, orderId)
        urls.push(url)
      }

      // Send order to our backend with Cloudinary URLs
      setProgress('Placing your order…')
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          pack: pack.id,
          price: pack.price,
          photoUrls: urls,
          ts: Date.now(),
        }),
      })

      setStep('done')
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    }
    setSubmitting(false)
    setProgress('')
  }

  return (
    <>
      <Head>
        <title>SnapMagna — Upload Your Photos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Georgia, serif; background: ${C.cream}; color: ${C.brown}; -webkit-font-smoothing: antialiased; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </Head>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 18px 48px' }}>
        <Logo />

        {/* PACK SELECTION */}
        {step === 'pack' && (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <h1 style={{ fontSize: 20, fontWeight: 400, textAlign: 'center', marginBottom: 6 }}>
              How many magnets?
            </h1>
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 22 }}>
              Choose your pack size to get started
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {PACKS.map(p => (
                <div key={p.id} onClick={() => selectPack(p)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${pack?.id === p.id ? C.gold : C.border}`,
                  background: pack?.id === p.id ? C.goldLight : C.white,
                  transition: 'all 0.18s',
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{p.per}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 17, fontWeight: 500 }}>{p.price}</div>
                    {pack?.id === p.id && (
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: C.gold,
                        color: 'white', fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Btn onClick={() => setStep('upload')} disabled={!pack}>
              {pack ? `Upload ${pack.id} photos →` : 'Select a pack size'}
            </Btn>
          </div>
        )}

        {/* UPLOAD + CROP */}
        {step === 'upload' && (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <div style={{
              background: C.white, borderRadius: 12, padding: '14px 16px',
              marginBottom: 16, border: `0.5px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{pack.label}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{pack.price}</div>
                </div>
                <button onClick={() => setStep('pack')} style={{
                  fontSize: 12, color: C.gold, background: 'none', border: 'none', cursor: 'pointer',
                }}>Change</button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: C.muted }}>Upload and crop your photos</span>
                <span style={{ color: allFilled ? C.green : C.gold, fontWeight: 500 }}>
                  {filled}/{total}
                </span>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, transition: 'width 0.3s',
                  background: allFilled ? C.green : C.gold,
                  width: `${total > 0 ? (filled / total) * 100 : 0}%`,
                }} />
              </div>
            </div>

            <div style={{
              background: C.goldLight, borderRadius: 8, padding: '10px 14px',
              fontSize: 12, color: C.muted, marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>✂️</span>
              <span>Tap a slot → choose photo → crop → repeat for each slot</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
              {photos.map((photo, i) => (
                <Slot key={i} index={i} photo={photo} onCropped={setCropped} onRemove={removePhoto} />
              ))}
            </div>

            <Btn onClick={() => setStep('confirm')} disabled={!allFilled}>
              {allFilled ? 'Review & checkout →' : `${total - filled} photos remaining`}
            </Btn>
          </div>
        )}

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <h2 style={{ fontSize: 20, fontWeight: 400, textAlign: 'center', marginBottom: 6 }}>
              Looking great!
            </h2>
            <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20 }}>
              Review your {total} cropped photos
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 20 }}>
              {photos.map((photo, i) => (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
                  border: `2px solid ${C.goldBorder}`,
                }}>
                  <img src={photo} alt={`Photo ${i+1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>

            <div style={{
              background: C.white, borderRadius: 12, padding: '14px 16px',
              border: `0.5px solid ${C.border}`, marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: C.muted }}>Pack size</span>
                <span style={{ fontWeight: 500 }}>{pack.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: C.muted }}>Photos ready</span>
                <span style={{ color: C.green }}>✅ {total}/{total} cropped</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 16,
                paddingTop: 8, borderTop: `0.5px solid ${C.border}`,
              }}>
                <span style={{ fontWeight: 500 }}>Total</span>
                <span style={{ fontWeight: 500, color: C.gold }}>{pack.price}</span>
              </div>
            </div>

            {submitting ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 36, height: 36, border: `3px solid ${C.border}`,
                  borderTop: `3px solid ${C.gold}`, borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
                }} />
                <p style={{ fontSize: 13, color: C.muted }}>{progress}</p>
              </div>
            ) : (
              <>
                <Btn onClick={handleSubmit}>
                  Place order · {pack.price} →
                </Btn>
                <div style={{ marginTop: 10 }}>
                  <Btn secondary onClick={() => setStep('upload')}>← Edit photos</Btn>
                </div>
              </>
            )}

            <p style={{ fontSize: 11, color: C.border, textAlign: 'center', marginTop: 12 }}>
              🔒 Ships in 2–3 business days · Made in Louisville, KY
            </p>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={{ animation: 'fadeUp 0.5s ease both', textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 10 }}>Order received!</h2>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>
              We have your {total} photos and will<br />
              start making your magnets right away.<br />
              Expect them in 2–3 business days.
            </p>
            <div style={{
              background: C.white, borderRadius: 14, padding: '20px 18px',
              border: `1.5px solid ${C.border}`, marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Order ID</div>
              <div style={{ fontSize: 18, color: C.gold, fontWeight: 500, letterSpacing: 1 }}>{orderId}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
                {pack.label} · {pack.price}
              </div>
            </div>
            <Btn onClick={() => { setStep('pack'); setPack(null); setPhotos([]) }}>
              Order more magnets
            </Btn>
          </div>
        )}
      </div>
    </>
  )
}
