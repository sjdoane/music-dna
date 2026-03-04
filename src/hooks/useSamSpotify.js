import { useState, useEffect } from 'react'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthUrl,
  exchangeCodeForToken,
  spotifyApi,
} from '../utils/spotify.js'
import { SPOTIFY_CLIENT_ID, REDIRECT_URI, SPOTIFY_SCOPES } from '../config.js'

const SAM_VERIFIER_KEY = 'sam_pkce_verifier'
const SAM_ARTISTS_KEY  = 'sam_artists'
const SAM_LIBRARY_KEY  = 'sam_library'
const SAM_SOURCE_KEY   = 'sam_artists_source'   // 'spotify' | 'manual' | 'file'
const SAM_STATE        = 'sam_auth'

function loadSaved(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveToStorage(artists, source, library = null) {
  localStorage.setItem(SAM_ARTISTS_KEY, JSON.stringify(artists))
  localStorage.setItem(SAM_SOURCE_KEY, source)
  if (library) {
    // Store a compact version (top artists only — allTracks can be huge)
    const compact = { topArtists: library.topArtists, totalTracks: library.totalTracks }
    localStorage.setItem(SAM_LIBRARY_KEY, JSON.stringify(compact))
  } else {
    localStorage.removeItem(SAM_LIBRARY_KEY)
  }
}

function clearStorage() {
  localStorage.removeItem(SAM_ARTISTS_KEY)
  localStorage.removeItem(SAM_SOURCE_KEY)
  localStorage.removeItem(SAM_LIBRARY_KEY)
}

export function useSamSpotify() {
  const [artists, setArtists] = useState(() => loadSaved(SAM_ARTISTS_KEY))
  const [library, setLibrary] = useState(() => loadSaved(SAM_LIBRARY_KEY))
  const [source,  setSource]  = useState(() => localStorage.getItem(SAM_SOURCE_KEY) || null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Handle Spotify callback when state=sam_auth
  useEffect(() => {
    const url   = new URL(window.location.href)
    const code  = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code || state !== SAM_STATE) return

    const verifier = sessionStorage.getItem(SAM_VERIFIER_KEY)
    if (!verifier) {
      setError('Session expired — please try connecting again.')
      window.history.replaceState({}, document.title, '/')
      return
    }

    window.history.replaceState({}, document.title, '/')
    sessionStorage.removeItem(SAM_VERIFIER_KEY)
    setLoading(true)
    setError(null)

    exchangeCodeForToken(SPOTIFY_CLIENT_ID, code, verifier, REDIRECT_URI)
      .then(async ({ access_token }) => {
        const topArtists = await fetchTopArtistsFromLikedSongs(access_token)
        saveToStorage(topArtists, 'spotify')
        setArtists(topArtists)
        setLibrary(null)
        setSource('spotify')
      })
      .catch((e) => setError(e.message || 'Something went wrong — please try again.'))
      .finally(() => setLoading(false))
  }, [])

  async function connect() {
    if (!SPOTIFY_CLIENT_ID) {
      setError('Spotify Client ID not set in .env')
      return
    }
    const verifier  = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    sessionStorage.setItem(SAM_VERIFIER_KEY, verifier)
    window.location.href = buildAuthUrl(SPOTIFY_CLIENT_ID, REDIRECT_URI, challenge, SPOTIFY_SCOPES, SAM_STATE)
  }

  function saveManual(artistList) {
    saveToStorage(artistList, 'manual')
    setArtists(artistList)
    setLibrary(null)
    setSource('manual')
  }

  /** Called when Sam uploads a Spotify liked songs file (Exportify CSV or Spotify JSON) */
  function saveFromFile(parsedLibrary) {
    const artistNames = parsedLibrary.topArtists.map((a) => a.name)
    saveToStorage(artistNames, 'file', parsedLibrary)
    setArtists(artistNames)
    setLibrary(parsedLibrary)
    setSource('file')
    setError(null)
  }

  function clear() {
    clearStorage()
    setArtists(null)
    setLibrary(null)
    setSource(null)
    setError(null)
  }

  return { artists, library, source, loading, error, connect, saveManual, saveFromFile, clear }
}

/**
 * Fetch up to 200 liked songs and extract the most-represented artists.
 */
async function fetchTopArtistsFromLikedSongs(token) {
  const all    = []
  let   offset = 0

  while (all.length < 200) {
    const data  = await spotifyApi.getLikedTracks(token, 50, offset)
    const items = data.items || []
    all.push(...items)
    if (!data.next || items.length < 50) break
    offset += 50
  }

  const counts = {}
  all.forEach(({ track }) => {
    if (!track?.artists) return
    track.artists.forEach((a) => {
      counts[a.name] = (counts[a.name] || 0) + 1
    })
  })

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name]) => name)
}
