import { useState, useRef, useCallback } from 'react'
import Head from 'next/head'
import '../styles/globals.css'

// ── Brand tokens ──────────────────────────────
const C = {
  gold:      '#C4964A',
  goldDark:  '#9A7435',
  goldLight: '#F5E9D5',
  brown:     '#2C2415',
  muted:     '#7A6A52',
  border:    '#E8DFD0',
  cream:     '#FAF7F2',
  white:     '#FFFFFF',
  overlay:   'rgba(0,0,0,0.55)',
}

const SIZES = [
  { id: '2x2',     label: '2" × 2"',     ratio: 1,         desc: 'Most popular online',     px: 600 },
  { id: '2.5x2.5', label: '2.5" × 2.5"', ratio: 1,         desc: 'Great for portraits',     px: 750 },
  { id: '2.5x3.5', label: '2.5" × 3.5"', ratio: 2.5 / 3.5, desc: 'Best for events',         px: 750 },
]

// ── Tiny UI atoms ─────────────────────────────
const Btn = ({ children, onClick, secondary, disabled, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%', padding: '14px 28px', borderRadius: 50,
      fontFamily: 'Georgia, serif', fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer',
      letterSpacing: 0.4, border: secondary ? `1.5px solid ${C.border}` : 'none',
      background: disabled ? C.border : secondary ? 'transparent' : C.gold,
      color: disabled ? C.muted : secondary ? C.muted : C.white,
      transition: 'all 0.2s', opacity: disabled ? 0.6 : 1,
      ...style,
    }}
  >
    {children}
  </button>
)

const Dots = ({ step, total = 5 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: i === step ? 24 : 8, height: 8, borderRadius: 4,
        background: i === step ? C.gold : C.border, transition: 'all 0.3s',
      }} />
    ))}
  </div>
)

const Logo = () => (
  <div style={{ textAlign: 'center', marginBottom: 6 }}>
    <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.gold, letterSpacing: 2 }}>
      snap<span style={{ color: C.brown }}>magna</span>
    </span>
    <div style={{ width: 32, height: 1.5, background: C.gold, margin: '5px auto 0' }} />
  </div>
)

// ── Screen 1: Welcome ─────────────────────────
function Welcome({ onStart }) {
  return (
    <div style={{ animation: 'fadeUp 0.5s ease both', textAlign: 'center', paddingTop: 40 }}>
      <Logo />
      <div style={{ fontSize: 60, margin: '20px 0 14px' }}>📸</div>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 400, color: C.brown, marginBottom: 12 }}>
        Your memory,<br />on a magnet.
      </h1>
      <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.75, marginBottom: 36 }}>
        Upload a photo, choose your size,<br />and we'll print it while you celebrate.
      </p>
      <Btn onClick={onStart}>Get started →</Btn>
      <p style={{ color: C.border, fontSize: 12, marginTop: 16 }}>Takes less than 60 seconds</p>
    </div>
  )
}

// ── Screen 2: Size picker ─────────────────────
function SizePicker({ selected, onSelect, onNext, onBack }) {
  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <Dots step={0} />
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 400, color: C.brown, marginBottom: 4 }}>
        Choose your magnet size
      </h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 22 }}>You can order a different size anytime.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {SIZES.map(s => (
          <div
            key={s.id}
            onClick={() => onSelect(s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
              border: `2px solid ${selected.id === s.id ? C.gold : C.border}`,
              background: selected.id === s.id ? C.goldLight : C.white,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: s.ratio >= 1 ? 40 : Math.round(40 * s.ratio),
              height: s.ratio >= 1 ? Math.round(40 / s.ratio) : 40,
              minWidth: 28, borderRadius: 3,
              background: selected.id === s.id ? C.gold : C.border,
              transition: 'all 0.2s', flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: C.brown }}>{s.label}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{s.desc}</div>
            </div>
            {selected.id === s.id && (
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: C.gold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 12,
              }}>✓</div>
            )}
          </div>
        ))}
      </div>
      <Btn onClick={onNext}>Continue →</Btn>
      <div style={{ marginTop: 10 }}><Btn secondary onClick={onBack}>← Back</Btn></div>
    </div>
  )
}

