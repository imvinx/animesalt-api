<div align="center">

# ⚡ AnimeSalt API & Interactive Web Player v2.0

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![GitHub stars](https://img.shields.io/github/stars/imvinx/animesalt-api?logo=github&color=gold)](https://github.com/imvinx/animesalt-api/stargazers)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue)](./LICENSE)

**A high-performance, real-time scraping API and interactive streaming web platform powered by [animesalt.cx](https://animesalt.cx).**

---

### 🚀 One-Click Cloud Deployment

Deploy your own instance of AnimeSalt API & Web Player to the cloud instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)
&nbsp;&nbsp;
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new?template=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)
&nbsp;&nbsp;
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)

</div>

---

## 📖 Table of Contents

- [Overview & What We Built](#-overview--what-we-built)
- [Architecture & How It Works](#-architecture--how-it-works)
- [Features](#-features)
- [One-Click Cloud Deployment](#-one-click-cloud-deployment)
  - [Deploy to Vercel](#deploy-to-vercel)
  - [Deploy to Railway](#deploy-to-railway)
  - [Deploy to Render](#deploy-to-render)
- [Local Installation & Setup](#-local-installation--setup)
  - [Prerequisites](#prerequisites)
  - [Quick Start Guide](#quick-start-guide)
  - [Build for Production](#build-for-production)
- [API Endpoints Reference](#-api-endpoints-reference)
  - [1. Health & Status (`/api/health`)](#1-health--status-apihealth)
  - [2. Search Anime (`/api/search`)](#2-search-anime-apisearch)
  - [3. Popular Charts (`/api/popular`)](#3-popular-charts-apipopular)
  - [4. Latest Episodes (`/api/latest-episodes`)](#4-latest-episodes-apilatest-episodes)
  - [5. Ongoing Anime (`/api/ongoing`)](#5-ongoing-anime-apiongoing)
  - [6. Completed Anime (`/api/completed`)](#6-completed-anime-apicompleted)
  - [7. Filter by Type (`/api/type/:type`)](#7-filter-by-type-apitypetype)
  - [8. Filter by Genre (`/api/genre/:category`)](#8-filter-by-genre-apigenrecategory)
  - [9. Anime Metadata (`/api/info`)](#9-anime-metadata-apiinfo)
  - [10. Multi-Season Episodes (`/api/episodes/:animeId`)](#10-multi-season-episodes-apiepisodesanimeid)
  - [11. Detect Video Servers (`/api/servers`)](#11-detect-video-servers-apiservers)
  - [12. Video Stream Resolver (`/api/stream`)](#12-video-stream-resolver-apistream)
- [Live Scraper Studio & Console](#-live-scraper-studio--console)
- [Changelog & Migration from Anikoto](#-changelog--migration-from-anikoto)
- [Legal Disclaimer](#-legal-disclaimer)

---

## 🌟 Overview & What We Built

This project is a complete, full-stack rewrite of the anime API platform, transitioning from legacy providers to **AnimeSalt (`https://animesalt.cx`)**. 

It provides:
1. **RESTful Scraper API Backend** (`/api/*`): Clean, JSON-based endpoints with Cheerio HTML parsing, Axios client handling, multi-season parallel AJAX episode extraction, and automatic audio language decoding.
2. **Interactive Streaming Web Application**: Modern React 19 + Tailwind CSS frontend with a dark neon interface, anime catalog, visual posters, quality tags, and responsive embedded video playback.
3. **Live Scraper API Studio & Diagnostic Console**: A full-featured developer environment integrated into the web app that offers live request inspection, parameter tweaking, execution latency timers, visual card previews, and a 1-click **Full System Health Check suite**.

---

## 🏗 Architecture & How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      Client / Browser                       │
│    (Browse Catalog, Watch Stream, Live Scraper Studio)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Backend                       │
│                   (server.ts / api/index.ts)                │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Direct DOM  │       │ WordPress    │       │ Multi-Lang   │
│   Scraper    │       │ AJAX Engine  │       │ Base64 Audio │
│  (Cheerio)   │       │ (admin-ajax) │       │ Decoder      │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Upstream: animesalt.cx                    │
│   (Series Pages, Charts, Video Players, CDN Iframe Hosts)   │
└─────────────────────────────────────────────────────────────┘
```

1. **Catalog & Search Scraper**: Parses WordPress/ToroFilm article blocks (`article.post`), chart widgets (`.chart-item`), and category archive grids to extract IDs, clean titles, high-resolution poster images, release years, and quality badges.
2. **Parallel Season Collector**: Because AnimeSalt loads subsequent seasons dynamically, the backend targets `/wp-admin/admin-ajax.php?action=action_select_season` in parallel via `Promise.all`. For large anime (like *Naruto* with 220 episodes across 5 seasons), all episodes and titles are scraped and assembled in ~500ms.
3. **Iframe & Multi-Audio Extractor**: Locates video players (`.video.aa-tb`), matches them with named server controls (`SERVER 1 - MyStream`, `SERVER 2 - Abyss`), and decodes base64 JSON payload arrays into discrete audio options (`English`, `Japanese`, `Hindi`, `Tamil`, `Telugu`).

---

## 🚀 Features

- ⚡ **Lightning Fast**: Sub-second scraping response times with optimized Cheerio DOM traversal.
- 🎯 **12 Robust API Endpoints**: Covers searching, charts, metadata, multi-season episodes, servers, and streams.
- 🌐 **Full Pagination Support**: Supports `?page=N` across search, ongoing, completed, types, and genres.
- 📺 **Multi-Season Scraping**: Correctly retrieves full episode guides for anime with multiple seasons (e.g. Naruto, Bleach, Attack on Titan).
- 🎙 **Multi-Language Audio**: Identifies multi-language audio streams and enables language-specific video links.
- 🛠 **Integrated API Studio**: Built-in visual dashboard for testing parameters, copying JSON, downloading responses, and viewing cURL/fetch/Python code snippets.
- 🩺 **Full System Health Suite**: One-click test suite that verifies all 12 endpoints against the upstream website in real time.

---

## ☁️ One-Click Cloud Deployment

### Deploy to Vercel
Vercel is fully supported out of the box with the included [`vercel.json`](./vercel.json).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)

1. Click the button above or import your repository into Vercel.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**. Vercel will automatically route `/api/*` to the serverless function and `/*` to the SPA.

### Deploy to Railway
Railway automatically detects Node.js and builds using the repository configuration.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new?template=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)

1. Click the button above to start a new project.
2. Connect your GitHub repository.
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Set `PORT=3000` (or leave default assigned by Railway).

### Deploy to Render
Render provides easy deployment for Web Services.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)

1. Click the button above to deploy.
2. Environment: **Node**
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Click **Create Web Service**.

---

## 💻 Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) version **18.0.0** or higher
- [npm](https://www.npmjs.com/) (bundled with Node)

### Quick Start Guide

1. **Clone the repository:**
   ```bash
   git clone https://github.com/imvinx/animesalt-api.git
   cd animesalt-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Open [http://localhost:3000](http://localhost:3000) to view the web application and interactive API studio.

### Build for Production

To create an optimized production bundle:
```bash
npm run build
```
This builds the Vite frontend into `dist/` and compiles `server.ts` into a self-contained CommonJS server at `dist/server.cjs`.

To run the production server:
```bash
npm start
```

---

## 📡 API Endpoints Reference

All endpoints return standardized JSON payloads:
```json
{
  "success": true,
  "data": ...
}
```

---

### 1. Health & Status (`/api/health`)
Checks backend health and live upstream connectivity to `https://animesalt.cx`.

- **Method**: `GET`
- **URL**: `/api/health`
- **Example Response**:
  ```json
  {
    "success": true,
    "status": "healthy",
    "timestamp": "2026-09-06T04:51:06.108Z",
    "uptime": 45,
    "upstream": {
      "source": "https://animesalt.cx",
      "online": true,
      "latencyMs": 639
    },
    "version": "2.0.0",
    "endpointsCount": 12
  }
  ```

---

### 2. Search Anime (`/api/search`)
Search anime titles by keyword with pagination.

- **Method**: `GET`
- **URL**: `/api/search?keyword={keyword}&page={page}`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `keyword` | string | **Yes** | — | Search term (e.g. `naruto`, `bleach`) |
  | `page` | number | No | `1` | Results page number |
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/search?keyword=naruto&page=1"
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "page": 1,
    "data": [
      {
        "id": "naruto",
        "title": "Naruto",
        "image": "https://img.animesalt.cx/images/1221/001.webp",
        "type": "series",
        "quality": "HD",
        "year": "2002",
        "url": "https://animesalt.cx/series/naruto/"
      }
    ]
  }
  ```

---

### 3. Popular Charts (`/api/popular`)
Extracts the top 50 ranked titles from the Most-Watched Series and Most-Watched Films charts.

- **Method**: `GET`
- **URL**: `/api/popular?type={type}`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `type` | string | No | `all` | Filter by `series` or `movies` |
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/popular?type=series"
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "rank": 1,
        "id": "naruto-shippuden",
        "title": "Naruto Shippuden",
        "image": "https://image.tmdb.org/t/p/w500/kV27j3Nz4d5z8u6mN3EJw9RiLg2.jpg",
        "type": "series",
        "genre": null,
        "url": "https://animesalt.cx/series/naruto-shippuden/"
      }
    ]
  }
  ```

---

### 4. Latest Episodes (`/api/latest-episodes`)
Scrapes fresh episode drops and new arrivals.

- **Method**: `GET`
- **URL**: `/api/latest-episodes`
- **Example Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "jojos-bizarre-adventure",
        "title": "JoJo's Bizarre Adventure",
        "image": "https://img.animesalt.cx/images/...",
        "type": "series",
        "url": "https://animesalt.cx/series/jojos-bizarre-adventure/"
      }
    ]
  }
  ```

---

### 5. Ongoing Anime (`/api/ongoing`)
Returns currently airing anime series with pagination.

- **Method**: `GET`
- **URL**: `/api/ongoing?page={page}`
- **Query Parameters**: `page` (optional, default: `1`)

---

### 6. Completed Anime (`/api/completed`)
Returns completed anime titles with pagination.

- **Method**: `GET`
- **URL**: `/api/completed?page={page}`
- **Query Parameters**: `page` (optional, default: `1`)

---

### 7. Filter by Type (`/api/type/:type`)
Filter by catalog category (`anime` or `cartoon`) and subtype (`series` or `movies`).

- **Method**: `GET`
- **URL**: `/api/type/:type?subtype={series|movies}&page={page}`
- **Route Parameters**:
  - `type`: `anime` or `cartoon`
- **Query Parameters**:
  - `subtype`: `series` or `movies` (default: `series`)
  - `page`: Page number (default: `1`)
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/type/anime?subtype=movies&page=1"
  ```

---

### 8. Filter by Genre (`/api/genre/:category`)
Filter titles by genre with pagination.

- **Method**: `GET`
- **URL**: `/api/genre/:category?page={page}`
- **Route Parameters**:
  - `category`: Genre slug (e.g. `action`, `comedy`, `fantasy`, `shounen`, `romance`)
- **Query Parameters**: `page` (default: `1`)
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/genre/action?page=1"
  ```

---

### 9. Anime Metadata (`/api/info`)
Retrieves detailed metadata, synopsis, poster, genres, season list, and episode totals.

- **Method**: `GET`
- **URL**: `/api/info?id={animeSlug}`
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `id` | string | **Yes** | Anime slug (e.g. `naruto`, `solo-leveling`) |
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/info?id=naruto"
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "naruto",
      "title": "Naruto",
      "poster": "https://img.animesalt.cx/images/1221/001.webp",
      "description": "In another world, ninja are the ultimate power...",
      "type": "series",
      "totalEpisodes": 220,
      "seasons": [
        { "num": 1, "title": "Season 1 • 1-57 (57)", "episodeCount": 57 },
        { "num": 2, "title": "Season 2 • 58-100 (43)", "episodeCount": 43 },
        { "num": 3, "title": "Season 3 • 101-141 (41)", "episodeCount": 41 },
        { "num": 4, "title": "Season 4 • 142-183 (42)", "episodeCount": 42 },
        { "num": 5, "title": "Season 5 • 184-220 (37)", "episodeCount": 37 }
      ],
      "genres": ["Action", "Adventure", "Animation", "Comedy", "Drama", "Fantasy"],
      "languages": ["Japanese", "English", "Hindi"]
    }
  }
  ```

---

### 10. Multi-Season Episodes (`/api/episodes/:animeId`)
Scrapes episodes across all seasons in parallel via WordPress AJAX.

- **Method**: `GET`
- **URL**: `/api/episodes/:animeId?season={seasonNum}`
- **Route Parameters**:
  - `animeId`: Anime slug (e.g. `naruto`)
- **Query Parameters**:
  - `season`: Season number (e.g. `1`, `2`) or omit to fetch all seasons in parallel.
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/episodes/naruto?season=1"
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "data": {
      "animeId": "naruto",
      "currentSeason": 1,
      "totalEpisodes": 57,
      "episodes": [
        {
          "num": 1,
          "season": 1,
          "title": "Enter: Naruto Uzumaki!",
          "slug": "naruto-1x1",
          "url": "https://animesalt.cx/episode/naruto-1x1/"
        }
      ]
    }
  }
  ```

---

### 11. Detect Video Servers (`/api/servers`)
Detects video servers and decodes multi-language audio tracks.

- **Method**: `GET`
- **URL**: `/api/servers?id={animeId}&ep={epSlug}`
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `ep` | string | **Yes** | Episode slug (e.g. `naruto-1x1`) |
  | `id` | string | No | Anime slug |
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/servers?id=naruto&ep=naruto-1x1"
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "index": 0,
        "serverName": "SERVER 1 - MyStream",
        "embedUrl": "https://as-cdn26.top/video/36660e59856b4de58a219bcf4e27eba3",
        "isMultiLang": false,
        "languages": []
      },
      {
        "index": 1,
        "serverName": "SERVER 2 - Abyss",
        "embedUrl": "https://animesalt.cx/multi-lang-plyr/player.php?data=...",
        "isMultiLang": true,
        "languages": [
          { "language": "Hindi", "link": "https://short.icu/6q7BvdjlN" },
          { "language": "English", "link": "https://short.icu/PCuDIGRqu" },
          { "language": "Japanese", "link": "https://short.icu/EJLtjXjIY" }
        ]
      }
    ]
  }
  ```

---

### 12. Video Stream Resolver (`/api/stream`)
Resolves direct embed URLs and handles language-specific audio streams.

- **Method**: `GET`
- **URL**: `/api/stream?ep={epSlug}&server={serverIndex}&lang={language}`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `ep` | string | **Yes** | — | Episode slug (e.g. `naruto-1x1`) |
  | `server` | number | No | `0` | Server index (0, 1, etc.) |
  | `lang` | string | No | — | Preferred audio language (e.g. `English`, `Hindi`) |
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/stream?ep=naruto-1x1&server=0"
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "data": {
      "embedUrl": "https://as-cdn26.top/video/36660e59856b4de58a219bcf4e27eba3",
      "serverIndex": 0,
      "selectedLanguage": null,
      "isIframe": true,
      "referer": "https://animesalt.cx/episode/naruto-1x1/"
    }
  }
  ```

---

## 🎛 Live Scraper Studio & Console

The web application includes a dedicated **Live Scraper Studio & Diagnostic Center** designed for API consumers, developers, and administrators.

Switch to **"Live Scraper Studio"** in the top navigation to access:
- **1-Click Health Check Test Suite**: Runs automated verification across all 12 endpoints with response timing and pass/fail reports.
- **Dynamic Endpoint Form**: Interactive input controls with sample anime chips, genre selector pills, and pagination controls.
- **Live Response Inspector**:
  - **Visual Preview Mode**: Displays scraped anime cards, synopsis metadata, episode grids, server lists, and live embedded video playback.
  - **Formatted JSON**: Syntax-highlighted output with in-JSON search, copy, and file download.
  - **Code Generator**: Ready-to-use snippets in cURL, JavaScript Fetch, and Python Requests.
  - **Execution History**: Session log with status indicators, execution latencies, and 1-click query replay.

---

## 🔄 Changelog & Migration from Anikoto

| Feature | Legacy Version (anikototv.to) | Modern Version (animesalt.cx) |
|---|---|---|
| **Upstream Provider** | `anikototv.to` (defunct) | `https://animesalt.cx` (WordPress/ToroFilm CMS) |
| **Popular Charts** | Fragmented HTML queries | Structured extraction from `.chart-item` widgets (50 items) |
| **Episode Scraping** | Single season initial view | Parallel multi-season WordPress AJAX scraper (`admin-ajax.php`) |
| **Audio Tracks** | Single audio stream | Base64 decoded multi-language audio options |
| **Pagination** | Unsupported | Full `?page=N` support across all category and search routes |
| **Frontend UI** | Static raw JSON viewer | Full dark-mode streaming player + Live Scraper Studio |
| **Health Checks** | None | Real-time `/api/health` + automated diagnostic test suite |

---

## ⚖️ Legal Disclaimer

1. This API does not host or store any video media files on its servers. All content is scraped and linked directly to third-party streaming providers hosted on public websites.
2. This project is created strictly for **educational and research purposes**. The maintainers and contributors are not responsible for how this software is used or for any copyright infringements resulting from third-party media hosts.
