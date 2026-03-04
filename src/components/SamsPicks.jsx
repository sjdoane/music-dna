import { useRef, useState } from 'react'
import { useReveal } from '../hooks/useReveal.js'
import { parseSpotifyExport } from '../utils/parseSpotifyExport.js'

export default function SamsPicks({
  artists, library, source, loading, error,
  onConnect, onManualSave, onFileUpload, onClear,
}) {
  const [showManual, setShowManual] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [fileError,  setFileError]  = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef   = useRef(null)
  const sectionRef = useReveal()

  const isConnected = artists && artists.length > 0
  const hasLibrary  = Boolean(library?.totalTracks)

  function handleManualSave() {
    const list = inputValue.split(',').map((a) => a.trim()).filter(Boolean)
    if (!list.length) return
    onManualSave(list)
    setShowManual(false)
    setInputValue('')
  }

  async function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'csv' && ext !== 'json') {
      setFileError('Please upload a .csv (Exportify) or .json (Spotify) file.')
      return
    }
    setFileLoading(true)
    setFileError('')
    try {
      const text   = await file.text()
      const result = parseSpotifyExport(text, file.name)
      onFileUpload(result)
    } catch (e) {
      setFileError(e.message || 'Something went wrong reading the file.')
    } finally {
      setFileLoading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <section
      className="px-6 pb-4"
      style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #111 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div
          ref={sectionRef}
          className="reveal rounded-2xl px-6 py-5"
          style={{
            background: 'rgba(196,114,127,0.06)',
            border: '1px solid rgba(196,114,127,0.25)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl" role="img" aria-label="heart">♡</span>
              <div>
                <p className="font-display text-base font-semibold" style={{ color: 'var(--cream)' }}>
                  Mix in your picks, Sam
                </p>
                <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {isConnected
                    ? source === 'file'
                      ? hasLibrary
                        ? `Your library of ${library.totalTracks.toLocaleString()} songs — a couple of recommendations will be yours.`
                        : 'Your library is loaded — a couple of recommendations will be yours.'
                      : source === 'spotify'
                        ? 'From your Spotify liked songs — a couple of recommendations will be yours.'
                        : 'Added manually — a couple of recommendations will be yours.'
                    : 'Upload your Spotify library file or add artists manually and Dad will get a few picks from you.'}
                </p>
              </div>
            </div>

            {isConnected && !loading && (
              <button
                onClick={onClear}
                className="shrink-0 font-body text-xs px-3 py-1.5 rounded-full"
                style={{ color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Remove
              </button>
            )}
          </div>

          {/* Loading state */}
          {(loading || fileLoading) && (
            <div className="flex items-center gap-3 py-2">
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
                style={{ borderColor: 'var(--rose)', borderTopColor: 'transparent' }}
              />
              <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                {fileLoading ? 'Reading your library…' : 'Fetching your liked songs…'}
              </p>
            </div>
          )}

          {/* Error */}
          {(error || fileError) && !loading && !fileLoading && (
            <p className="font-body text-sm mb-3" style={{ color: 'var(--rose)' }}>
              {error || fileError}
            </p>
          )}

          {/* Connected — show artists */}
          {isConnected && !loading && !fileLoading && (
            <div className="flex flex-wrap gap-2 mb-3">
              {artists.slice(0, 10).map((a, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full font-body text-xs font-semibold"
                  style={{
                    background: 'rgba(196,114,127,0.15)',
                    border: '1px solid rgba(196,114,127,0.3)',
                    color: 'var(--rose)',
                  }}
                >
                  {a}
                </span>
              ))}
              {artists.length > 10 && (
                <span className="px-3 py-1 font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                  +{artists.length - 10} more
                </span>
              )}
            </div>
          )}

          {/* Not connected — actions */}
          {!isConnected && !loading && !fileLoading && (
            <div className="space-y-4">
              {/* File upload area */}
              <div>
                <p className="font-body text-xs font-semibold mb-2" style={{ color: 'var(--rose)' }}>
                  Upload your Spotify liked songs (from exportify.net)
                </p>
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={onDrop}
                  className="rounded-xl flex items-center justify-center gap-3 py-4 px-5 cursor-pointer transition-colors"
                  style={{
                    border: `1.5px dashed ${isDragOver ? 'var(--rose)' : 'rgba(196,114,127,0.35)'}`,
                    background: isDragOver ? 'rgba(196,114,127,0.08)' : 'rgba(196,114,127,0.03)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div>
                    <p className="font-body text-sm font-semibold" style={{ color: 'var(--cream)' }}>
                      Drop file or click to choose
                    </p>
                    <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                      .csv from exportify.net &nbsp;·&nbsp; .json from Spotify
                    </p>
                  </div>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Manual toggle */}
              {!showManual && (
                <button
                  onClick={() => setShowManual(true)}
                  className="block font-body text-xs underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Add your favourite artists manually instead
                </button>
              )}

              {/* Manual input */}
              {showManual && (
                <div className="space-y-2">
                  <input
                    type="text"
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSave()}
                    placeholder="e.g. Taylor Swift, Radiohead, Bon Iver"
                    className="w-full rounded-xl px-4 py-2.5 font-body text-sm outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(196,114,127,0.4)',
                      color: 'var(--cream)',
                    }}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleManualSave}
                      className="px-4 py-2 rounded-full font-body text-sm font-semibold"
                      style={{ background: 'var(--rose)', color: 'var(--cream)' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowManual(false)}
                      className="px-4 py-2 rounded-full font-body text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* OAuth connect — secondary option */}
              <div className="pt-1">
                <button
                  onClick={onConnect}
                  className="inline-flex items-center gap-2 font-body text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#1DB954">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  Connect via Spotify OAuth instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
