import { useReveal } from '../hooks/useReveal.js'

/**
 * A small, warm section that tells Dad that Sam's picks are baked in.
 * Shows her top artists as coloured tags.
 */
export default function SamsLibraryBadge({ library }) {
  const ref = useReveal()

  if (!library?.topArtists?.length) return null

  const topNames    = library.topArtists.slice(0, 10).map((a) => a.name)
  const totalTracks = library.totalTracks

  return (
    <section
      className="px-6 pb-6"
      style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #111 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div
          ref={ref}
          className="reveal rounded-2xl px-6 py-5"
          style={{
            background: 'rgba(196,114,127,0.06)',
            border: '1px solid rgba(196,114,127,0.25)',
          }}
        >
          <div className="flex items-start gap-3 mb-4">
            <span className="text-xl shrink-0" role="img" aria-label="heart">♡</span>
            <div>
              <p className="font-display text-base font-semibold" style={{ color: 'var(--cream)' }}>
                A note from Sam
              </p>
              <p className="font-body text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                I pulled some of my favourite albums from my own Spotify library
                {totalTracks ? ` (${totalTracks.toLocaleString()} songs and counting)` : ''} to
                recommend to you below. A couple of picks in the next section are especially from me —
                look out for the <span style={{ color: 'var(--rose)' }}>♡ From Sam</span> badge.
              </p>
            </div>
          </div>

          {/* Sam's top artists as tags */}
          <div className="flex flex-wrap gap-2 pl-9">
            {topNames.map((name, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full font-body text-xs font-semibold"
                style={{
                  background: 'rgba(196,114,127,0.15)',
                  border: '1px solid rgba(196,114,127,0.3)',
                  color: 'var(--rose)',
                }}
              >
                {name}
              </span>
            ))}
            {library.topArtists.length > 10 && (
              <span className="px-3 py-1 font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                +{library.topArtists.length - 10} more
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
