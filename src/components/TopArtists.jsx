import { useState, useEffect } from 'react'
import { useReveal } from '../hooks/useReveal.js'

// Module-level cache so we don't re-fetch the same artist across re-renders
const imageCache = {}

async function fetchArtistImage(artistName) {
  if (imageCache[artistName] !== undefined) return imageCache[artistName]

  try {
    const term = encodeURIComponent(artistName)
    const res  = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=musicArtist&attribute=artistTerm&limit=1`
    )
    const data = await res.json()
    // musicArtist doesn't return artwork, so fall through to album search
    // Try fetching the most popular album by this artist instead
    const res2  = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=album&attribute=artistTerm&limit=1`
    )
    const data2 = await res2.json()
    const item  = data2.results?.[0]
    const url   = item?.artworkUrl100?.replace('100x100bb', '600x600bb') ?? null
    imageCache[artistName] = url
    return url
  } catch {
    imageCache[artistName] = null
    return null
  }
}

export default function TopArtists({ artists, recentArtists }) {
  const titleRef  = useReveal()
  const gridRef   = useReveal()
  const recentRef = useReveal()

  if (!artists) return null

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <div ref={titleRef} className="reveal text-center mb-16">
        <div className="section-divider" />
        <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--cream)' }}>
          Your All-Time Favourites
        </h2>
        <p className="font-body text-base" style={{ color: 'var(--text-muted)' }}>
          The artists you've loved the longest and returned to most.
        </p>
      </div>

      <div
        ref={gridRef}
        className="stagger-children grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-20"
      >
        {artists.slice(0, 15).map((artist, i) => (
          <ArtistCard key={artist.id} artist={artist} rank={i + 1} />
        ))}
      </div>

      {recentArtists && recentArtists.length > 0 && (
        <div ref={recentRef} className="reveal">
          <h3 className="font-display text-2xl sm:text-3xl font-semibold mb-2 text-center" style={{ color: 'var(--gold)' }}>
            What You've Been Spinning Lately
          </h3>
          <p className="font-body text-sm text-center mb-10" style={{ color: 'var(--text-muted)' }}>
            Your recent favourites from the past few weeks.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {recentArtists.map((artist, i) => (
              <span key={artist.id} className="px-4 py-2 rounded-full text-sm font-semibold font-body"
                style={{
                  background: `rgba(232,184,109,${0.15 - i * 0.01})`,
                  border: '1px solid rgba(232,184,109,0.3)',
                  color: 'var(--gold)',
                }}>
                {artist.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function ArtistCard({ artist, rank }) {
  const staticImg = artist.images?.[0]?.url   // from Spotify API (OAuth path)
  const needsFetch = !staticImg

  const [fetchedImg, setFetchedImg] = useState(
    needsFetch ? (imageCache[artist.name] ?? null) : null
  )
  const [imgLoading, setImgLoading] = useState(needsFetch && imageCache[artist.name] === undefined)

  useEffect(() => {
    if (!needsFetch) return
    if (imageCache[artist.name] !== undefined) {
      setFetchedImg(imageCache[artist.name])
      setImgLoading(false)
      return
    }
    let cancelled = false
    fetchArtistImage(artist.name).then((url) => {
      if (!cancelled) {
        setFetchedImg(url)
        setImgLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [artist.name, needsFetch])

  const img = staticImg || fetchedImg

  return (
    <div className="artist-card group">
      {img ? (
        <img src={img} alt={artist.name} loading="lazy" />
      ) : imgLoading ? (
        /* Shimmer placeholder while loading */
        <div
          className="w-full aspect-square"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
        />
      ) : (
        /* No image found — show initial */
        <div
          className="w-full aspect-square flex items-center justify-center font-display font-bold text-4xl"
          style={{ background: 'linear-gradient(135deg, var(--navy-light), var(--vinyl))', color: 'var(--gold)' }}
        >
          {artist.name[0].toUpperCase()}
        </div>
      )}
      <div className="overlay">
        <span className="font-display text-xs font-bold mb-1" style={{ color: 'var(--gold)', opacity: 0.8 }}>
          #{rank}
        </span>
        <span className="font-body text-sm font-semibold leading-tight" style={{ color: 'var(--cream)' }}>
          {artist.name}
        </span>
        {artist.playCount != null ? (
          <span className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {artist.playCount.toLocaleString()} plays
          </span>
        ) : artist.trackCount != null ? (
          <span className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {artist.trackCount} liked songs
          </span>
        ) : null}
      </div>
    </div>
  )
}