// ── Screen 3: Upload ──────────────────────────
function Upload({ onImage, onBack }) {
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError]       = useState(null)

  const process = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select a JPG, PNG or HEIC image.')
      return
    }
    const reader = new FileReader()
    reader.onload = e => onImage(e.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <Dots step={1} />
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 400, color: C.brown, marginBottom: 4 }}>
        Upload your photo
      </h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 22 }}>From your camera roll or take one now.</p>
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files[0]) }}
        style={{
          border: `2px dashed ${dragging ? C.gold : C.border}`,
          borderRadius: 14, padding: '44px 20px', textAlign: 'center',
          cursor: 'pointer', background: dragging ? C.goldLight : C.white,
          transition: 'all 0.2s', marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 10 }}>🖼️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: C.brown, marginBottom: 4 }}>
          Tap to choose a photo
        </div>
        <div style={{ color: C.muted, fontSize: 12 }}>or drag and drop here</div>
        <input
          ref={fileRef} type="file" accept="image/*" capture="environment"
          style={{ display: 'none' }}
          onChange={e => process(e.target.files[0])}
        />
      </div>
      {error && <p style={{ color: '#C0392B', fontSize: 12, marginBottom: 10 }}>{error}</p>}
      <p style={{ fontSize: 11, color: C.border, textAlign: 'center', marginBottom: 18 }}>
        💡 Use a photo at least 750 × 750px for a sharp print
      </p>
      <Btn secondary onClick={onBack}>← Back</Btn>
    </div>
  )
}

// ── Screen 4: Crop ────────────────────────────
function Crop({ image, size, onCrop, onBack }) {
  const imgRef    = useRef(null)
  const drag      = useRef({ on: false, sx: 0, sy: 0, ox: 0, oy: 0 })
  const [loaded,  setLoaded]  = useState(false)
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 })
  const [box,     setBox]     = useState({ x: 0, y: 0, w: 0, h: 0 })

  const init = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const { width, height } = img.getBoundingClientRect()
    const r = size.ratio
    let bw, bh
    if (r >= 1) {
      bw = width * 0.85; bh = bw / r
      if (bh > height * 0.85) { bh = height * 0.85; bw = bh * r }
    } else {
      bh = height * 0.85; bw = bh * r
      if (bw > width * 0.85) { bw = width * 0.85; bh = bw / r }
    }
    setImgDims({ w: width, h: height })
    setBox({ x: (width - bw) / 2, y: (height - bh) / 2, w: bw, h: bh })
    setLoaded(true)
  }, [size])

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
      x: Math.max(0, Math.min(imgDims.w - b.w, drag.current.ox + x - drag.current.sx)),
      y: Math.max(0, Math.min(imgDims.h - b.h, drag.current.oy + y - drag.current.sy)),
    }))
  }, [imgDims])
  const onUp = useCallback(() => { drag.current.on = false }, [])

  const confirm = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const sx = img.naturalWidth  / imgDims.w
    const sy = img.naturalHeight / imgDims.h
    const OUT_W = size.px
    const OUT_H = Math.round(OUT_W / size.ratio)
    const canvas = document.createElement('canvas')
    canvas.width = OUT_W; canvas.height = OUT_H
    canvas.getContext('2d').drawImage(img,
      box.x * sx, box.y * sy, box.w * sx, box.h * sy,
      0, 0, OUT_W, OUT_H)
    onCrop(canvas.toDataURL('image/jpeg', 0.95))
  }, [imgRef, imgDims, box, size, onCrop])

  const H = { position: 'absolute', width: 14, height: 14, background: 'white', borderRadius: 2 }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <Dots step={2} />
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 400, color: C.brown, marginBottom: 4 }}>
        Frame your photo
      </h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
        Drag the box to choose what goes on your magnet.
      </p>
      <div
        style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', touchAction: 'none', userSelect: 'none', background: '#000' }}
        onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchMove={onMove} onTouchEnd={onUp}
      >
        <img
          ref={imgRef} src={image} alt="Upload"
          onLoad={init}
          style={{ width: '100%', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
          draggable={false}
        />
        {loaded && (
          <>
            {[
              { top: 0,              left: 0,             width: '100%',  height: box.y },
              { top: box.y+box.h,    left: 0,             width: '100%',  bottom: 0 },
              { top: box.y,          left: 0,             width: box.x,   height: box.h },
              { top: box.y,          left: box.x+box.w,   right: 0,       height: box.h },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', background: C.overlay, pointerEvents: 'none', ...s }} />
            ))}
            <div
              onMouseDown={onDown} onTouchStart={onDown}
              style={{
                position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h,
                border: '2px solid rgba(255,255,255,0.9)', cursor: 'grab', boxSizing: 'border-box',
              }}
            >
              <div style={{ ...H, top: -7, left: -7 }} />
              <div style={{ ...H, top: -7, right: -7 }} />
              <div style={{ ...H, bottom: -7, left: -7 }} />
              <div style={{ ...H, bottom: -7, right: -7 }} />
              {[33, 66].map(p => (
                <div key={'v'+p} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, borderLeft: '1px solid rgba(255,255,255,0.22)' }} />
              ))}
              {[33, 66].map(p => (
                <div key={'h'+p} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.22)' }} />
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <Btn secondary onClick={onBack} style={{ flex: 1 }}>← Back</Btn>
        <Btn onClick={confirm} style={{ flex: 2 }}>Looks good →</Btn>
      </div>
    </div>
  )
}

// ── Screen 5: Preview ─────────────────────────
function Preview({ image, size, onConfirm, onBack }) {
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, size: size.id, ts: Date.now() }),
      })
    } catch (_) { /* offline / dev mode — still proceed */ }
    setTimeout(onConfirm, 800)
  }

  const W = size.ratio >= 1 ? 180 : Math.round(180 * size.ratio)
  const H = size.ratio >= 1 ? Math.round(180 / size.ratio) : 180

  return (
    <div style={{ animation: 'fadeUp 0.4s ease both', textAlign: 'center' }}>
      <Dots step={3} />
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 400, color: C.brown, marginBottom: 4 }}>
        Looking great!
      </h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>This is how your magnet will look.</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
        <div style={{
          width: W, height: H, borderRadius: 6, overflow: 'hidden',
          boxShadow: '0 6px 28px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)',
          border: `3px solid ${C.white}`,
        }}>
          <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="Preview" />
        </div>
      </div>
      <div style={{
        background: C.goldLight, borderRadius: 10, padding: '12px 18px',
        display: 'flex', justifyContent: 'space-between', fontSize: 13,
        color: C.brown, marginBottom: 20,
      }}>
        <span>Size</span>
        <span style={{ fontFamily: 'Georgia, serif' }}>{size.label}</span>
      </div>
      <p style={{ color: C.muted, fontSize: 12, marginBottom: 18 }}>
        Once confirmed we'll print this automatically. Come pick it up in a few minutes! 🎉
      </p>
      <Btn onClick={submit} disabled={busy}>
        {busy ? '⏳ Sending…' : 'Print my magnet →'}
      </Btn>
      {!busy && <div style={{ marginTop: 10 }}><Btn secondary onClick={onBack}>← Recrop</Btn></div>}
    </div>
  )
}

