import { useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal.js'
import { parseSpotifyExport } from '../utils/parseSpotifyExport.js'

export default function SpotifyConnect({ onLogin, onFileData, error }) {
  const ref      = useReveal()
  const inputRef = useRef(null)

  const [tab,        setTab]        = useState('oauth')   // 'oauth' | 'file'
  const [fileStatus, setFileStatus] = useState('idle')    // 'idle' | 'loading' | 'error'
  const [fileError,  setFileError]  = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  async function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'csv' && ext !== 'json') {
      setFileStatus('error')
      setFileError('Please upload a .csv (Exportify) or .json (Spotify library) file.')
      return
    }

    setFileStatus('loading')
    setFileError('')
    try {
      const text   = await file.text()
      const result = parseSpotifyExport(text, file.name)
      onFileData(result)
    } catch (e) {
      setFileStatus('error')
      setFileError(e.message || 'Something went wrong reading the file.')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <section
      id="connect"
      className="relative py-28 px-6 flex flex-col items-center text-center"
      style={{ background: 'linear-gradient(160deg, #111 0%, #1a1a2e 100%)' }}
    >
      <div ref={ref} className="reveal max-w-xl mx-auto w-full">
        {/* Header */}
        <div
          className="inline-block mb-6 px-3 py-1 rounded-full text-xs tracking-[0.25em] uppercase font-semibold"
          style={{
            background: 'rgba(29,185,84,0.1)',
            border: '1px solid rgba(29,185,84,0.3)',
            color: '#1DB954',
          }}
        >
          Step 1
        </div>

        <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--cream)' }}>
          Let's explore your <em>music taste</em>
        </h2>
        <p className="font-body text-base sm:text-lg mb-10" style={{ color: 'var(--text-muted)' }}>
          Connect Spotify directly, or upload your library file from Exportify for
          an instant, no-login alternative.
        </p>

        {/* Tab switcher */}
        <div
          className="flex rounded-xl p-1 mb-8 mx-auto"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            width: 'fit-content',
          }}
        >
          {[
            { id: 'oauth', label: 'Connect Spotify' },
            { id: 'file',  label: 'Upload library file' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="px-5 py-2 rounded-lg font-body text-sm font-semibold transition-all"
              style={{
                background: tab === id ? 'rgba(29,185,84,0.2)'  : 'transparent',
                color:      tab === id ? '#1DB954'               : 'var(--text-muted)',
                border:     tab === id ? '1px solid rgba(29,185,84,0.4)' : '1px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── OAuth tab ── */}
        {tab === 'oauth' && (
          <div>
            <button
              onClick={onLogin}
              className="spotify-btn flex items-center gap-3 mx-auto px-8 py-4 rounded-full text-lg"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Connect Spotify
            </button>

            {error && (
              <div
                className="mt-6 rounded-xl px-5 py-4 text-left"
                style={{
                  background: 'rgba(196,114,127,0.12)',
                  border: '1px solid rgba(196,114,127,0.35)',
                }}
              >
                <p className="font-body text-sm font-semibold mb-1" style={{ color: 'var(--rose)' }}>
                  Spotify connection failed
                </p>
                <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                  {error}
                </p>
                <p className="font-body text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Common fix: make sure <code className="text-xs px-1 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    {window.location.origin}/callback
                  </code> is added as a Redirect URI in your{' '}
                  <span style={{ color: '#1DB954' }}>Spotify Developer Dashboard</span>.
                  Or try the <button onClick={() => setTab('file')} className="underline" style={{ color: 'var(--gold)' }}>Upload library file</button> tab instead.
                </p>
              </div>
            )}

            <p className="mt-6 text-xs font-body" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              We only read your listening history — nothing is posted or changed.
            </p>
          </div>
        )}

        {/* ── File upload tab ── */}
        {tab === 'file' && (
          <div className="text-left">
            {/* Instructions */}
            <div
              className="rounded-2xl px-6 py-5 mb-6 space-y-3"
              style={{
                background: 'rgba(29,185,84,0.06)',
                border: '1px solid rgba(29,185,84,0.2)',
              }}
            >
              <p className="font-body text-sm font-semibold text-center" style={{ color: '#1DB954' }}>
                How to get your Spotify library file
              </p>
              {[
                <>Go to <strong style={{ color: 'var(--cream)' }}>exportify.net</strong> in your browser.</>,
                <>Click <strong style={{ color: 'var(--cream)' }}>"Get Started"</strong> and sign in with your Spotify account.</>,
                <>Next to <strong style={{ color: 'var(--cream)' }}>Liked Songs</strong>, click <strong style={{ color: 'var(--cream)' }}>"Export"</strong> to download a CSV file.</>,
                <>Come back here and upload that file below.</>,
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-display text-xs font-bold"
                    style={{ background: 'rgba(29,185,84,0.2)', color: '#1DB954' }}
                  >
                    {i + 1}
                  </div>
                  <p className="font-body text-sm leading-relaxed pt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {step}
                  </p>
                </div>
              ))}
              <p className="font-body text-xs text-center pt-1" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                Also accepts <strong>YourLibrary.json</strong> or <strong>StreamingHistory.json</strong> from privacy.spotify.com
              </p>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              className="rounded-2xl flex flex-col items-center justify-center gap-4 py-12 px-8 cursor-pointer transition-colors"
              style={{
                border: `2px dashed ${isDragOver ? '#1DB954' : 'rgba(29,185,84,0.35)'}`,
                background: isDragOver ? 'rgba(29,185,84,0.08)' : 'rgba(29,185,84,0.03)',
              }}
            >
              {fileStatus === 'loading' ? (
                <>
                  <div
                    className="w-10 h-10 rounded-full border-2 animate-spin"
                    style={{ borderColor: '#1DB954', borderTopColor: 'transparent' }}
                  />
                  <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                    Reading your library…
                  </p>
                </>
              ) : (
                <>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1DB954" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div className="text-center">
                    <p className="font-body text-base font-semibold mb-1" style={{ color: 'var(--cream)' }}>
                      Choose File or Drag & Drop
                    </p>
                    <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                      .csv from Exportify &nbsp;·&nbsp; .json from Spotify
                    </p>
                  </div>
                  <span
                    className="px-6 py-2.5 rounded-full font-body text-sm font-semibold"
                    style={{ background: '#1DB954', color: '#000' }}
                  >
                    Choose File
                  </span>
                </>
              )}
            </div>

            {fileStatus === 'error' && (
              <div
                className="mt-4 rounded-xl px-5 py-3 font-body text-sm flex items-start gap-2"
                style={{
                  background: 'rgba(196,114,127,0.15)',
                  border: '1px solid rgba(196,114,127,0.4)',
                  color: 'var(--rose)',
                }}
              >
                <span>⚠️</span>
                <span>{fileError}</span>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        )}
      </div>
    </section>
  )
}
