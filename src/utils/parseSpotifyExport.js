/**
 * Parse a Spotify liked-songs export file.
 *
 * Supported formats:
 *  1. Exportify CSV   — from exportify.net (recommended — instant download)
 *  2. YourLibrary.json — from Spotify's official data request (privacy.spotify.com)
 *  3. StreamingHistory.json — extended history from Spotify data request
 *
 * Returns:
 *  { topArtists, topTracks, allTracks, totalTracks }
 *  where topArtists/topTracks are Spotify-API-compatible shapes.
 */
export function parseSpotifyExport(content, filename = '') {
  const ext = filename.split('.').pop().toLowerCase()
  // Strip UTF-8 BOM that Exportify adds to its CSV exports
  const stripped = content.replace(/^\uFEFF/, '')
  const trimmed = stripped.trim()

  // Decide format by extension, fall back to content sniffing
  if (ext === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return parseSpotifyJSON(stripped)
  }
  return parseExportifyCSV(stripped)
}

// ─── JSON formats ────────────────────────────────────────────────────────────

function parseSpotifyJSON(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON file. Please check you selected the right file.')
  }

  let rawTracks = []

  // YourLibrary.json  →  { tracks: [{ artist, album, track, uri }] }
  if (data && Array.isArray(data.tracks) && data.tracks[0]?.artist !== undefined) {
    rawTracks = data.tracks.map((t) => ({
      artist: t.artist?.trim() || '',
      track:  t.track?.trim()  || '',
      album:  t.album?.trim()  || '',
    }))
  }

  // StreamingHistory (old format)  →  [{ artistName, trackName, msPlayed }]
  else if (Array.isArray(data) && data[0]?.artistName !== undefined) {
    rawTracks = data
      .filter((t) => (t.msPlayed ?? 0) >= 30_000)
      .map((t) => ({
        artist: t.artistName?.trim() || '',
        track:  t.trackName?.trim()  || '',
        album:  '',
      }))
  }

  // StreamingHistory (extended format) → [{ master_metadata_album_artist_name, ... }]
  else if (Array.isArray(data) && data[0]?.master_metadata_album_artist_name !== undefined) {
    rawTracks = data
      .filter((t) => (t.ms_played ?? 0) >= 30_000)
      .map((t) => ({
        artist: t.master_metadata_album_artist_name?.trim() || '',
        track:  t.master_metadata_track_name?.trim()         || '',
        album:  t.master_metadata_album_album_name?.trim()   || '',
      }))
  }

  else {
    throw new Error(
      'Unrecognized JSON format. Expected YourLibrary.json or StreamingHistory.json from Spotify.'
    )
  }

  const tracks = rawTracks.filter((t) => t.artist && t.track)
  if (tracks.length === 0) throw new Error('No tracks found in the file.')
  return buildLibrary(tracks)
}

// ─── Exportify CSV ───────────────────────────────────────────────────────────

function parseExportifyCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) throw new Error('File appears to be empty.')

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())

  // Flexible column finder
  const findCol = (...candidates) => {
    for (const name of candidates) {
      const i = headers.findIndex((h) => h === name || h.includes(name))
      if (i >= 0) return i
    }
    return -1
  }

  const colArtist     = findCol('artist name(s)', 'artist name', 'artist names', 'artist')
  const colTrack      = findCol('track name', 'track')
  const colAlbum      = findCol('album name', 'album')
  const colPopularity = findCol('popularity')
  const colAddedAt    = findCol('added at')
  const colRelease    = findCol('release date', 'album release date')
  const colUri        = findCol('spotify uri', 'track uri', 'uri')
  const colGenres     = findCol('artist genres', 'genres', 'genre')
  const colDance      = findCol('danceability')
  const colEnergy     = findCol('energy')
  const colLoudness   = findCol('loudness')
  const colSpeech     = findCol('speechiness')
  const colAcoustic   = findCol('acousticness')
  const colInstrum    = findCol('instrumentalness')
  const colLiveness   = findCol('liveness')
  const colValence    = findCol('valence')

  if (colArtist < 0 || colTrack < 0) {
    throw new Error(
      'Could not find the required columns (Artist Name, Track Name) in this CSV. ' +
      'Please make sure you exported your liked songs from exportify.net.'
    )
  }

  const parseF = (val) => { const n = parseFloat(val); return isNaN(n) ? null : n }

  const tracks = []
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i])
    // Exportify may list multiple artists as "Artist A, Artist B" — take the first
    const artist = fields[colArtist]?.trim().split(', ')[0]?.trim() || ''
    const track  = fields[colTrack]?.trim() || ''
    if (!artist || !track) continue

    const album      = colAlbum      >= 0 ? (fields[colAlbum]?.trim()      || '') : ''
    const popularity = colPopularity >= 0 ? parseInt(fields[colPopularity] || '0', 10) : 0
    const addedAt    = colAddedAt    >= 0 ? (fields[colAddedAt]?.trim()     || '') : ''
    const releaseDate= colRelease    >= 0 ? (fields[colRelease]?.trim()     || '') : ''
    const uri        = colUri        >= 0 ? (fields[colUri]?.trim()         || '') : ''
    const genres     = colGenres     >= 0 ? parseGenreField(fields[colGenres]) : []
    tracks.push({
      artist, track, album, popularity, addedAt, releaseDate, uri, genres,
      danceability:     colDance    >= 0 ? parseF(fields[colDance])    : null,
      energy:           colEnergy   >= 0 ? parseF(fields[colEnergy])   : null,
      loudness:         colLoudness >= 0 ? parseF(fields[colLoudness]) : null,
      speechiness:      colSpeech   >= 0 ? parseF(fields[colSpeech])   : null,
      acousticness:     colAcoustic >= 0 ? parseF(fields[colAcoustic]) : null,
      instrumentalness: colInstrum  >= 0 ? parseF(fields[colInstrum])  : null,
      liveness:         colLiveness >= 0 ? parseF(fields[colLiveness]) : null,
      valence:          colValence  >= 0 ? parseF(fields[colValence])  : null,
    })
  }

  if (tracks.length === 0) throw new Error('No tracks found in the CSV.')
  return buildLibrary(tracks)
}

