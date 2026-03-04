export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ''
export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

// Use the current origin so this works in both dev and production
export const REDIRECT_URI = `${window.location.origin}/callback`

export const SPOTIFY_SCOPES = [
  'user-top-read',
  'user-read-recently-played',
  'user-read-private',
].join(' ')