// ── Screen 6: Done ────────────────────────────
function Done({ orderNum, size }) {
  return (
    <div style={{ animation: 'fadeUp 0.5s ease both', textAlign: 'center', paddingTop: 28 }}>
      <div style={{ fontSize: 68, marginBottom: 14 }}>🎉</div>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 400, color: C.brown, marginBottom: 10 }}>
        Your magnet is printing!
      </h2>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>
        Come find us at the booth in a few minutes —<br />
        your {size.label} magnet will be ready and waiting.
      </p>
      <div style={{
        background: C.white, border: `1.5px solid ${C.border}`,
        borderRadius: 14, padding: '22px 18px', marginBottom: 28,
      }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Your order number</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 52, color: C.gold, letterSpacing: 6 }}>
          #{orderNum}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Show this at the booth</div>
      </div>
      <Logo />
      <p style={{ fontSize: 11, color: C.border, marginTop: 8 }}>snapmagna.com</p>
    </div>
  )
}

// ── Root ──────────────────────────────────────
export default function App() {
  const [step,    setStep]    = useState('welcome')
  const [size,    setSize]    = useState(SIZES[1]) // default 2.5x2.5
  const [rawImg,  setRawImg]  = useState(null)
  const [cropImg, setCropImg] = useState(null)
  const [orderNum]            = useState(() => String(Math.floor(1000 + Math.random() * 9000)))

  return (
    <>
      <Head>
        <title>SnapMagna — Custom Photo Magnets</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Upload your photo and get a custom 2.5 inch magnet printed on the spot." />
      </Head>
      <div style={{ background: C.cream, minHeight: '100vh' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '28px 22px 48px' }}>
          {step === 'welcome' && <Welcome onStart={() => setStep('size')} />}
          {step === 'size'    && <SizePicker selected={size} onSelect={setSize} onNext={() => setStep('upload')} onBack={() => setStep('welcome')} />}
          {step === 'upload'  && <Upload onImage={src => { setRawImg(src); setStep('crop') }} onBack={() => setStep('size')} />}
          {step === 'crop'    && <Crop image={rawImg} size={size} onCrop={img => { setCropImg(img); setStep('preview') }} onBack={() => setStep('upload')} />}
          {step === 'preview' && <Preview image={cropImg} size={size} onConfirm={() => setStep('done')} onBack={() => setStep('crop')} />}
          {step === 'done'    && <Done orderNum={orderNum} size={size} />}
        </div>
      </div>
    </>
  )
}
