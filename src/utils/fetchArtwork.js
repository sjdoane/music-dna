/**
 * Fetch album/track artwork with two strategies:
 *  1. Spotify oEmbed  — uses the track's Spotify URI (no auth needed, very accurate)
 *  2. iTunes Search   — fallback for tracks without a URI or when oembed fails
 *
 * Results are cached at module level across the whole session.
 */

const cache = {}

export async function fetchArtwork(uri, artist, album) {
  const key = uri || `${artist}|||${album}`
  if (key in cache) return cache[key]

  // ── Strategy 1: Spotify oEmbed (accurate, no auth) ──────────────────────────
  if (uri?.startsWith('spotify:track:')) {
    try {
      const trackId   = uri.split(':')[2]
      const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${encodeURIComponent(trackId)}`
      const res       = await fetch(oembedUrl)
      if (res.ok) {
        const data = await res.json()
        if (data.thumbnail_url) {
          cache[key] = data.thumbnail_url
          return data.thumbnail_url
        }
      }
    } catch { /* fall through to iTunes */ }
  }

  // ── Strategy 2: iTunes Search fallback ──────────────────────────────────────
  try {
    const term = encodeURIComponent(`${album} ${artist}`.trim())
    const res  = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=3`)
    const data = await res.json()

    // Pick the result whose album title most closely matches
    const target  = album.toLowerCase().trim()
    const results = data.results ?? []
    const best    = results.find((r) =>
      r.collectionName?.toLowerCase().includes(target) ||
      target.includes(r.collectionName?.toLowerCase() ?? '')
    ) ?? results[0]

    const url = best?.artworkUrl100?.replace('100x100bb', '300x300bb') ?? null
    cache[key] = url
    return url
  } catch {
    cache[key] = null
    return null
  }
}
