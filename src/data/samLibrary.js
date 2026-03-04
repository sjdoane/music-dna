/**
 * Sam's Spotify liked songs — baked directly into the bundle at build time.
 * The raw CSV is imported as a string via Vite's ?raw loader, parsed once,
 * and exported as a module-level constant.  No runtime file upload needed.
 */
import raw from '../../Liked_Songs.csv?raw'
import { parseSpotifyExport } from '../utils/parseSpotifyExport.js'

export const SAM_LIBRARY = parseSpotifyExport(raw, 'Liked_Songs.csv')
