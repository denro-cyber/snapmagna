import { useState, useRef, useCallback } from 'react'
import Head from 'next/head'

const C = {
  gold:      '#C4964A',
  goldDark:  '#9A7435',
  goldLight: '#F5E9D5',
  goldBorder:'#E8D5B0',
  brown:     '#2C2415',
  muted:     '#7A6A52',
  border:    '#E8DFD0',
  cream:     '#FAF7F2',
  white:     '#FFFFFF',
  green:     '#2D7A3A',
  greenLight:'#E8F5EB',
}

const PACKS = [
  { id: 5,  label: '5 Pack',  price: '$21.99', per: '$4.40 each' },
  { id: 9,  label: '9 Pack',  price: '$34.99', per: '$3.89 each' },
  { id: 25, label: '25 Pack', price: '$84.99', per: '$3.40 each' },
  { id: 50, label: '50 Pack', price: '$159.99',per: '$3.20 each' },
]

const Logo = () => (
  <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
    <div style={{ fontSize: 22, color: '#C4964A', letterSpacing: 2, fontFamily: 'Georgia, serif' }}>
      snap<span style={{ color: '#2C2415' }}>magna</span>
    </div>
    <div style={{ width: 32, height: 1.5, background: '#C4964A', margin: '5px auto 0' }} />
  </div>
)

const Btn = ({ children, onClick, disabled, secondary, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    width: '100%',
    padding: '14px 20px',
    borderRadius: 50,
    border: secondary ? '1.5px solid #E8DFD0' : 'none',
    background: disabled ? '#E0D8CC' : secondary ? 'transparent' : '#C4964A',
    color: disabled ? '#7A6A52' : secondary ? '#7A6A52' : '#FFFFFF',
    fontFamily: 'Georgia, serif',
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    letterSpacing: 0.3,
    ...style,
  }}>{children}</button>
)

