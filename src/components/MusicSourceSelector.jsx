import { useReveal } from '../hooks/useReveal.js'

export default function MusicSourceSelector({ onSelect }) {
  const titleRef = useReveal()
  const cardsRef = useReveal()

  return (
    <section className="py-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-3xl mx-auto">
        <div ref={titleRef} className="reveal text-center mb-12">
          <div className="section-divider" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--cream)' }}>
            Let's explore your music taste
          </h2>
          <p className="font-body text-base" style={{ color: 'var(--text-muted)' }}>
            Export your Liked Songs from Spotify and upload the file here — no account login needed.
          </p>
        </div>

        <div ref={cardsRef} className="reveal flex justify-center">
          {/* Spotify card */}
          <button
            onClick={() => onSelect('spotify-file')}
            className="text-left rounded-2xl p-8 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer max-w-sm w-full"
            style={{
              background: 'linear-gradient(135deg, rgba(29,185,84,0.15) 0%, rgba(29,185,84,0.05) 100%)',
              border: '1px solid rgba(29,185,84,0.35)',
            }}
          >
            <div className="mb-5">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold mb-2" style={{ color: '#1DB954' }}>
              Spotify
            </h3>
            <p className="font-body text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Export your Liked Songs in seconds using <strong style={{ color: 'var(--cream)' }}>exportify.net</strong> — no login to this site required.
            </p>
            <span
              className="inline-block font-body text-xs font-semibold px-4 py-2 rounded-full"
              style={{ background: 'rgba(29,185,84,0.2)', color: '#1DB954', border: '1px solid rgba(29,185,84,0.4)' }}
            >
              Upload your library →
            </span>
          </button>
        </div>

        <p className="text-center font-body text-xs mt-8" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          Your file is processed entirely in this browser — nothing is ever uploaded to a server.
        </p>
      </div>
    </section>
  )
}
