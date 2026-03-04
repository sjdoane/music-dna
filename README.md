# Dad's Birthday App 🎵

A personal music comparison app — connect your Spotify or upload a music export, and see how your taste stacks up against Sam's. Claude AI then recommends albums you'd both enjoy.

## How It Works

1. **Sam's library is baked in** — 2,700+ liked songs, already included. No setup needed on that side.
2. **Dad connects his music** — via Spotify OAuth or by uploading an export file (Spotify or Apple Music).
3. **The app compares** — shared artists, overlapping tracks, and a "Music DNA" breakdown of both libraries.
4. **Claude recommends albums** — using the Anthropic API, it suggests albums based on both libraries combined.

## Tech Stack

- React 18 + Vite
- Tailwind CSS (CDN)
- Spotify Web API (PKCE OAuth — no backend needed)
- Anthropic Claude API (client-side)

## Setup

### 1. Clone and install

```bash
git clone <this-repo>
cd dads-birthday
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Fill in your keys:

```
VITE_SPOTIFY_CLIENT_ID=...   # from developer.spotify.com
VITE_ANTHROPIC_API_KEY=...   # from console.anthropic.com
```

### 3. Add redirect URI to Spotify Dashboard

In [developer.spotify.com](https://developer.spotify.com) → your app → Edit Settings, add:

```
http://localhost:5173/callback
```

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> **Note:** Vite may use HTTPS — if your browser shows an SSL warning, click "Advanced → Proceed" once.

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Add `VITE_SPOTIFY_CLIENT_ID` and `VITE_ANTHROPIC_API_KEY` as environment variables in the Vercel dashboard, then add your Vercel URL to the Spotify Dashboard redirect URIs.

## A Note on API Keys

The Anthropic API key is used client-side, which means anyone with the deployed URL can trigger API calls. This is fine for personal/family use — just don't share the URL publicly if you want to keep costs under control.
