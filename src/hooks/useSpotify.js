import { useState, useEffect, useCallback } from 'react'
import {
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthUrl,
  exchangeCodeForToken,
  spotifyApi,
} from '../utils/spotify.js'
import { SPOTIFY_CLIENT_ID, REDIRECT_URI, SPOTIFY_SCOPES } from '../config.js'

const VERIFIER_KEY = 'spotify_pkce_verifier'

export function useSpotify() {
  const [token, setToken]     = useState(null)
  const [profile, setProfile] = useState(null)
  const [topArtists, setTopArtists] = useState(null)
  const [recentArtists, setRecentArtists] = useState(null)
  const [topTracks, setTopTracks]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── Handle callback ────────────────────────────────────────────────
  useEffect(() => {
    const url    = new URL(window.location.href)
    const code   = url.searchParams.get('code')
    const state  = url.searchParams.get('state')
    const errParam = url.searchParams.get('error')

    // Let useSamSpotify handle its own callback
    if (state === 'sam_auth') return

    if (errParam) {
      setError(`Spotify auth denied: ${errParam}`)
      window.history.replaceState({}, document.title, '/')
      return
    }

    if (!code) return

    const verifier = sessionStorage.getItem(VERIFIER_KEY)
    if (!verifier) {
      setError('PKCE verifier missing. Please try connecting again.')
      window.history.replaceState({}, document.title, '/')
      return
    }

    // Clean up URL immediately
    window.history.replaceState({}, document.title, '/')
    sessionStorage.removeItem(VERIFIER_KEY)

    setLoading(true)
    exchangeCodeForToken(SPOTIFY_CLIENT_ID, code, verifier, REDIRECT_URI)
      .then((data) => {
        setToken(data.access_token)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Fetch data once we have a token ───────────────────────────────
  useEffect(() => {
    if (!token) return

    setLoading(true)
    Promise.all([
      spotifyApi.getProfile(token),
      spotifyApi.getTopArtists(token, 'long_term', 20),
      spotifyApi.getTopArtists(token, 'short_term', 10),
      spotifyApi.getTopTracks(token, 'long_term', 20),
    ])
      .then(([prof, artists, recent, tracks]) => {
        setProfile(prof)
        setTopArtists(artists.items)
        setRecentArtists(recent.items)
        setTopTracks(tracks.items)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  // ── Login ──────────────────────────────────────────────────────────
  const login = useCallback(async () => {
    if (!SPOTIFY_CLIENT_ID) {
      setError('Spotify Client ID not set. Add VITE_SPOTIFY_CLIENT_ID to your .env file.')
      return
    }
    const verifier   = generateCodeVerifier()
    const challenge  = await generateCodeChallenge(verifier)
    sessionStorage.setItem(VERIFIER_KEY, verifier)
    window.location.href = buildAuthUrl(SPOTIFY_CLIENT_ID, REDIRECT_URI, challenge, SPOTIFY_SCOPES)
  }, [])

  return {
    token,
    profile,
    topArtists,
    recentArtists,
    topTracks,
    loading,
    error,
    login,
    isConnected: !!token,
  }
}
