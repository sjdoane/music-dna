import { useState, useEffect } from 'react'
import { useReveal } from '../hooks/useReveal.js'
import { fetchArtwork } from '../utils/fetchArtwork.js'

export default function TopTracks({ overlapTracks }) {
  const titleRef = useReveal()
  const listRef  = useReveal()
  const [artMap, setArtMap] = useState({})

  // Fetch album art for each track
  useEffect(() => {
    if (!overlapTracks?.length) return
    let cancelled = false

    const fetch = async () => {
      const entries = await Promise.all(
        overlapTracks.map(async (t) => {
          const artist = t.artist || t.artists?.[0]?.name || ''
          const album  = t.album?.name || t.album || ''
          const url    = await fetchArtwork(t.uri || '', artist, album)
          return [t.uri || `${artist}|||${t.track || t.name}`, url]
        }),
      )
      if (!cancelled) setArtMap(Object.fromEntries(entries))
    }
    fetch()
    return () => { cancelled = true }
  }, [overlapTracks])

  if (!overlapTracks) return null

  if (overlapTracks.length === 0) {
    return (
      <section
        className="py-24 px-6"
        style={{ background: 'linear-gradient(160deg, #111 0%, #1a1a2e 100%)' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="section-divider" />
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--cream)' }}>
            Songs We Both Love
          </h2>
          <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
            No matching songs found — make sure you uploaded an Exportify CSV so track URIs are available.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      className="py-24 px-6"
      style={{ background: 'linear-gradient(160deg, #111 0%, #1a1a2e 100%)' }}
    >
      <div className="max-w-3xl mx-auto">
        <div ref={titleRef} className="reveal text-center mb-4">
          <div className="section-divider" />
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--cream)' }}>
            Songs We Both Love
          </h2>
          <p className="font-body text-sm mb-12" style={{ color: 'var(--text-muted)' }}>
            Tracks we've both saved — spanning the years
          </p>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(17,17,17,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(26,26,46,0.8)' }}
          >
            <span className="font-display text-xs italic" style={{ color: 'var(--gold)', opacity: 0.7 }}>
              Shared Playlist
            </span>
            <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
              {overlapTracks.length} tracks
            </span>
          </div>

          <div ref={listRef} className="stagger-children divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {overlapTracks.map((track, i) => {
              const artist  = track.artist || track.artists?.[0]?.name || ''
              const name    = track.track  || track.name || ''
              const album   = track.album?.name || track.album || ''
              const trackKey = track.uri || `${artist}|||${name}`
              const artUrl  = artMap[trackKey]
              const year    = track.addedAt ? new Date(track.addedAt).getFullYear() : null
              return (
                <SharedTrackRow
                  key={trackKey}
                  rank={i + 1}
                  name={name}
                  artist={artist}
                  album={album}
                  artUrl={artUrl}
                  yearAdded={year}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function SharedTrackRow({ rank, name, artist, album, artUrl, yearAdded }) {
  return (
    <div className="track-row">
      {/* Rank */}
      <span
        className="font-display text-sm font-bold w-7 text-right shrink-0"
        style={{ color: 'var(--gold)', opacity: 0.5 }}
      >
        {rank}
      </span>

      {/* Album art */}
      {artUrl ? (
        <img src={artUrl} alt={album}
          className="w-10 h-10 rounded shrink-0 object-cover" loading="lazy" />
      ) : (
        <div
          className="w-10 h-10 rounded shrink-0 flex items-center justify-center font-display font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, var(--navy-light), var(--vinyl))', color: 'var(--gold)' }}
        >
          {artist?.[0]?.toUpperCase() ?? '♪'}
        </div>
      )}

      {/* Title & artist */}
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold truncate" style={{ color: 'var(--cream)' }}>
          {name}
        </p>
        <p className="font-body text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {artist}
          {album && <span style={{ opacity: 0.5 }}> · {album}</span>}
        </p>
      </div>

      {/* Year added */}
      {yearAdded && (
        <div className="shrink-0 text-right">
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
            {yearAdded}
          </p>
        </div>
      )}
    </div>
  )
}