// ─── Genre field parser ───────────────────────────────────────────────────────

function parseGenreField(raw) {
  if (!raw) return []
  const s = raw.trim()
  if (!s) return []
  // Python-style list: ['indie rock', 'alternative rock']
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s.replace(/'/g, '"'))
      if (Array.isArray(parsed)) return parsed.map((g) => String(g).trim()).filter(Boolean)
    } catch { /* fall through */ }
    // Manual strip of brackets + quotes
    return s.slice(1, -1).split(',').map((g) => g.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
  }
  // Plain comma-separated
  return s.split(',').map((g) => g.trim()).filter(Boolean)
}

// ─── Shared builder ───────────────────────────────────────────────────────────

function buildLibrary(tracks) {
  // Count per artist and collect their album names
  const artistCounts = {}
  const artistAlbums = {}

  for (const { artist, album } of tracks) {
    artistCounts[artist] = (artistCounts[artist] || 0) + 1
    if (!artistAlbums[artist]) artistAlbums[artist] = new Set()
    if (album) artistAlbums[artist].add(album)
  }

  // Top 20 artists (Spotify-compatible shape + extra library fields)
  const topArtists = Object.entries(artistCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([name, trackCount]) => ({
      id:         name,
      name,
      images:     [],
      genres:     [],
      trackCount,                                    // how many songs in library
      albums:     Array.from(artistAlbums[name] || []).slice(0, 5),
    }))

  // Top 20 tracks — deduplicated, sorted by popularity descending
  const seen = new Set()
  const uniqueTracks = []
  for (const t of tracks) {
    const key = `${t.artist}|||${t.track}`
    if (seen.has(key)) continue
    seen.add(key)
    uniqueTracks.push(t)
  }
  const topTracks = uniqueTracks
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 20)
    .map((t) => {
      const yearAdded = t.addedAt ? new Date(t.addedAt).getFullYear() : null
      const yearReleased = t.releaseDate ? parseInt(t.releaseDate.slice(0, 4), 10) : null
      return {
        id:               t.uri || `${t.artist}|||${t.track}`,
        uri:              t.uri || '',
        name:             t.track,
        artists:          [{ name: t.artist }],
        album:            { name: t.album, images: [] },
        duration_ms:      0,
        popularity:       t.popularity ?? null,
        genres:           t.genres || [],
        yearAdded,
        yearReleased,
        addedAt:          t.addedAt || '',
        danceability:     t.danceability,
        energy:           t.energy,
        loudness:         t.loudness,
        speechiness:      t.speechiness,
        acousticness:     t.acousticness,
        instrumentalness: t.instrumentalness,
        liveness:         t.liveness,
        valence:          t.valence,
      }
    })

  return { topArtists, topTracks, allTracks: tracks, totalTracks: tracks.length }
}

// ─── CSV line parser (RFC-4180) ───────────────────────────────────────────────

function parseCSVLine(line) {
  const fields = []
  let current  = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch   = line[i]
    const next = line[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') { current += '"'; i++ }
      else if (ch === '"')             inQuotes = false
      else                             current += ch
    } else {
      if (ch === '"')      inQuotes = true
      else if (ch === ',') { fields.push(current); current = '' }
      else                   current += ch
    }
  }
  fields.push(current)
  return fields
}
