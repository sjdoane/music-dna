import { useRef, useState } from 'react'
import { parseAppleMusicCSV } from '../utils/appleMusic.js'
import { useReveal } from '../hooks/useReveal.js'

const STEPS = [
  {
    icon: '🌐',
    text: (
      <>
        On your iPhone or Mac, go to{' '}
        <strong style={{ color: 'var(--cream)' }}>privacy.apple.com</strong> and sign in with your Apple ID.
      </>
    ),
  },
  {
    icon: '📋',
    text: (
      <>
        Tap <strong style={{ color: 'var(--cream)' }}>"Request a copy of your data"</strong>.
      </>
    ),
  },
  {
    icon: '🎵',
    text: (
      <>
        Select only <strong style={{ color: 'var(--cream)' }}>"Apple Music Activity"</strong>, then tap Continue and submit your request.
      </>
    ),
  },
  {
    icon: '📧',
    text: (
      <>
        Apple will email you a download link. This usually takes{' '}
        <strong style={{ color: 'var(--cream)' }}>a few days</strong>, so plan ahead!
      </>
    ),
  },
  {
    icon: '📦',
    text: (
      <>
        Download the zip file from the email, then <strong style={{ color: 'var(--cream)' }}>unzip</strong> it.
      </>
    ),
  },
  {
    icon: '📁',
    text: (
      <>
        Open the <strong style={{ color: 'var(--cream)' }}>Apple Music Activity</strong> folder inside the zip and find the file called{' '}
        <strong style={{ color: 'var(--cream)' }}>Apple Music - Play Activity.csv</strong>.
      </>
    ),
  },
  {
    icon: '⬆️',
    text: (
      <>
        Tap / click <strong style={{ color: 'var(--cream)' }}>"Choose File"</strong> below and select that file.
      </>
    ),
  },
]

export default function AppleMusicUpload({ onData }) {
  const [status, setStatus]   = useState('idle')  // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)

  const titleRef = useReveal()
  const stepsRef = useReveal()
  const dropRef  = useReveal()

  async function handleFile(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setStatus('error')
      setErrorMsg('Please select a .csv file.')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const text   = await file.text()
      const result = parseAppleMusicCSV(text)
      onData(result)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e.message || 'Something went wrong while reading the file.')
    }
  }

  function onInputChange(e) {
    handleFile(e.target.files?.[0])
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <section className="py-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div ref={titleRef} className="reveal text-center mb-12">
          <div className="section-divider" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--cream)' }}>
            Upload Your Apple Music Data
          </h2>
          <p className="font-body text-base" style={{ color: 'var(--text-muted)' }}>
            Follow these steps to get your music history file from Apple.
          </p>
        </div>

        {/* Warning banner */}
        <div
          className="rounded-xl px-5 py-4 mb-10 font-body text-sm flex items-start gap-3"
          style={{
            background: 'rgba(232,184,109,0.1)',
            border: '1px solid rgba(232,184,109,0.3)',
            color: 'var(--gold)',
          }}
        >
          <span className="text-xl shrink-0" role="img" aria-label="warning">⚠️</span>
          <span>
            <strong>Request this file a few days before your birthday</strong> — Apple usually takes 1–7 days to prepare the export.
          </span>
        </div>

        {/* Step list */}
        <div ref={stepsRef} className="reveal mb-12 space-y-5">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              {/* Step number */}
              <div
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm"
                style={{ background: 'rgba(196,114,127,0.2)', border: '1px solid rgba(196,114,127,0.4)', color: 'var(--rose)' }}
              >
                {i + 1}
              </div>
              {/* Text */}
              <p className="font-body text-base leading-relaxed pt-1" style={{ color: 'var(--text-muted)' }}>
                {step.text}
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
            onDrop={onDrop}
            className="rounded-2xl flex flex-col items-center justify-center gap-4 py-14 px-8 cursor-pointer transition-colors"
            style={{
              border: `2px dashed ${isDragOver ? 'var(--rose)' : 'rgba(196,114,127,0.4)'}`,
              background: isDragOver
                ? 'rgba(196,114,127,0.1)'
                : 'rgba(196,114,127,0.04)',
            }}
          >
            {status === 'loading' ? (
              <>
                <div
                  className="w-10 h-10 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'var(--rose)', borderTopColor: 'transparent' }}
                />
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                  Reading your music history…
                </p>
              </>
            ) : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="text-center">
                  <p className="font-body text-base font-semibold mb-1" style={{ color: 'var(--cream)' }}>
                    Choose File or Drag & Drop
                  </p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                    Apple Music - Play Activity.csv
                  </p>
                </div>
                <span
                  className="px-6 py-2.5 rounded-full font-body text-sm font-semibold"
                  style={{ background: 'var(--rose)', color: 'var(--cream)' }}
                >
                  Choose File
                </span>
              </>
            )}
          </div>

          {status === 'error' && (
            <div
              className="mt-4 rounded-xl px-5 py-3 font-body text-sm flex items-start gap-2"
              style={{ background: 'rgba(196,114,127,0.15)', border: '1px solid rgba(196,114,127,0.4)', color: 'var(--rose)' }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onInputChange}
          />
        </div>
      </div>
    </section>
  )
}
