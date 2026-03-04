import { useEffect, useRef } from 'react'

const NOTES = ['♩', '♪', '♫', '♬', '𝄞', '♩', '♪']

export default function Hero({ isConnected }) {
  const notesRef = useRef([])

  return (
    <section
      className="relative flex flex-col items-center justify-center min-h-screen text-center px-6 overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(232,184,109,0.12) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(196,114,127,0.10) 0%, transparent 55%),
          linear-gradient(160deg, #1a1a2e 0%, #111 60%, #1a1a2e 100%)
        `,
      }}
    >
      {/* Floating music notes */}
      {NOTES.map((note, i) => (
        <FloatingNote key={i} note={note} index={i} />
      ))}

      {/* Subtle top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Year badge */}
        <div
          className="inline-block mb-8 px-4 py-1 rounded-full text-xs tracking-[0.3em] uppercase font-semibold"
          style={{
            background: 'rgba(232,184,109,0.1)',
            border: '1px solid rgba(232,184,109,0.3)',
            color: 'var(--gold)',
          }}
        >
          For Dad · {new Date().getFullYear()}
        </div>

        <h1
          className="font-display text-6xl sm:text-7xl md:text-8xl font-bold leading-tight mb-6"
          style={{
            background: 'linear-gradient(135deg, var(--cream) 0%, var(--gold) 60%, var(--gold-light) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Happy Birthday,
          <br />
          <em>Dad.</em>
        </h1>

        <p
          className="font-body text-lg sm:text-xl leading-relaxed max-w-xl mx-auto mb-4"
          style={{ color: 'var(--cream)', opacity: 0.85 }}
        >
          I built this for you because music has always been something we share.
          This website finds songs we share, and recommendations for you based off
          of my liked songs.
        </p>

        <p
          className="font-body text-base mb-12"
          style={{ color: 'var(--text-muted)' }}
        >
          Scroll down to explore your musical universe.
        </p>

        {/* Scroll cue */}
        <div className="flex flex-col items-center gap-2" style={{ color: 'var(--gold)', opacity: 0.6 }}>
          <span className="text-xs tracking-widest uppercase font-semibold">Scroll</span>
          <svg
            width="20" height="28" viewBox="0 0 20 28" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ animation: 'float-note 2s ease-in-out infinite' }}
          >
            <rect x="1" y="1" width="18" height="26" rx="9" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="5" width="2" height="6" rx="1" fill="currentColor">
              <animate attributeName="y" values="5;11;5" dur="2s" repeatCount="indefinite"/>
            </rect>
          </svg>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--navy))' }}
      />
    </section>
  )
}

function FloatingNote({ note, index }) {
  const positions = [
    { left: '8%',  top: '15%', size: '2rem',  delay: '0s'   },
    { left: '85%', top: '20%', size: '1.5rem', delay: '0.8s' },
    { left: '15%', top: '70%', size: '1.8rem', delay: '1.6s' },
    { left: '78%', top: '65%', size: '2.2rem', delay: '0.4s' },
    { left: '50%', top: '10%', size: '1.3rem', delay: '2.0s' },
    { left: '92%', top: '45%', size: '1.6rem', delay: '1.2s' },
    { left: '5%',  top: '45%', size: '2rem',  delay: '0.6s' },
  ]

  const pos = positions[index] || positions[0]

  return (
    <div
      className="float-note absolute pointer-events-none select-none font-display"
      style={{
        left:          pos.left,
        top:           pos.top,
        fontSize:      pos.size,
        animationDelay: pos.delay,
        color:         'var(--gold)',
        opacity:       0.18,
      }}
    >
      {note}
    </div>
  )
}
