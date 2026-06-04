# YTDL

> Self-hosted YouTube downloader. Paste a URL, pick a format, download. No ads, no tracking, no BS.

Built with **Node.js**, **Express**, and **[yt-dlp](https://github.com/yt-dlp/yt-dlp)**.

---

## ✨ Features

- 🎬 **Video downloads** — MP4 in every resolution YouTube offers
- 🎵 **Audio extraction** — MP3 (128 / 192 / 320 kbps) and M4A
- 🔀 **Merge formats** — Best video + best audio, merged on the fly via ffmpeg
- 📡 **Streaming** — Files stream directly to the client, nothing stored on the server
- 🔒 **Secure** — Helmet, CORS, rate limiting, URL whitelist (YouTube only)
- ⚡ **Vercel-ready** — Deploys as a serverless function out of the box
- 🧹 **Clean code** — Biome linting + formatting, GitHub Actions CI

---

## 📋 Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| **Node.js** ≥ 18 | Runtime | [nodejs.org](https://nodejs.org) |
| **pnpm** | Package manager | `npm i -g pnpm` |
| **yt-dlp** | YouTube extraction engine | See below |
| **ffmpeg** | Audio/video merging | See below |

### Install yt-dlp

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod +x /usr/local/bin/yt-dlp
```

**Windows:**
Download `yt-dlp.exe` from the [releases page](https://github.com/yt-dlp/yt-dlp/releases) and add it to your `PATH`.

### Install ffmpeg

**macOS:** `brew install ffmpeg`
**Linux:** `sudo apt install ffmpeg`
**Windows:** [ffmpeg.org/download.html](https://ffmpeg.org/download.html)

---

## ⚡ Quick Start

```bash
# Clone the repo
git clone https://github.com/<your-username>/ytdl.git
cd ytdl

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open **http://localhost:3000** — done.

---

## 📁 Project Structure

```
ytdl/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions — lint on push/PR
├── api/
│   └── index.js                # Vercel serverless entry (thin wrapper)
├── public/
│   └── index.html              # Frontend UI
├── src/
│   ├── app.js                  # Express app (middleware + routes)
│   ├── server.js               # Entry point (listen + graceful shutdown)
│   ├── config/
│   │   └── index.js            # Centralized configuration
│   ├── middleware/
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validateUrl.js      # YouTube URL validation
│   ├── routes/
│   │   ├── download.js         # GET /api/download — stream files
│   │   └── info.js             # GET /api/info — video metadata
│   └── utils/
│       └── ytdlp.js            # yt-dlp binary resolution
├── .gitignore
├── biome.json                  # Biome linter + formatter config
├── package.json
├── vercel.json                 # Vercel deployment config
└── README.md
```

---

## 🔌 API Reference

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{ "status": "ok", "timestamp": 1717500000000 }
```

### `GET /api/info?url=<youtube-url>`

Fetch video metadata and available formats.

| Param | Type | Description |
|-------|------|-------------|
| `url` | `string` | YouTube video URL (required) |

**Response:**
```json
{
  "title": "Video Title",
  "thumbnail": "https://i.ytimg.com/...",
  "duration": 240,
  "channel": "Channel Name",
  "formats": [
    { "id": "22", "label": "720p MP4", "type": "video", "ext": "mp4", "height": 720, "filesize": 52428800 },
    { "id": "audio-320-mp3", "label": "MP3 320kbps", "type": "audio", "ext": "mp3", "quality": "320" }
  ]
}
```

### `GET /api/download?url=...&format=...&ext=...&type=...&title=...`

Stream a download to the client.

| Param | Type | Description |
|-------|------|-------------|
| `url` | `string` | YouTube video URL (required) |
| `format` | `string` | Format ID from `/api/info` |
| `ext` | `string` | File extension (`mp4`, `webm`, `mp3`, `m4a`) |
| `type` | `string` | `video` or `audio` |
| `title` | `string` | Suggested filename |
| `quality` | `string` | Audio bitrate (for MP3: `128`, `192`, `320`) |

---

## ⚙️ Environment Variables

All optional — sensible defaults are built in.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | — | Set to `production` for combined logging + sanitized errors |
| `YTDLP_TIMEOUT` | `30000` | yt-dlp exec timeout in ms |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `50` | Max requests per window |

---

## 🚀 Deploy to Vercel

> **Note:** Vercel serverless functions have timeouts (10 s free / 60 s Pro).
> The `/api/info` endpoint is fast. The `/api/download` endpoint streams video and may hit timeouts for long videos on the free plan.
> For heavy usage, use a VPS (Railway, Render, Fly.io).

```bash
# Install Vercel CLI
pnpm add -g vercel

# Bundle yt-dlp binary for Vercel (Linux x86_64)
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o yt-dlp
chmod +x yt-dlp

# Deploy
vercel --prod
```

The bundled `yt-dlp` binary at the project root is auto-detected by the server.

---

## 🚀 Deploy to Railway / Render

These platforms run persistent Node servers — no timeout issues.

**Railway:**
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a `Procfile`: `web: pnpm start`
4. In the Railway shell: `curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o yt-dlp && chmod +x yt-dlp`
5. Railway auto-installs ffmpeg — done

**Render:**
1. Push to GitHub
2. New Web Service → connect repo
3. Build command: `pnpm install && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o yt-dlp && chmod +x yt-dlp`
4. Start command: `pnpm start`

---

## 🧹 Code Quality

This project uses **[Biome](https://biomejs.dev)** for linting and formatting.

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Format only
pnpm format
```

CI runs automatically on every push and PR via GitHub Actions.

---

## 🔄 Keeping yt-dlp Updated

YouTube frequently changes its internals. If downloads break, update yt-dlp:

```bash
yt-dlp -U   # updates the binary in place
```

---

## 🔒 Security

- **URL whitelist** — only YouTube domains accepted (server-side validation)
- **No storage** — files stream directly to the client, nothing touches disk
- **No tracking** — no user data collected or logged
- **Helmet** — sets security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **Rate limiting** — prevents abuse (configurable via env vars)

---

## 📄 Supported Formats

| Format | Description |
|--------|-------------|
| MP4 (various resolutions) | Video with audio, best compatibility |
| MP4/WebM + best audio | Highest quality, merged with ffmpeg |
| MP3 128 / 192 / 320 kbps | Audio only |
| M4A best quality | Highest quality audio |

---

## 📝 License

MIT © [Marmik Soni](mailto:marmiksoni777@gmail.com)
