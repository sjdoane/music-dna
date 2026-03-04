import { useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal.js'
import { parseSpotifyExport } from '../utils/parseSpotifyExport.js'

export default function SpotifyFileUpload({ onData }) {
  const [status,    setStatus]    = useState('idle')   // idle | loading | error
  const [errorMsg,  setErrorMsg]  = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  const titleRef = useReveal()
  const stepsRef = useReveal()
  const dropRef  = useReveal()

  async function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'csv' && ext !== 'json') {
      setStatus('error')
      setErrorMsg('Please upload a .csv file from Exportify or a .json file from Spotify.')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const text   = await file.text()
      const result = parseSpotifyExport(text, file.name)
      onData(result)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e.message || 'Something went wrong reading the file.')
    }
  }

  return (
    <section className="py-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-2xl mx-auto">
        <div ref={titleRef} className="reveal text-center mb-12">
          <div className="section-divider" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--cream)' }}>
            Upload Your Spotify Library
          </h2>
          <p className="font-body text-base" style={{ color: 'var(--text-muted)' }}>
            Use Exportify to download your liked songs, then drop the file here.
          </p>
        </div>

        {/* Steps */}
        <div ref={stepsRef} className="reveal mb-10 space-y-4">
          {[
            <>Go to <strong style={{ color: 'var(--cream)' }}>exportify.net</strong> in your browser.</>,
            <>Click <strong style={{ color: 'var(--cream)' }}>"Get Started"</strong> and log in with Spotify.</>,
            <>Find <strong style={{ color: 'var(--cream)' }}>Liked Songs</strong> and click <strong style={{ color: 'var(--cream)' }}>"Export"</strong> — it downloads instantly as a CSV.</>,
            <>Come back here and upload that file below.</>,
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm"
                style={{ background: 'rgba(29,185,84,0.15)', border: '1px solid rgba(29,185,84,0.35)', color: '#1DB954' }}
              >
                {i + 1}
              </div>
              <p className="font-body text-base leading-relaxed pt-1" style={{ color: 'var(--text-muted)' }}>
                {step}
              </p>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div ref={dropRef} className="reveal">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
            className="rounded-2xl flex flex-col items-center justify-center gap-4 py-14 px-8 cursor-pointer transition-colors"
            style={{
              border: `2px dashed ${isDragOver ? '#1DB954' : 'rgba(29,185,84,0.35)'}`,
              background: isDragOver ? 'rgba(29,185,84,0.08)' : 'rgba(29,185,84,0.03)',
            }}
          >
            {status === 'loading' ? (
              <>
                <div className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{ borderColor: '#1DB954', borderTopColor: 'transparent' }} />
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                  Reading your library…
                </p>
              </>
            ) : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="text-center">
                  <p className="font-body text-base font-semibold mb-1" style={{ color: 'var(--cream)' }}>
                    Choose File or Drag & Drop
                  </p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                    .csv from exportify.net
                  </p>
                </div>
                <span className="px-6 py-2.5 rounded-full font-body text-sm font-semibold"
                  style={{ background: '#1DB954', color: '#000' }}>
                  Choose File
                </span>
              </>
            )}
          </div>

          {status === 'error' && (
            <div className="mt-4 rounded-xl px-5 py-3 font-body text-sm flex items-start gap-2"
              style={{ background: 'rgba(196,114,127,0.15)', border: '1px solid rgba(196,114,127,0.4)', color: 'var(--rose)' }}>
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <input ref={inputRef} type="file" accept=".csv,.json" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      </div>
    </section>
  )
}