function Slot({ index, photo, onUpload, onRemove }) {
  const ref = useRef(null)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => onUpload(index, e.target.result)
    reader.readAsDataURL(file)
  }, [index, onUpload])

  return (
    <div
      onClick={() => !photo && ref.current.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
      style={{
        aspectRatio: '1',
        borderRadius: 10,
        border: photo ? '2px solid #E8D5B0' : '2px dashed #E8DFD0',
        background: photo ? 'transparent' : '#FFFFFF',
        cursor: photo ? 'default' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {photo ? (
        <>
          <img src={photo} alt={`Photo ${index + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <button
            onClick={e => { e.stopPropagation(); onRemove(index) }}
            style={{
              position: 'absolute', top: 4, right: 4,
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', color: 'white',
              border: 'none', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          <div style={{
            position: 'absolute', bottom: 4, left: 4,
            background: '#C4964A', color: 'white',
            fontSize: 10, borderRadius: 10,
            padding: '1px 6px', fontFamily: 'Georgia, serif',
          }}>{index + 1}</div>
        </>
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <div style={{ fontSize: 22, opacity: 0.4 }}>+</div>
          <div style={{ fontSize: 10, color: '#E8DFD0', textAlign: 'center', lineHeight: 1.3 }}>
            Photo {index + 1}
          </div>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

export default function App() {
  const [step,       setStep]       = useState('pack')
  const [pack,       setPack]       = useState(null)
  const [photos,     setPhotos]     = useState([])
  const [submitting, setSubmitting] = useState(false)

  const filled    = photos.filter(Boolean).length
  const total     = pack?.id ?? 0
  const allFilled = filled === total && total > 0

  const selectPack = (p) => {
    setPack(p)
    setPhotos(Array(p.id).fill(null))
  }

  const uploadPhoto = useCallback((index, src) => {
    setPhotos(prev => { const n = [...prev]; n[index] = src; return n })
  }, [])

  const removePhoto = useCallback((index) => {
    setPhotos(prev => { const n = [...prev]; n[index] = null; return n })
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack: pack.id,
          price: pack.price,
          ts: Date.now(),
        }),
      })
    } catch (_) {}
    setStep('done')
    setSubmitting(false)
  }

  return (
    <>
      <Head>
        <title>SnapMagna — Upload Your Photos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Georgia, serif; background: #FAF7F2; color: #2C2415; -webkit-font-smoothing: antialiased; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </Head>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 18px 48px' }}>
        <Logo />

        {step === 'pack' && (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <h1 style={{ fontSize: 20, fontWeight: 400, textAlign: 'center', marginBottom: 6 }}>
              How many magnets?
            </h1>
            <p style={{ fontSize: 13, color: '#7A6A52', textAlign: 'center', marginBottom: 22 }}>
              Choose your pack size to get started
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {PACKS.map(p => (
                <div key={p.id} onClick={() => selectPack(p)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${pack?.id === p.id ? '#C4964A' : '#E8DFD0'}`,
                  background: pack?.id === p.id ? '#F5E9D5' : '#FFFFFF',
                  transition: 'all 0.18s',
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: '#7A6A52' }}>{p.per}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 17, fontWeight: 500 }}>{p.price}</div>
                    {pack?.id === p.id && (
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: '#C4964A',
                        color: 'white', fontSize: 13, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
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

        {step === 'upload' && (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <div style={{
              background: '#FFFFFF', borderRadius: 12, padding: '14px 16px',
              marginBottom: 16, border: '0.5px solid #E8DFD0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{pack.label}</div>
                  <div style={{ fontSize: 13, color: '#7A6A52' }}>{pack.price}</div>
                </div>
                <button onClick={() => setStep('pack')}
                  style={{ fontSize: 12, color: '#C4964A', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Change
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: '#7A6A52' }}>Upload your photos</span>
                <span style={{ color: allFilled ? '#2D7A3A' : '#C4964A', fontWeight: 500 }}>
                  {filled}/{total} uploaded
                </span>
              </div>
              <div style={{ height: 6, background: '#E8DFD0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, transition: 'width 0.3s',
                  background: allFilled ? '#2D7A3A' : '#C4964A',
                  width: `${total > 0 ? (filled / total) * 100 : 0}%`,
                }} />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8, marginBottom: 18,
            }}>
              {photos.map((photo, i) => (
                <Slot key={i} index={i} photo={photo}
                  onUpload={uploadPhoto} onRemove={removePhoto} />
              ))}
            </div>

            {!allFilled && (
              <div style={{
                background: '#F5E9D5', borderRadius: 8, padding: '10px 14px',
                fontSize: 12, color: '#7A6A52', marginBottom: 14, textAlign: 'center',
              }}>
                Tap any empty slot to add a photo · {total - filled} remaining
              </div>
            )}

            <Btn onClick={() => setStep('confirm')} disabled={!allFilled}>
              {allFilled ? 'Review & checkout →' : `Upload all ${total} photos to continue`}
            </Btn>
          </div>
        )}

        {step === 'confirm' && (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <h2 style={{ fontSize: 20, fontWeight: 400, textAlign: 'center', marginBottom: 6 }}>
              Looking good!
            </h2>
            <p style={{ fontSize: 13, color: '#7A6A52', textAlign: 'center', marginBottom: 20 }}>
              Review your {total} photos before placing your order
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6, marginBottom: 20,
            }}>
              {photos.map((photo, i) => (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 8, overflow: 'hidden',
                  border: '2px solid #E8D5B0',
                }}>
                  <img src={photo} alt={`Photo ${i+1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <div style={{
              background: '#FFFFFF', borderRadius: 12, padding: '14px 16px',
              border: '0.5px solid #E8DFD0', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: '#7A6A52' }}>Pack size</span>
                <span style={{ fontWeight: 500 }}>{pack.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: '#7A6A52' }}>Photos uploaded</span>
                <span style={{ color: '#2D7A3A' }}>✅ {total}/{total}</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontSize: 16,
                paddingTop: 8, borderTop: '0.5px solid #E8DFD0',
              }}>
                <span style={{ fontWeight: 500 }}>Total</span>
                <span style={{ fontWeight: 500, color: '#C4964A' }}>{pack.price}</span>
              </div>
            </div>
            <Btn onClick={handleSubmit} disabled={submitting}>
              {submitting ? '⏳ Placing order…' : `Place order · ${pack.price} →`}
            </Btn>
            <div style={{ marginTop: 10 }}>
              <Btn secondary onClick={() => setStep('upload')}>← Edit photos</Btn>
            </div>
            <p style={{ fontSize: 11, color: '#E8DFD0', textAlign: 'center', marginTop: 12 }}>
              🔒 Secure checkout · Ships in 2–3 business days
            </p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ animation: 'fadeUp 0.5s ease both', textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 400, marginBottom: 10 }}>Order received!</h2>
            <p style={{ color: '#7A6A52', fontSize: 14, lineHeight: 1.75, marginBottom: 28 }}>
              We have your {total} photos and will start<br />
              making your magnets right away.<br />
              Expect them in 2–3 business days.
            </p>
            <div style={{
              background: '#FFFFFF', borderRadius: 14, padding: '20px 18px',
              border: '1.5px solid #E8DFD0', marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, color: '#7A6A52', marginBottom: 6 }}>Order total</div>
              <div style={{ fontSize: 32, color: '#C4964A', fontWeight: 500 }}>{pack.price}</div>
              <div style={{ fontSize: 12, color: '#7A6A52', marginTop: 4 }}>
                {pack.label} · {total} custom magnets
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
