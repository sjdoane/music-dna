import { useReveal } from '../hooks/useReveal.js'

export default function PersonalNote({ profile }) {
  const ref = useReveal()

  const firstName = profile?.display_name?.split(' ')[0] || 'Dad'

  return (
    <section
      className="py-28 px-6"
      style={{
        background: `
          radial-gradient(ellipse at 30% 70%, rgba(232,184,109,0.08) 0%, transparent 60%),
          linear-gradient(160deg, #111 0%, #1a1a2e 100%)
        `,
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Heading */}
        <div ref={ref} className="reveal text-center mb-12">
          <div className="section-divider" />
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--cream)' }}>
            A Note From Me
          </h2>
        </div>

        {/* Letter */}
        <LetterPaper firstName={firstName} />

        {/* Closing */}
        <div className="mt-12 text-center">
          <p
            className="font-display text-2xl italic"
            style={{
              background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Here's to another year of great music.
          </p>
          <p className="font-body mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>
            Love, Sam ♪
          </p>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
            Made with ♥ and code · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </section>
  )
}

function LetterPaper({ firstName }) {
  const ref = useReveal()

  return (
    <div ref={ref} className="reveal letter-paper px-10 py-10 sm:px-14 sm:py-12">
      {/* Ruled lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(196,114,127,0.12) 27px, rgba(196,114,127,0.12) 28px)',
          backgroundPositionY: '48px',
          borderRadius: '4px',
        }}
      />

      <div className="relative" style={{ fontFamily: 'Playfair Display, serif' }}>
        <p className="text-right text-sm mb-8 italic" style={{ color: '#8a7060' }}>
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <p className="text-xl font-semibold mb-6" style={{ color: '#2a1f14' }}>
          Dear {firstName},
        </p>

        <div className="space-y-4 text-base leading-relaxed" style={{ color: '#3a2f24' }}>
          <p>
            Happy Birthday! I built this for you, because I wanted to do something
            a bit different this year, based on our shared love of music.
          </p>
          <p>
            Music has always been one of the things I love most about our connection.
            From playing records every morning, to listening to you jam with your
            friends, your taste has always shaped mine.
          </p>
          <p>
            I hope this website can bring you a smile. Here's to another year of
            discovering new music and sharing it with each other.
          </p>
          <p>
            I'm always grateful for you, and I love you so much.
          </p>
        </div>

        <p className="mt-8 text-xl font-semibold italic" style={{ color: '#2a1f14' }}>
          Sam
        </p>
      </div>
    </div>
  )
}
