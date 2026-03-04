// ─── PKCE helpers ───────────────────────────────────────────────────────────

/** Generate a cryptographically random code verifier (43–128 chars) */
export function generateCodeVerifier(length = 128) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join('')
}

/** Derive a code challenge from the verifier using SHA-256 + base64url */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Build the Spotify authorization URL */
export function buildAuthUrl(clientId, redirectUri, codeChallenge, scopes, state = '') {
  const params = new URLSearchParams({
    client_id:             clientId,
    response_type:         'code',
    redirect_uri:          redirectUri,
    code_challenge_method: 'S256',
    code_challenge:        codeChallenge,
    scope:                 scopes,
  })
  if (state) params.set('state', state)
  return `https://accounts.spotify.com/authorize?${params}`
}

/** Exchange the authorization code for an access token */
export async function exchangeCodeForToken(clientId, code, codeVerifier, redirectUri) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      grant_type:    'authorization_code',
      code,
      redirect_uri:  redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error_description || 'Token exchange failed')
  }

  return response.json()
}

// ─── Spotify API helpers ─────────────────────────────────────────────────────

async function spotifyFetch(endpoint, token) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Spotify API error: ${response.status}`)
  return response.json()
}

export const spotifyApi = {
  getProfile: (token) =>
    spotifyFetch('/me', token),

  getTopArtists: (token, timeRange = 'long_term', limit = 20) =>
    spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, token),

  getTopTracks: (token, timeRange = 'long_term', limit = 20) =>
    spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, token),

  searchAlbum: (token, query) =>
    spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=album&limit=1`, token),

  getLikedTracks: (token, limit = 50, offset = 0) =>
    spotifyFetch(`/me/tracks?limit=${limit}&offset=${offset}`, token),
}
