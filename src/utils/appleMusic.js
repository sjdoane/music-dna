/**
 * Parse a single CSV line using RFC-4180 rules (handles quoted commas and newlines).
 */
export function parseCSVLine(line) {
  const fields = []
  let current  = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch   = line[i]
    const next = line[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

/**
 * Parse the full Apple Music Play Activity CSV text.
 * Returns { topArtists, topTracks } in Spotify-compatible shape.
 */
export function parseAppleMusicCSV(text) {
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) throw new Error('File appears to be empty or invalid.')

  // Parse header row — detect column indices case-insensitively
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())

  const idx = (name) => {
    const i = headers.findIndex((h) => h.includes(name))
    if (i === -1) throw new Error(`Column "${name}" not found in CSV header. Is this the correct Apple Music export file?`)
    return i
  }

  const colArtist   = idx('artist name')
  const colTrack    = idx('track description')
  const colAlbum    = idx('album name')       // may throw — that's fine
  const colGenre    = (() => { try { return idx('genre') } catch { return -1 } })()
  const colPlayMs   = (() => { try { return idx('play duration milliseconds') } catch { return -1 } })()
  const colMediaMs  = (() => { try { return idx('media duration in milliseconds') } catch { return -1 } })()

  const artistMap = new Map()  // artist name → { playCount, genres }
  const trackMap  = new Map()  // "artist|||track" → { artist, track, album, duration_ms, playCount }
  let   totalRows = 0

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    totalRows++

    const fields = parseCSVLine(line)
    const artist = fields[colArtist]?.trim()
    const track  = fields[colTrack]?.trim()

    if (!artist || !track) continue

    const album   = colAlbum  >= 0 ? (fields[colAlbum]?.trim()  || '') : ''
    const genre   = colGenre  >= 0 ? (fields[colGenre]?.trim()  || '') : ''
    const playMs  = colPlayMs >= 0 ? parseInt(fields[colPlayMs]  || '0', 10) : 0
    const mediaMs = colMediaMs >= 0 ? parseInt(fields[colMediaMs] || '0', 10) : 0

    // Count as a play only when played for at least 30 s or >50% of track
    const isPlay = playMs >= 30000 || (mediaMs > 0 && playMs / mediaMs >= 0.5)
    if (!isPlay) continue

    // Artist aggregation
    if (!artistMap.has(artist)) {
      artistMap.set(artist, { playCount: 0, genres: new Set() })
    }
    const aEntry = artistMap.get(artist)
    aEntry.playCount++
    if (genre) aEntry.genres.add(genre)

    // Track aggregation
    const trackKey = `${artist}|||${track}`
    if (!trackMap.has(trackKey)) {
      trackMap.set(trackKey, { artist, track, album, duration_ms: mediaMs || 0, playCount: 0 })
    }
    trackMap.get(trackKey).playCount++
  }

  if (totalRows === 0) throw new Error('No data rows found — make sure you uploaded the Play Activity file.')

  // Build topArtists (Spotify-compatible shape)
  const topArtists = Array.from(artistMap.entries())
    .sort(([, a], [, b]) => b.playCount - a.playCount)
    .slice(0, 20)
    .map(([name, { playCount, genres }], idx) => ({
      id:        name,
      name,
      images:    [],
      genres:    Array.from(genres),
      playCount,
      followers: null,
    }))

  // Build topTracks (Spotify-compatible shape)
  const topTracks = Array.from(trackMap.values())
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 20)
    .map((t, idx) => ({
      id:          `${t.artist}|||${t.track}`,
      name:        t.track,
      artists:     [{ name: t.artist }],
      album:       { name: t.album, images: [] },
      duration_ms: t.duration_ms,
      playCount:   t.playCount,
    }))

  return { topArtists, topTracks }
}
