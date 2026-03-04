import { ANTHROPIC_API_KEY } from '../config.js'

/**
 * Generate album recommendations for Dad.
 *
 * @param {string[]}  dadArtists  - Top artist names from Dad's Spotify/Apple Music
 * @param {string[]}  samArtists  - Sam's top artist names (from manual or OAuth)
 * @param {object|null} samLibrary - Parsed Spotify library { topArtists, totalTracks }
 *
 * Returns an array of { artist, album, reason, fromSam } objects.
 */
export async function getAlbumRecommendations(dadArtists, samArtists = [], samLibrary = null) {
  const dadList      = dadArtists.slice(0, 5).join(', ')
  const hasLibrary   = Boolean(samLibrary?.topArtists?.length)
  const hasSamArtists = samArtists.length > 0
  const count        = (hasLibrary || hasSamArtists) ? 6 : 5

  let prompt

  if (hasLibrary) {
    // Rich mode: Sam uploaded her full library — use it as the recommendation pool
    const libArtists = samLibrary.topArtists
      .slice(0, 20)
      .map((a) =>
        a.trackCount ? `${a.name} (${a.trackCount} songs)` : a.name
      )
      .join(', ')

    // Collect a sample of album names from Sam's library
    const sampleAlbums = samLibrary.topArtists
      .slice(0, 15)
      .flatMap((a) => (a.albums || []).slice(0, 2).map((album) => `"${album}" by ${a.name}`))
      .slice(0, 12)
      .join('; ')

    const totalLabel = samLibrary.totalTracks
      ? `${samLibrary.totalTracks.toLocaleString()} songs`
      : 'many songs'

    prompt = `My dad loves these artists: ${dadList}.

His daughter Sam has a Spotify library of ${totalLabel}. Her top artists are: ${libArtists}.${
      sampleAlbums ? `\n\nSome albums Sam has saved: ${sampleAlbums}.` : ''
    }

Please recommend exactly ${count} albums that Dad would love — ideally drawn from Sam's library or artists similar to what she listens to, so they can discover music together:
- At least 3 should be albums Sam has or artists she loves, bridging their tastes. Set "fromSam": true for those and mention Sam's connection warmly (e.g. "Sam has this in her library and thinks you'd love it because…").
- The rest can be based purely on Dad's taste. Set "fromSam": false.

Respond with ONLY a JSON array (no markdown, no extra text) in this exact format:
[
  {
    "artist": "Artist Name",
    "album": "Album Title",
    "reason": "A warm, personal 1-2 sentence explanation.",
    "fromSam": false
  }
]

Keep reasons warm and conversational — like a loving daughter making a recommendation.`
  } else if (hasSamArtists) {
    // Classic Sam's picks mode: just artist names
    const samList = samArtists.slice(0, 8).join(', ')

    prompt = `My dad loves these artists: ${dadList}.

His daughter Sam also loves: ${samList} — and she wants to share a couple of her favourite albums with him.

Please recommend exactly ${count} albums Dad might love that he may not have discovered yet:
- At least 2 should be picks Sam thinks Dad would enjoy, bridging their two tastes. For those, set "fromSam": true and mention Sam's connection warmly in the reason (e.g. "Sam thinks you'd love this because…").
- The rest should be based purely on Dad's own taste. Set "fromSam": false.

Respond with ONLY a JSON array (no markdown, no extra text) in this exact format:
[
  {
    "artist": "Artist Name",
    "album": "Album Title",
    "reason": "A warm, personal 1-2 sentence explanation.",
    "fromSam": false
  }
]

Keep reasons warm and conversational — like a friend (or a loving daughter) making a recommendation.`
  } else {
    // Dad-only mode
    prompt = `My dad loves these artists: ${dadList}.

Please recommend exactly ${count} albums he might love that he may not have discovered yet.

Respond with ONLY a JSON array (no markdown, no extra text) in this exact format:
[
  {
    "artist": "Artist Name",
    "album": "Album Title",
    "reason": "A warm, personal 1-2 sentence explanation of why he'd love this given his taste.",
    "fromSam": false
  }
]

Keep the reasons warm, personal, and conversational — like a friend making a recommendation. Focus on albums outside his known favorites.`
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 1200,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Anthropic API error (${response.status})`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text

  if (!text) throw new Error('Empty response from AI — please try again.')

  // Strip any accidental markdown code fences
  const cleaned = text.replace(/```json?\s*/gi, '').replace(/```/g, '').trim()
  const parsed  = JSON.parse(cleaned)

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Unexpected response format from AI — please try again.')
  }

  return parsed
}
