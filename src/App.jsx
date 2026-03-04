import Hero                from './components/Hero.jsx'
import MusicSourceSelector from './components/MusicSourceSelector.jsx'
import SpotifyFileUpload   from './components/SpotifyFileUpload.jsx'
import TopArtists          from './components/TopArtists.jsx'
import TopTracks           from './components/TopTracks.jsx'
import MusicDNA            from './components/MusicDNA.jsx'
import SamsLibraryBadge    from './components/SamsLibraryBadge.jsx'
import Recommendations     from './components/Recommendations.jsx'
import PersonalNote        from './components/PersonalNote.jsx'
import LoadingSpinner      from './components/LoadingSpinner.jsx'
import { SAM_LIBRARY }     from './data/samLibrary.js'
import { useState, useMemo } from 'react'

// ─── Persistence helpers ──────────────────────────────────────────────────────

const DAD_SOURCE_KEY = 'dad_music_source'
const DAD_DATA_KEY   = 'dad_music_data'

function loadDadData() {
  try {
    const source = localStorage.getItem(DAD_SOURCE_KEY)
    const raw    = localStorage.getItem(DAD_DATA_KEY)
    if (!source || !raw) return { source: null, data: null }
    return { source, data: JSON.parse(raw) }
  } catch {
    return { source: null, data: null }
  }
}

function saveDadData(source, data) {
  try {
    localStorage.setItem(DAD_SOURCE_KEY, source)
    localStorage.setItem(DAD_DATA_KEY, JSON.stringify({
      topArtists:  data.topArtists,
      topTracks:   data.topTracks,
      allTracks:   data.allTracks ?? null,
      totalTracks: data.totalTracks ?? null,
    }))
  } catch { /* localStorage full — skip */ }
}

function clearDadData() {
  localStorage.removeItem(DAD_SOURCE_KEY)
  localStorage.removeItem(DAD_DATA_KEY)
}

// ─── Shared songs helpers ─────────────────────────────────────────────────────

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function computeSharedSongs(dadAllTracks, samAllTracks, count = 20) {
  if (!dadAllTracks?.length || !samAllTracks?.length) return []

  const samUriSet = new Set(samAllTracks.filter((t) => t.uri).map((t) => t.uri))
  const overlap   = dadAllTracks.filter((t) => t.uri && samUriSet.has(t.uri))
  if (overlap.length === 0) return []

  // Group by year from dad's "Added at" column, shuffled within each year
  const byYear = {}
  for (const t of overlap) {
    const year = t.addedAt ? String(new Date(t.addedAt).getFullYear()) : 'unknown'
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(t)
  }
  for (const yr of Object.keys(byYear)) byYear[yr] = shuffleArray(byYear[yr])

  // Proportional allocation across years
  const years      = Object.keys(byYear)
  const target     = Math.min(count, overlap.length)
  const yearCounts = {}
  let allocated    = 0

  for (const yr of years) {
    const share = Math.floor((byYear[yr].length / overlap.length) * target)
    yearCounts[yr] = share
    allocated += share
  }

  // Distribute remainder to years with most songs first
  const bySize = [...years].sort((a, b) => byYear[b].length - byYear[a].length)
  let rem = target - allocated
  for (let i = 0; rem > 0 && i < bySize.length; i++) {
    if (yearCounts[bySize[i]] < byYear[bySize[i]].length) {
      yearCounts[bySize[i]]++
      rem--
    }
  }

  const selected = []
  for (const yr of years) selected.push(...byYear[yr].slice(0, yearCounts[yr]))

  // Top-up if rounding left us short
  if (selected.length < target) {
    const pickedUris = new Set(selected.map((t) => t.uri))
    const extras = overlap.filter((t) => !pickedUris.has(t.uri))
    selected.push(...extras.slice(0, target - selected.length))
  }

  // Console verification
  const dist = {}
  for (const t of selected) {
    const yr = t.addedAt ? String(new Date(t.addedAt).getFullYear()) : 'unknown'
    dist[yr] = (dist[yr] || 0) + 1
  }
  console.log('[SharedSongs] year distribution:', dist, '| total overlap:', overlap.length)

  return selected.slice(0, target)
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const saved = loadDadData()
  const [musicSource,  setMusicSource]  = useState(saved.source)  // null | 'spotify-file' | 'apple'
  const [uploadedData, setUploadedData] = useState(saved.data)
  const [refreshKey,   setRefreshKey]   = useState(0)

  function handleUploadedData(data, source) {
    saveDadData(source, data)
    setUploadedData(data)
    setMusicSource(source)
  }

  function handleReset() {
    clearDadData()
    setUploadedData(null)
    setMusicSource(null)
  }

  // Sam's library is always the baked-in data
  const samLibrary = SAM_LIBRARY
  const samArtists = SAM_LIBRARY.topArtists.map((a) => a.name)

  const effectiveArtists = uploadedData?.topArtists ?? null
  const hasData          = Boolean(effectiveArtists?.length)

  // 20 songs that appear in both libraries, distributed by year.
  // refreshKey is bumped by the "Reshuffle picks" button to re-randomize without re-uploading.
  const sharedSongs = useMemo(
    () => computeSharedSongs(uploadedData?.allTracks, SAM_LIBRARY.allTracks),
    [uploadedData, refreshKey],  // eslint-disable-line
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--navy)' }}>
      <Hero isConnected={hasData} />

      {/* Source selector */}
      {!hasData && musicSource === null && (
        <MusicSourceSelector onSelect={setMusicSource} />
      )}

      {/* Spotify file upload path */}
      {musicSource === 'spotify-file' && !hasData && (
        <SpotifyFileUpload onData={(data) => handleUploadedData(data, 'spotify-file')} />
      )}

      {/* Music sections */}
      {hasData && (
        <>
          <div
            className="text-center py-12 px-6"
            style={{ background: 'linear-gradient(to bottom, var(--vinyl), transparent)' }}
          >
            <p className="font-body text-sm tracking-widest uppercase mb-2" style={{ color: 'var(--gold)', opacity: 0.7 }}>
              Welcome
            </p>
            <p className="font-display text-3xl font-bold" style={{ color: 'var(--cream)' }}>
              Dad!
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="font-body text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-opacity hover:opacity-100"
                style={{ color: 'var(--gold)', border: '1px solid rgba(232,184,109,0.35)', background: 'rgba(232,184,109,0.08)', opacity: 0.85 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                Reshuffle picks
              </button>
              <button
                onClick={handleReset}
                className="font-body text-xs px-4 py-1.5 rounded-full"
                style={{ color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', opacity: 0.6 }}
              >
                Clear &amp; start over
              </button>
            </div>
          </div>

          <TopArtists artists={effectiveArtists} recentArtists={null} />
          <TopTracks  overlapTracks={sharedSongs} />
          <MusicDNA   artists={effectiveArtists} allTracks={uploadedData?.allTracks} />

          <SamsLibraryBadge library={samLibrary} />

          <Recommendations
            overlapTracks={sharedSongs}
            samLibrary={samLibrary}
          />
          <PersonalNote profile={null} />
        </>
      )}
    </div>
  )
}
