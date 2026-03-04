import { useReveal } from '../hooks/useReveal.js'

// Warm color palette for genre tags
const COLORS = [
  { bg: 'rgba(232,184,109,0.15)', border: 'rgba(232,184,109,0.5)',  text: '#e8b86d' },
  { bg: 'rgba(196,114,127,0.15)', border: 'rgba(196,114,127,0.5)',  text: '#c4727f' },
  { bg: 'rgba(100,160,210,0.12)', border: 'rgba(100,160,210,0.4)',  text: '#87bde0' },
  { bg: 'rgba(130,190,130,0.12)', border: 'rgba(130,190,130,0.4)',  text: '#8fbe8f' },
  { bg: 'rgba(180,140,220,0.12)', border: 'rgba(180,140,220,0.4)',  text: '#b88cdc' },
  { bg: 'rgba(220,160,90,0.15)',  border: 'rgba(220,160,90,0.4)',   text: '#dcA05a' },
  { bg: 'rgba(90,180,200,0.12)',  border: 'rgba(90,180,200,0.4)',   text: '#5ab4c8' },
  { bg: 'rgba(210,120,90,0.12)',  border: 'rgba(210,120,90,0.4)',   text: '#d2785a' },
]

export default function MusicDNA({ artists, allTracks }) {
  const titleRef = useReveal()
  const tagsRef  = useReveal()

  if (!artists && !allTracks) return null

  // Prefer genres from allTracks (per-song Genres column), fall back to artist genres
  const genres = allTracks?.length
    ? extractGenresFromTracks(allTracks)
    : extractGenresFromArtists(artists ?? [])

  const maxCount = genres[0]?.count || 1

  return (
    <section className="py-24 px-6 max-w-4xl mx-auto">
      <div ref={titleRef} className="reveal text-center mb-16">
        <div className="section-divider" />
        <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--cream)' }}>
          Your Music DNA
        </h2>
        <p className="font-body text-base" style={{ color: 'var(--text-muted)' }}>
          The genres that define your taste
        </p>
      </div>

      {/* Genre cloud */}
      <div ref={tagsRef} className="stagger-children flex flex-wrap gap-3 justify-center">
        {genres.map((g, i) => {
          const color    = COLORS[i % COLORS.length]
          const weight   = g.count / maxCount          // 0–1
          const fontSize = 0.75 + weight * 1.0         // 0.75rem – 1.75rem
          const padding  = `${0.4 + weight * 0.4}rem ${0.8 + weight * 0.7}rem`

          return (
            <span
              key={g.genre}
              className="genre-tag font-body capitalize"
              style={{
                fontSize:   `${fontSize}rem`,
                padding,
                background: color.bg,
                border:     `1px solid ${color.border}`,
                color:      color.text,
              }}
            >
              {g.genre}
            </span>
          )
        })}
      </div>

      {genres.length === 0 && (
        <p className="text-center font-body" style={{ color: 'var(--text-muted)' }}>
          No genre data found in your export.
        </p>
      )}
    </section>
  )
}

function extractGenresFromTracks(allTracks) {
  const counts = {}
  for (const t of allTracks) {
    const genres = t.genres
    if (!genres?.length) continue
    for (const g of genres) {
      const key = g.toLowerCase().trim()
      if (key) counts[key] = (counts[key] || 0) + 1
    }
  }
  const top = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([genre, count]) => ({ genre, count }))

  console.log('[MusicDNA] top genres:', top.slice(0, 10).map((g) => `${g.genre}(${g.count})`).join(', '))
  return top
}

function extractGenresFromArtists(artists) {
  const counts = {}
  artists.forEach((a) => {
    a.genres?.forEach((g) => {
      counts[g] = (counts[g] || 0) + 1
    })
  })
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([genre, count]) => ({ genre, count }))
}
