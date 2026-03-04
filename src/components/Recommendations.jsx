import { useMemo, useState, useEffect } from 'react'
import { useReveal } from '../hooks/useReveal.js'
import { fetchArtwork } from '../utils/fetchArtwork.js'

// Audio feature keys used for similarity, in order
const FEATURE_KEYS = [
  'danceability', 'energy', 'loudness',
  'speechiness', 'acousticness', 'instrumentalness',
  'liveness', 'valence',
]

// Normalize loudness from dB (~-60 to 0) to 0–1
function normalizeLoudness(db) {
  if (db == null) return null
  return Math.max(0, Math.min(1, (db + 60) / 60))
}

function toVector(track) {
  const v = FEATURE_KEYS.map((k) => {
    const val = track[k]
    if (val == null) return null
    return k === 'loudness' ? normalizeLoudness(val) : val
  })
  // Require at least 4 non-null features
  const nonNull = v.filter((x) => x !== null).length
  if (nonNull < 4) return null
  // Replace nulls with 0
  return v.map((x) => (x === null ? 0 : x))
}

function dotProduct(a, b) {
  return a.reduce((sum, ai, i) => sum + ai * b[i], 0)
}

function magnitude(v) {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0))
}

function cosineSimilarity(a, b) {
  const magA = magnitude(a)
  const magB = magnitude(b)
  if (magA === 0 || magB === 0) return 0
  return dotProduct(a, b) / (magA * magB)
}

function meanVector(vectors) {
  if (!vectors.length) return null
  const len = vectors[0].length
  const sum = new Array(len).fill(0)
  for (const v of vectors) {
    for (let i = 0; i < len; i++) sum[i] += v[i]
  }
  return sum.map((s) => s / vectors.length)
}


export default function Recommendations({ overlapTracks, samLibrary }) {
  const titleRef = useReveal()
  const gridRef  = useReveal()
  const [artMap, setArtMap] = useState({})

  // Compute top-10 recommendations via cosine similarity
  const recommendations = useMemo(() => {
    const samTracks = samLibrary?.allTracks
    if (!overlapTracks?.length || !samTracks?.length) return []

    // Build mean vector from overlap songs
    const overlapVectors = overlapTracks
      .map((t) => toVector(t))
      .filter(Boolean)

    if (overlapVectors.length === 0) return []

    const mean = meanVector(overlapVectors)
    console.log('[Recommendations] mean feature vector:', mean.map((v) => v.toFixed(3)))

    // Build set of overlap URIs to exclude
    const overlapUris = new Set(overlapTracks.filter((t) => t.uri).map((t) => t.uri))

    // Score every Sam track not in overlap
    const scored = []
    for (const t of samTracks) {
      if (t.uri && overlapUris.has(t.uri)) continue
      const vec = toVector(t)
      if (!vec) continue
      const score = cosineSimilarity(mean, vec)
      scored.push({ track: t, score })
    }

    scored.sort((a, b) => b.score - a.score)

    // Take top 20 candidates, then randomly sample 10 so each upload gives different picks
    const pool     = scored.slice(0, 20)
    const shuffled = pool.slice().sort(() => Math.random() - 0.5)
    const top10    = shuffled.slice(0, 10)
    // Re-sort the final 10 by score so the display order is best-first
    top10.sort((a, b) => b.score - a.score)

    console.log('[Recommendations] top 3 selected:', top10.slice(0, 3).map((r) =>
      `${r.track.track || r.track.name} — ${(r.score * 100).toFixed(1)}%`
    ))

    // Verify no overlap duplicates
    const topUris = top10.map((r) => r.track.uri).filter(Boolean)
    const hasDup  = topUris.some((u) => overlapUris.has(u))
    console.log('[Recommendations] overlap duplicates in top 10:', hasDup)

    return top10.map((r) => ({
      uri:     r.track.uri,
      name:    r.track.track || r.track.name || '',
      artist:  r.track.artist || '',
      album:   r.track.album || '',
      score:   r.score,
      pct:     Math.round(r.score * 100),
    }))
  }, [overlapTracks, samLibrary])

  // Fetch album art for recommendations
  useEffect(() => {
    if (!recommendations.length) return
    let cancelled = false
    const load = async () => {
      const entries = await Promise.all(
        recommendations.map(async (r) => {
          const url = await fetchArtwork(r.uri || '', r.artist, r.album)
          return [r.uri || `${r.artist}|||${r.name}`, url]
        }),
      )
      if (!cancelled) setArtMap(Object.fromEntries(entries))
    }
    load()
    return () => { cancelled = true }
  }, [recommendations])

  if (!overlapTracks?.length) {
    return (
      <section
        className="py-24 px-6"
        style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #111 100%)' }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className="section-divider" />
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--cream)' }}>
            Recommended For You
          </h2>
          <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
            Upload an Exportify CSV to unlock personalised recommendations.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      className="py-24 px-6"
      style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #111 100%)' }}
    >
      <div className="max-w-5xl mx-auto">
        <div ref={titleRef} className="reveal text-center mb-16">
          <div className="section-divider" />
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--cream)' }}>
            Recommended For You
          </h2>
          <p className="font-body text-base" style={{ color: 'var(--text-muted)' }}>
            From Sam's library — picked because they match your taste
            <span style={{ color: 'var(--rose)' }}> ♡</span>
          </p>
        </div>

        {recommendations.length === 0 && (
          <p className="text-center font-body" style={{ color: 'var(--text-muted)' }}>
            Not enough audio feature data to generate recommendations — try uploading a newer Exportify CSV.
          </p>
        )}

        {recommendations.length > 0 && (
          <div ref={gridRef} className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => {
              const artKey = rec.uri || `${rec.artist}|||${rec.name}`
              return (
                <RecCard key={artKey} rec={rec} artUrl={artMap[artKey]} />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function RecCard({ rec, artUrl }) {
  return (
    <div className="album-card flex flex-col">
      <div className="relative aspect-square overflow-hidden">
        {artUrl ? (
          <img
            src={artUrl}
            alt={`${rec.album} by ${rec.artist}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-display font-bold text-5xl"
            style={{ background: 'linear-gradient(135deg, var(--navy-light), var(--vinyl))', color: 'var(--gold)' }}
          >
            {rec.artist?.[0]?.toUpperCase() ?? '♪'}
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(17,17,17,0.6) 0%, transparent 40%)' }}
        />
        {/* Match score badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full font-body text-xs font-bold"
          style={{ background: 'rgba(232,184,109,0.9)', color: '#111', backdropFilter: 'blur(4px)' }}
        >
          {rec.pct}% match
        </div>
        {/* From Sam badge */}
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full font-body text-xs font-semibold flex items-center gap-1"
          style={{ background: 'rgba(196,114,127,0.85)', color: '#fff', backdropFilter: 'blur(4px)' }}
        >
          ♡ From Sam
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="font-display text-lg font-semibold mb-0.5 leading-snug" style={{ color: 'var(--cream)' }}>
          {rec.name}
        </p>
        <p className="font-body text-sm font-semibold mb-1" style={{ color: 'var(--gold)' }}>
          {rec.artist}
        </p>
        {rec.album && (
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            {rec.album}
          </p>
        )}
      </div>
    </div>
  )
}
