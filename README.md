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

**A high-performance, real-time scraping API and interactive streaming web platform powered by [animesalt.cx](https://animesalt.cx). Built with resilient Cloudflare edge routing, multi-season AJAX episode discovery, and multi-language audio stream decoding.**

---

### 🚀 One-Click Cloud Deployment

Deploy your own instance of AnimeSalt API & Web Player to the cloud in under 60 seconds:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)
&nbsp;&nbsp;
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/new?template=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)
&nbsp;&nbsp;
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)

</div>

---

## 📖 Table of Contents

- [🌟 Overview & What We Built](#-overview--what-we-built)
- [🏗️ Architecture & How It Works](#️-architecture--how-it-works)
- [🚀 Features](#-features)
- [☁️ One-Click Cloud Deployment](#️-one-click-cloud-deployment)
  - [Deploy to Vercel](#deploy-to-vercel)
  - [Deploy to Railway](#deploy-to-railway)
  - [Deploy to Render](#deploy-to-render)
- [🛡️ Cloudflare Bypass & Proxy Setup Guide (Essential for Vercel)](#️-cloudflare-bypass--proxy-setup-guide-essential-for-vercel)
  - [Why Cloudflare Challenges Cloud Hosts](#why-cloudflare-challenges-cloud-hosts)
  - [The 100% Free Solution: Cloudflare Worker Proxy](#the-100-free-solution-cloudflare-worker-proxy)
  - [Step-by-Step: Creating Your Own Cloudflare Worker (Takes 2 Minutes)](#step-by-step-creating-your-own-cloudflare-worker-takes-2-minutes)
  - [How to Configure PROXY_URL in Vercel or .env](#how-to-configure-proxy_url-in-vercel-or-env)
  - [Alternative: Commercial Rotating Proxies (ScraperAPI, Scrapfly)](#alternative-commercial-rotating-proxies-scraperapi-scrapfly)
- [⚠️ Technical Challenges, Mistakes & Gotchas (Post-Mortem & Troubleshooting)](#️-technical-challenges-mistakes--gotchas-post-mortem--troubleshooting)
  - [1. Cloudflare Bot Fight Mode (403 Forbidden: "Just a moment...")](#1-cloudflare-bot-fight-mode-403-forbidden-just-a-moment)
  - [2. Cloudflare Dashboard Confusion: "Workers" vs "Pages"](#2-cloudflare-dashboard-confusion-workers-vs-pages)
  - [3. Proxy URL Formatting & Path Mismatches](#3-proxy-url-formatting--path-mismatches)
  - [4. Drag-and-Drop GitHub Upload: "Fewer than 100 files" Error](#4-drag-and-drop-github-upload-fewer-than-100-files-error)
  - [5. Client Hardcoded to localhost:3000](#5-client-hardcoded-to-localhost3000)
  - [6. Vercel SPA Routing & Refresh 404s](#6-vercel-spa-routing--refresh-404s)
- [⚙️ Environment Variables Reference](#️-environment-variables-reference)
- [💻 Local Installation & Setup](#-local-installation--setup)
  - [Prerequisites](#prerequisites)
  - [Quick Start Guide](#quick-start-guide)
  - [Build for Production](#build-for-production)
- [📡 API Endpoints Reference](#-api-endpoints-reference)
  - [0. Backend Health Check (`/api/health`)](#0-backend-health-check-apihealth)
  - [1. Proxy & Upstream Diagnostics (`/api/debug`)](#1-proxy--upstream-diagnostics-apidebug)
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
- [🎛️ Live Scraper Studio & Diagnostic Center](#️-live-scraper-studio--diagnostic-center)
- [🔄 Migration Notes & Changelog (from Anikoto)](#-migration-notes--changelog-from-anikoto)
- [🤝 Contributing & Open Source Roadmap](#-contributing--open-source-roadmap)
- [⚖️ Legal Disclaimer](#️-legal-disclaimer)

---

## 🌟 Overview & What We Built

This project is a complete, production-grade rewrite of an anime streaming and scraping API engine. The project was migrated from a defunct upstream provider (`anikototv.to`) to **AnimeSalt (`https://animesalt.cx`)**.

### What Was Done:
1. **Engineered a 13-Endpoint Scraper API**: Reverse-engineered the WordPress/ToroFilm CMS schema used by AnimeSalt. Developed clean Cheerio DOM traversal routines to extract anime titles, high-res posters, release years, quality tags, and synopsis details.
2. **Parallel Season AJAX Scraping**: Solved the single-season limitation on series pages. Series like *Naruto* (220 episodes across 5 seasons) or *Attack on Titan* dynamically load episodes via WordPress AJAX (`/wp-admin/admin-ajax.php?action=action_select_season`). The API fires concurrent `Promise.all` requests across all seasons, scraping hundreds of episodes in ~500ms.
3. **Multi-Language Audio Decoder**: Uncovered and decoded base64 JSON payload arrays embedded in player script tags, allowing users to select discrete audio tracks (Japanese, English, Hindi, Tamil, Telugu).
4. **Cloudflare Edge Bypass Architecture**: Designed a resilient edge proxy mechanism that overcomes Cloudflare Super Bot Fight Mode (403 Forbidden) on cloud serverless platforms like Vercel and AWS Lambda.
5. **Interactive Streaming Web Application**: Built a sleek React 19 + Tailwind CSS single-page app (SPA) featuring an anime catalog, search with debounce, video player modal, and full multi-season episode browsing.
6. **Live Scraper Studio & Diagnostic Center**: Built a developer studio into the web app featuring an automated 1-click **Full System Health Check**, live endpoint playground, cURL/Fetch/Python code generators, and raw JSON inspectors.

---

## 🏗️ Architecture & How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client / Browser                              │
│   (Vite + React 19 SPA: Browse Catalog, Watch Stream, Scraper Studio)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Dynamic HTTP / JSON
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Express Backend / Serverless                       │
│                   (server.ts / api/index.ts on Vercel)                  │
│                                                                         │
│   ┌──────────────────────┐  ┌────────────────────┐  ┌───────────────┐   │
│   │   buildProxyUrl()    │  │ Native Fetch / TLS │  │ Axios Client  │   │
│   │ (Worker/Reverse/GW)  │  │ Undici Engine      │  │ Auto Decompr  │   │
│   └──────────┬───────────┘  └─────────┬──────────┘  └───────┬───────┘   │
└──────────────┼────────────────────────┼─────────────────────┼───────────┘
               │                        │                     │
               ▼ (Via Cloudflare Edge)   │ (Local Dev direct)  │
┌──────────────────────────────────────┐ │                     │
│       Cloudflare Worker Proxy        │ │                     │
│    (*.workers.dev Edge Network)      │ │                     │
│   Cloudflare NEVER challenges itself │ │                     │
└──────────────────┬───────────────────┘ │                     │
                   │                     │                     │
                   └─────────────────────┼─────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Upstream: animesalt.cx                          │
│        (WordPress ToroFilm CMS • Cloudflare Bot Protected)              │
│                                                                         │
│   ┌────────────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│   │  article.post DOM  │  │  admin-ajax.php  │  │  Multi-Lang Base64│   │
│   │ (Catalog & Search) │  │ (Season Episodes)│  │ (Audio Stream Map)│   │
│   └────────────────────┘  └──────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request Flow Explained:
1. **Client Request**: Browser calls `/api/popular`, `/api/search`, or `/api/episodes/naruto`.
2. **Proxy Resolution (`buildProxyUrl`)**:
   - In production (Vercel), requests are directed through `PROXY_URL` (defaults to the built-in Cloudflare Worker proxy `https://animesalt-proxy.v1nx.workers.dev`).
   - In local development, requests connect directly without requiring any proxy.
3. **Cheerio HTML Parsing**: The HTML response from AnimeSalt is parsed into structured, strongly-typed JSON.
4. **Parallel AJAX Harvesting**: For multi-season series, `admin-ajax.php` requests are fired concurrently for seasons 2..N to assemble the entire episode catalog.
5. **Client Rendering**: Clean JSON is sent to the client, which renders cards, episode selectors, and video streams.

---

## 🚀 Features

- ⚡ **Sub-Second Scraper**: Highly optimized Cheerio traversal returning structured JSON in ~200-500ms.
- 🎯 **13 Production Endpoints**: Covers catalog search, popular rankings, latest drops, ongoing, completed, types, genres, seasons, servers, streaming links, health, and diagnostics.
- 🛡️ **Zero-Config Cloud Deployment**: Built-in default Cloudflare Worker fallback means Vercel deployments work immediately without mandatory configuration.
- 📺 **Complete Multi-Season Episode Support**: Automatic parallel fetching of all seasons via WordPress AJAX.
- 🎙️ **Multi-Language Audio Track Detection**: Decodes base64 player payloads for Japanese, English, Hindi, Tamil, and Telugu dubs.
- 🌐 **Full Pagination**: Seamless `?page=N` support on search, ongoing, completed, types, and genres.
- 🩺 **Automated Health Suite**: 1-click test suite in the web studio verifies all endpoints against upstream in real-time.
- 💻 **Cross-Platform Ready**: Run as a standalone Express server (Node.js/Docker/Railway/Render) or as a serverless microservice on Vercel.

---

## ☁️ One-Click Cloud Deployment

### Deploy to Vercel
Vercel is fully supported out of the box with the included [`vercel.json`](./vercel.json).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fimvinx%2Fanimesalt-api)

1. Click the button above or import your repository into Vercel.
2. **Framework Preset**: `Vite`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables** (Optional, recommended for high traffic):
   - `PROXY_URL`: Your own Cloudflare Worker URL (see [Proxy Setup](#-cloudflare-bypass--proxy-setup-guide-essential-for-vercel)).
6. Click **Deploy**. Vercel will route `/api/*` to the serverless function and `/*` to the React SPA.

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
2. **Environment**: `Node`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. Click **Create Web Service**.

---

## 🛡️ Cloudflare Bypass & Proxy Setup Guide (Essential for Vercel)

### Why Cloudflare Challenges Cloud Hosts
When you run this project **locally on your computer**, requests to `https://animesalt.cx` connect directly with 100% success because residential home internet connections are trusted.

However, when deployed on **Vercel, AWS Lambda, Railway, or Render**, Cloudflare's Super Bot Fight Mode detects data-center IP addresses and serves an interactive JavaScript challenge:
```html
HTTP 403 Forbidden: <title>Just a moment...</title>
```
Serverless Node.js functions on AWS cannot execute interactive browser challenges (Turnstile), which causes scrapers to fail with `HTTP 403`.

---

### The 100% Free Solution: Cloudflare Worker Proxy
Cloudflare **never** challenges or blocks requests that originate from **Cloudflare Workers**, because Workers execute directly inside Cloudflare's own global edge network.

Cloudflare provides a **Free Tier with 100,000 requests per day**, which is more than enough for personal or production use.

> [!NOTE]
> This repository includes a default fallback worker (`https://animesalt-proxy.v1nx.workers.dev`) so the project works out-of-the-box. However, if you are hosting this project for production or public use, you should create your own free Cloudflare Worker to avoid sharing the 100k daily rate limit!

---

### Step-by-Step: Creating Your Own Cloudflare Worker (Takes 2 Minutes)

#### Step 1: Create a Free Cloudflare Account
1. Visit [dash.cloudflare.com](https://dash.cloudflare.com/) and sign up for a free account (no credit card required).

#### Step 2: Navigate to Workers (NOT Pages!)
> [!IMPORTANT]
> In Cloudflare Dashboard, look at the left sidebar menu:
> 1. Click **Compute (Workers)** or **Workers & Pages**.
> 2. Click the **Workers** tab (do **NOT** select *Pages*).
> 3. Click **Create Application** (or **Create Worker**).
> 4. Give your worker a name, e.g. `my-animesalt-proxy`.
> 5. Click **Deploy**.

#### Step 3: Paste the Universal Worker Script
1. On your newly created worker page, click **Edit code** (in the top right corner).
2. Delete everything in the `worker.js` editor and paste the following tested code:

```javascript
/**
 * Universal AnimeSalt Edge Reverse Proxy
 * Runs on Cloudflare Workers (100,000 req/day free)
 * Bypasses Cloudflare Bot Fight Mode completely.
 */
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 1. Support query parameter: ?url=https://animesalt.cx/...
    let target = url.searchParams.get("url");

    // 2. Support path-based target: /https://animesalt.cx/...
    if (!target && url.pathname.startsWith("/http")) {
      target = url.pathname.slice(1) + url.search;
    }

    // 3. Support direct reverse proxy path: /series/naruto/ or /wp-admin/...
    if (!target) {
      target = "https://animesalt.cx" + url.pathname + url.search;
    }

    try {
      const response = await fetch(target, {
        method: request.method,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": "https://animesalt.cx/",
        },
      });

      // Inject CORS headers so browsers and serverless functions can read the response
      const newHeaders = new Headers(response.headers);
      newHeaders.set("Access-Control-Allow-Origin", "*");
      newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      newHeaders.set("Access-Control-Allow-Headers", "*");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (err) {
      return new Response("Proxy Error: " + err.message, { status: 500 });
    }
  }
};
```

3. Click **Deploy** (or **Save and Deploy**).
4. Copy your Worker URL. It will look like:
   ```
   https://my-animesalt-proxy.YOUR_SUBDOMAIN.workers.dev
   ```

---

### How to Configure PROXY_URL in Vercel or .env

#### In Vercel:
1. Open your project on the [Vercel Dashboard](https://vercel.com/dashboard).
2. Navigate to **Settings** -> **Environment Variables**.
3. Add a new variable:
   - **Key**: `PROXY_URL`
   - **Value**: `https://my-animesalt-proxy.YOUR_SUBDOMAIN.workers.dev` (your Worker URL)
4. Click **Save**.
5. Go to the **Deployments** tab -> Click the `...` (three dots) next to your latest deployment -> **Redeploy**.

#### In Local `.env` (Optional):
```env
PROXY_URL=https://my-animesalt-proxy.YOUR_SUBDOMAIN.workers.dev
```

---

### Alternative: Commercial Rotating Proxies (ScraperAPI, Scrapfly)
If you prefer not to use Cloudflare Workers, you can use any commercial scraping proxy gateway by setting the `SCRAPER_PROXY` environment variable:

| Provider | Format for `SCRAPER_PROXY` | Free Tier |
|---|---|---|
| **ScraperAPI** | `https://api.scraperapi.com?api_key=YOUR_KEY&url=` | 5,000 req/mo free |
| **Scrapfly** | `https://api.scrapfly.io/scrape?key=YOUR_KEY&url=` | 1,000 req/mo free |
| **Webshare** | Configure via HTTP proxy URL | 10 free proxies |

The backend's `buildProxyUrl()` function automatically detects `url=` query formats and forwards requests accordingly.

---

## ⚠️ Technical Challenges, Mistakes & Gotchas (Post-Mortem & Troubleshooting)

During the migration and deployment of this project, several non-obvious technical hurdles were encountered. This guide documents what went wrong, why it happened, and how it was resolved so open-source contributors can avoid the same traps.

### 1. Cloudflare Bot Fight Mode (403 Forbidden: "Just a moment...")
- **The Symptom**: The API worked perfectly on local machines, but on Vercel returned `500 Internal Server Error` with:
  ```
  Upstream AnimeSalt HTTP 403: <title>Just a moment...</title>
  ```
- **The Root Cause**: Cloudflare uses IP intelligence to categorize visitors. Residential ISP addresses (home broadband/fiber) are treated as real users, whereas cloud hosting ranges (AWS Lambda, Google Cloud, DigitalOcean) are flagged as potential botnets. Headless Node.js HTTP clients cannot pass Cloudflare's interactive Turnstile challenges.
- **The Solution**: Routing requests through a Cloudflare Worker edge proxy (`*.workers.dev`). Cloudflare never triggers Bot Fight Mode against its own internal serverless edge network.

---

### 2. Cloudflare Dashboard Confusion: "Workers" vs "Pages"
- **The Mistake**: Clicking on Cloudflare **Pages** instead of **Workers** when following deployment steps.
- **The Confusion**: Cloudflare groups both under the heading "Workers & Pages" in its dashboard sidebar. However:
  - **Pages** is designed for hosting static frontend assets (HTML, CSS, JS bundles).
  - **Workers** is a V8 JavaScript serverless execution environment with request interception and fetch capabilities.
- **The Fix**: Always create a **Worker** when deploying the reverse proxy script.

---

### 3. Proxy URL Formatting & Path Mismatches
- **The Bug**: Different proxy gateways expect different URL structures. Appending target URLs blindly caused `404 Not Found` or `Malformed URL` exceptions.
  - Some workers expect: `https://worker.dev/series/naruto` (reverse proxy style).
  - Others expect: `https://worker.dev/?url=https://animesalt.cx/series/naruto` (query parameter style).
  - Commercial gateways expect: `https://api.scraperapi.com?api_key=KEY&url=https%3A%2F%2F...` (encoded query).
- **The Fix**: Implemented a resilient `buildProxyUrl()` helper in [`api/index.ts`](./api/index.ts) that automatically detects query formats (`url=`, `%s`) or falls back to reverse-proxy path appending.

---

### 4. Drag-and-Drop GitHub Upload: "Fewer than 100 files" Error
- **The Mistake**: Attempting to upload the project by dragging the local folder directly into GitHub's web interface, resulting in:
  ```
  "Yikes, that's a lot of files! Please upload fewer than 100 files."
  ```
- **The Cause**: The project folder contained `node_modules` (over 15,000 files) and `dist/`. GitHub's browser upload tool has a strict hard limit of 100 files.
- **The Fix**: Never drag and drop folders into GitHub. Always use Git CLI commands in your terminal:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/animesalt-api.git
  git push -u origin main
  ```
  The repository's [`.gitignore`](./.gitignore) file automatically excludes `node_modules/`, `.env`, and build artifacts, allowing Git to commit and push cleanly in seconds.

---

### 5. Client Hardcoded to localhost:3000
- **The Bug**: On the deployed Vercel site (`testttggdgdegeg.vercel.app`), the homepage opened but catalog cards and search results remained completely blank. The browser DevTools console showed:
  ```
  GET http://localhost:3000/api/popular net::ERR_CONNECTION_REFUSED
  ```
- **The Cause**: The frontend code in `src/App.tsx` had hardcoded `http://localhost:3000` as the API base URL. When users visited the site on the internet, their browser attempted to fetch API data from their own computer!
- **The Fix**: Refactored the API client to use dynamic origins (`window.location.origin` or relative `/api/...`), allowing the application to work identically on localhost, Vercel, Railway, Render, or any custom domain.

---

### 6. Vercel SPA Routing & Refresh 404s
- **The Bug**: Visiting the root `/` worked, but refreshing the page on subpaths returned Vercel's `404: NOT_FOUND`.
- **The Cause**: Single Page Applications (SPAs) use client-side routing. When a browser requests a subpath directly, Vercel looks for a physical file matching that path instead of delegating to `index.html`.
- **The Fix**: Added the rewrite rule in [`vercel.json`](./vercel.json):
  ```json
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
  ```
  This guarantees that all non-API paths are cleanly routed to the Vite SPA bundle.

---

## ⚙️ Environment Variables Reference

Copy [`.env.example`](./.env.example) to `.env` for local customization:

```bash
cp .env.example .env
```

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Port number for the Express server when running locally or in Docker. |
| `NODE_ENV` | No | `development` | Mode: `development` or `production`. |
| `PROXY_URL` | Recommended on Vercel | Built-in fallback worker | URL of your Cloudflare Worker edge proxy (e.g. `https://my-proxy.workers.dev`). |
| `SCRAPER_PROXY` | Optional | `""` | Gateway URL for commercial scraping proxies (e.g. ScraperAPI, Scrapfly). |

---

## 💻 Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) version **18.0.0** or higher
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [Git](https://git-scm.com/)

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
   > [!TIP]
   > For local development, **no proxy is needed**! The scraper will connect directly to AnimeSalt and work out of the box.

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to access the interactive web player and Live Scraper Studio.

### Build for Production

To create an optimized production bundle:
```bash
npm run build
```
This builds the Vite frontend into `dist/` and compiles `server.ts` into a self-contained CommonJS server at `dist/server.cjs`.

To run the compiled production server:
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

### 0. Backend Health Check (`/api/health`)
Checks backend uptime and validates real-time connectivity to the upstream `https://animesalt.cx` server.

- **Method**: `GET`
- **URL**: `/api/health`
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/health"
  ```
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
      "latencyMs": 639,
      "error": null
    },
    "version": "2.0.0",
    "endpointsCount": 13
  }
  ```

---

### 1. Proxy & Upstream Diagnostics (`/api/debug`)
Diagnostic endpoint that tests both your configured proxy gateway and direct upstream connectivity, reporting response latency, Cloudflare challenge status, and preview snippets.

- **Method**: `GET`
- **URL**: `/api/debug`
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/debug"
  ```
- **Example Response**:
  ```json
  {
    "timestamp": "2026-09-06T07:35:10.123Z",
    "vercelRegion": "bom1",
    "nodeVersion": "v20.x",
    "target": "https://animesalt.cx",
    "configuredProxyUrl": "https://animesalt-proxy.v1nx.workers.dev...",
    "proxyDiagnostic": {
      "requestedUrl": "https://animesalt-proxy.v1nx.workers.dev/",
      "status": 200,
      "latencyMs": 412,
      "isOk": true,
      "isHtml": true,
      "isChallenge": false,
      "preview": "<!DOCTYPE html><html lang=\"en-US\">..."
    },
    "directUpstream": {
      "status": 403,
      "latencyMs": 85,
      "isChallenge": true
    }
  }
  ```

---

### 2. Search Anime (`/api/search`)
Search anime titles by keyword with full pagination support.

- **Method**: `GET`
- **URL**: `/api/search?keyword={keyword}&page={page}`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `keyword` | string | **Yes** | — | Search term (e.g. `naruto`, `bleach`, `solo leveling`) |
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
Extracts the top 50 ranked anime titles from the Most-Watched Series and Most-Watched Films charts.

- **Method**: `GET`
- **URL**: `/api/popular?type={type}`
- **Query Parameters**:
  | Parameter | Type | Required | Default | Description |
  |---|---|---|---|---|
  | `type` | string | No | `all` | Filter by `series`, `movies`, or `all` |
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
Scrapes fresh episode drops and newly released content.

- **Method**: `GET`
- **URL**: `/api/latest-episodes`
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/latest-episodes"
  ```
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
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/ongoing?page=1"
  ```

---

### 6. Completed Anime (`/api/completed`)
Returns completed anime titles with pagination.

- **Method**: `GET`
- **URL**: `/api/completed?page={page}`
- **Query Parameters**: `page` (optional, default: `1`)
- **Example Request**:
  ```bash
  curl "http://localhost:3000/api/completed?page=1"
  ```

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
Filter titles by genre category with pagination.

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
Retrieves detailed metadata, synopsis description, poster, genres, season list, and episode totals.

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
  | `server` | number | No | `0` | Server index (`0`, `1`, etc.) |
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

## 🎛️ Live Scraper Studio & Diagnostic Center

The web application includes a built-in **Live Scraper Studio & Diagnostic Center** designed for developers, testers, and API consumers.

Access it by clicking **"Live Scraper Studio"** in the top navigation bar:
- **1-Click Health Check Suite**: Runs an automated real-time test across all endpoints with response timing and status checks.
- **Dynamic Endpoint Playground**: Interactive parameter controls with sample anime chips, genre selector pills, and pagination sliders.
- **Live Response Inspector**:
  - **Visual Preview Mode**: Displays scraped anime cards, synopsis metadata, episode grids, server lists, and live embedded video playback.
  - **Formatted JSON**: Syntax-highlighted output with in-JSON search, copy to clipboard, and JSON file download.
  - **Code Generator**: Ready-to-use snippets in `cURL`, `JavaScript Fetch`, and `Python Requests`.
  - **Execution History**: Session log with status indicators, execution latencies, and 1-click query replay.

---

## 🔄 Migration Notes & Changelog (from Anikoto)

| Feature | Legacy Version (`anikototv.to`) | Modern Version (`animesalt.cx`) |
|---|---|---|
| **Upstream Provider** | `anikototv.to` (defunct) | `https://animesalt.cx` (WordPress/ToroFilm CMS) |
| **Popular Charts** | Fragmented HTML queries | Structured extraction from `.chart-item` widgets (50 items) |
| **Episode Scraping** | Single season initial view | Parallel multi-season WordPress AJAX scraper (`admin-ajax.php`) |
| **Audio Tracks** | Single audio stream | Base64 decoded multi-language audio options |
| **Pagination** | Unsupported | Full `?page=N` support across all category and search routes |
| **Frontend UI** | Static raw JSON viewer | Full dark-mode streaming player + Live Scraper Studio |
| **Health & Diagnostics** | None | Real-time `/api/health`, `/api/debug` & automated test suite |
| **Cloudflare Bypass** | None (Fails on Vercel) | Resilient Cloudflare Worker edge reverse proxy architecture |

---

## 🤝 Contributing & Open Source Roadmap

Contributions, suggestions, and pull requests are welcome!

1. Fork the repository on GitHub.
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**.

### Roadmap:
- [x] Multi-season episode scraping via WordPress AJAX
- [x] Multi-language audio decoding (Japanese, English, Hindi, Tamil, Telugu)
- [x] Cloudflare Worker edge proxy bypass for Vercel
- [x] Full interactive web player and API studio
- [ ] Redis caching layer for high-throughput deployments
- [ ] Subtitle (.vtt / .srt) track extraction

---

## ⚖️ Legal Disclaimer

1. This API does not host or store any video media files on its servers. All content is scraped and linked directly to third-party streaming providers hosted on public websites.
2. This project is created strictly for **educational and research purposes**. The maintainers and contributors are not responsible for how this software is used or for any copyright infringements resulting from third-party media hosts.
