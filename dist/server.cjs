var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// api/index.ts
var import_express = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_axios = __toESM(require("axios"), 1);
var cheerio = __toESM(require("cheerio"), 1);
var app = (0, import_express.default)();
var router = import_express.default.Router();
app.use((0, import_cors.default)());
app.use(import_express.default.json());
var BASE_URL = "https://animesalt.cx";
var CHROME_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate",
  "Cache-Control": "max-age=0",
  "Referer": "https://animesalt.cx/",
  "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "Upgrade-Insecure-Requests": "1"
};
var MINIMAL_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://animesalt.cx/"
};
var AJAX_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate",
  "X-Requested-With": "XMLHttpRequest",
  "Referer": "https://animesalt.cx/",
  "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin"
};
var client = import_axios.default.create({
  baseURL: BASE_URL,
  timeout: 15e3,
  headers: CHROME_HEADERS,
  decompress: true,
  maxRedirects: 5
});
var ajaxClient = import_axios.default.create({
  baseURL: BASE_URL,
  timeout: 15e3,
  headers: AJAX_HEADERS,
  decompress: true,
  maxRedirects: 5
});
async function fetchPage(path2, options = {}) {
  const isAjax = !!options.isAjax;
  let fullUrl = path2.startsWith("http") ? path2 : `${BASE_URL}${path2.startsWith("/") ? "" : "/"}${path2}`;
  if (options.params && Object.keys(options.params).length > 0) {
    const urlObj = new URL(fullUrl);
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== void 0 && v !== null && v !== "") {
        urlObj.searchParams.set(k, String(v));
      }
    }
    fullUrl = urlObj.toString();
  }
  const proxyGateway = process.env.SCRAPER_PROXY || process.env.PROXY_URL;
  if (proxyGateway) {
    try {
      const proxiedUrl = proxyGateway.includes("%s") ? proxyGateway.replace("%s", encodeURIComponent(fullUrl)) : `${proxyGateway.endsWith("/") || proxyGateway.endsWith("=") ? proxyGateway : proxyGateway + "/"}${encodeURIComponent(fullUrl)}`;
      const proxyResp = await fetch(proxiedUrl, { headers: isAjax ? AJAX_HEADERS : CHROME_HEADERS });
      if (proxyResp.ok) {
        return await proxyResp.text();
      }
    } catch (proxyErr) {
      console.warn(`Proxy gateway request failed: ${proxyErr.message}`);
    }
  }
  const timeoutMs = options.timeoutMs || 14e3;
  const headerProfiles = isAjax ? [AJAX_HEADERS] : [CHROME_HEADERS, MINIMAL_HEADERS];
  let lastStatus = 0;
  let lastBodySnippet = "";
  for (const headers of headerProfiles) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(fullUrl, {
        method: "GET",
        headers,
        signal: controller.signal,
        redirect: "follow"
      });
      clearTimeout(timer);
      lastStatus = resp.status;
      if (resp.ok) {
        const text = await resp.text();
        if (!text.includes("Just a moment...") && !text.includes("cf-browser-verification")) {
          return text;
        }
        console.warn(`Direct fetch hit Cloudflare challenge on: ${fullUrl}`);
      } else if (resp.status === 404) {
        const notFoundErr = new Error("Page not found (404)");
        notFoundErr.status = 404;
        throw notFoundErr;
      } else {
        const text = await resp.text().catch(() => "");
        lastBodySnippet = text.slice(0, 160).replace(/\s+/g, " ").trim();
        console.warn(`Native fetch returned status ${resp.status} on: ${fullUrl}`);
      }
    } catch (err) {
      if (err.status === 404) throw err;
      console.warn(`Native fetch error (${err.message}) on: ${fullUrl}`);
    }
  }
  try {
    const axiosClient = isAjax ? ajaxClient : client;
    const axiosResp = await axiosClient.get(fullUrl, {
      timeout: timeoutMs,
      decompress: true,
      maxRedirects: 5
    });
    if (typeof axiosResp.data === "string") {
      return axiosResp.data;
    }
    return JSON.stringify(axiosResp.data);
  } catch (axiosErr) {
    if (axiosErr.response?.status === 404) {
      const notFoundErr = new Error("Page not found (404)");
      notFoundErr.status = 404;
      throw notFoundErr;
    }
    const status = axiosErr.response?.status || lastStatus;
    const details = axiosErr.response?.data ? String(axiosErr.response.data).slice(0, 160).replace(/\s+/g, " ").trim() : lastBodySnippet || axiosErr.message;
    throw new Error(`Upstream AnimeSalt HTTP ${status}: ${details}`);
  }
}
function extractAnimeList(html) {
  const $ = cheerio.load(html);
  const results = [];
  $("article.post, .result-item article, .items article").each((_, el) => {
    const linkEl = $(el).find("a.lnk-blk").first();
    let url = linkEl.attr("href") || $(el).find("a").first().attr("href") || "";
    const slugMatch = url.match(/\/(series|movies)\/([^/]+)\/?$/);
    const id = slugMatch ? slugMatch[2] : url.replace(/.*\//, "").replace(/\/$/, "");
    if (!id) return;
    const title = $(el).find("h2.entry-title, h3.entry-title, .entry-title").text().trim() || $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "").trim() || "";
    let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
    if (image && image.startsWith("//")) image = "https:" + image;
    const type = slugMatch ? slugMatch[1] : null;
    const quality = $(el).find(".post-ql, .quality, .ql").text().trim() || null;
    const year = $(el).find(".year, .date, .time").text().trim() || null;
    results.push({
      id,
      title,
      image,
      type,
      quality,
      year,
      url: url || null
    });
  });
  return results;
}
function extractPopularItems(html, targetType) {
  const $ = cheerio.load(html);
  const results = [];
  $(".chart-item").each((_, el) => {
    const rankText = $(el).find(".chart-number").text().trim();
    const rank = parseInt(rankText, 10) || null;
    const linkEl = $(el).find("a.chart-poster, a").first();
    const url = linkEl.attr("href") || "";
    const slugMatch = url.match(/\/(series|movies)\/([^/]+)\/?$/);
    const id = slugMatch ? slugMatch[2] : "";
    if (!id) return;
    const type = slugMatch ? slugMatch[1] : null;
    if (targetType && type && type !== targetType) return;
    const title = $(el).find(".chart-title").text().trim() || $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "").trim() || "";
    let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
    if (image && image.startsWith("//")) image = "https:" + image;
    const genre = $(el).find(".chart-genre").text().trim() || null;
    if (!results.find((r) => r.id === id)) {
      results.push({
        rank,
        id,
        title,
        image,
        type,
        genre,
        url: url || null
      });
    }
  });
  return results;
}
async function getEpisodesData(seriesSlug, requestedSeason) {
  const data = await fetchPage(`/series/${seriesSlug}/`);
  const $ = cheerio.load(data);
  const postId = $(".season-btn[data-post]").attr("data-post") || $("body").attr("class")?.match(/postid-(\d+)/)?.[1] || $(".bookmark-button, [data-post]").attr("data-post") || $("[data-id]").attr("data-id") || null;
  const seasons = [];
  $(".season-btn, .sel-temp, .aa-stn li").each((_, el) => {
    const sNum = parseInt($(el).attr("data-season") || "0", 10);
    const sTitle = $(el).text().trim();
    const countMatch = sTitle.match(/\((\d+)\)/);
    const episodeCount = countMatch ? parseInt(countMatch[1], 10) : void 0;
    if (sNum > 0 && !seasons.find((s) => s.num === sNum)) {
      seasons.push({ num: sNum, title: sTitle, episodeCount });
    }
  });
  const parseEpisodesFromHtml = (htmlContent, seasonNum) => {
    const $c = cheerio.load(htmlContent);
    const eps = [];
    $c("a[href*='/episode/']").each((_, a) => {
      const href = $c(a).attr("href") || "";
      const m = href.match(/\/episode\/([^/]+)\/?$/);
      const epSlug = m ? m[1] : "";
      if (!epSlug) return;
      const sxe = epSlug.match(/(\d+)x(\d+)$/);
      const sNum = sxe ? parseInt(sxe[1], 10) : seasonNum;
      const epNum = sxe ? parseInt(sxe[2], 10) : 0;
      if (epNum === 0) return;
      const title = $c(a).closest("li, article, .item, div").find(".entry-title, .title").text().trim() || $c(a).text().trim().replace(/^\d+\s*/, "").replace(/\s*View\s*$/i, "").trim() || `Episode ${epNum}`;
      if (!eps.find((e) => e.slug === epSlug)) {
        eps.push({
          num: epNum,
          season: sNum,
          title,
          slug: epSlug,
          url: href
        });
      }
    });
    return eps;
  };
  let episodes = [];
  if (typeof requestedSeason === "number" && requestedSeason > 0 && postId) {
    try {
      const respHtml = await fetchPage(`/wp-admin/admin-ajax.php?action=action_select_season&season=${requestedSeason}&post=${postId}`, { isAjax: true });
      episodes = parseEpisodesFromHtml(respHtml, requestedSeason);
    } catch (err) {
      console.warn(`AJAX fetch failed for season ${requestedSeason}:`, err.message);
    }
  } else if (postId && seasons.length > 1) {
    const seasonRequests = seasons.map(async (s) => {
      try {
        const respHtml = await fetchPage(`/wp-admin/admin-ajax.php?action=action_select_season&season=${s.num}&post=${postId}`, { isAjax: true });
        return parseEpisodesFromHtml(respHtml, s.num);
      } catch (err) {
        console.warn(`AJAX fetch failed for season ${s.num}:`, err.message);
        return [];
      }
    });
    const allSeasonEpisodes = await Promise.all(seasonRequests);
    episodes = allSeasonEpisodes.flat();
  } else {
    episodes = parseEpisodesFromHtml(data, 1);
  }
  const uniqueMap = /* @__PURE__ */ new Map();
  for (const ep of episodes) {
    if (!uniqueMap.has(ep.slug)) {
      uniqueMap.set(ep.slug, ep);
    }
  }
  episodes = Array.from(uniqueMap.values());
  episodes.sort((a, b) => a.season - b.season || a.num - b.num);
  return { postId, seasons, episodes };
}
router.get("/health", async (_req, res) => {
  const t0 = performance.now();
  let upstreamOnline = false;
  let upstreamLatency = 0;
  let upstreamError = null;
  try {
    const html = await fetchPage("/", { timeoutMs: 8e3 });
    upstreamOnline = typeof html === "string" && (html.includes("animesalt") || html.includes("<html"));
    upstreamLatency = Math.round(performance.now() - t0);
  } catch (err) {
    upstreamOnline = false;
    upstreamError = err.message;
  }
  res.json({
    success: upstreamOnline,
    status: upstreamOnline ? "healthy" : "degraded",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Math.round(process.uptime()),
    upstream: {
      source: BASE_URL,
      online: upstreamOnline,
      latencyMs: upstreamLatency,
      error: upstreamError
    },
    version: "2.0.0",
    endpointsCount: 13
  });
});
router.get("/debug", async (_req, res) => {
  const result = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    vercelRegion: process.env.VERCEL_REGION || "local",
    nodeVersion: process.version,
    target: BASE_URL
  };
  try {
    const t0 = performance.now();
    const resp = await fetch(`${BASE_URL}/`, {
      headers: CHROME_HEADERS,
      redirect: "follow"
    });
    result.status = resp.status;
    result.latencyMs = Math.round(performance.now() - t0);
    result.headers = Object.fromEntries(resp.headers.entries());
    const body = await resp.text();
    result.bodyPreview = body.slice(0, 300).replace(/\s+/g, " ").trim();
    result.isCloudflareChallenge = body.includes("Just a moment...") || body.includes("cf-browser-verification");
  } catch (err) {
    result.error = err.message;
  }
  res.json(result);
});
router.get("/search", async (req, res) => {
  const keyword = req.query.keyword;
  const page = parseInt(req.query.page || "1", 10);
  if (!keyword) return res.status(400).json({ success: false, error: "Keyword required" });
  try {
    const searchUrl = page > 1 ? `/?s=${encodeURIComponent(keyword)}&paged=${page}` : "/";
    const data = await fetchPage(searchUrl, { params: page === 1 ? { s: keyword } : {} });
    const results = extractAnimeList(data);
    res.json({ success: true, page, data: results });
  } catch (e) {
    if (e.status === 404 || e.response?.status === 404) {
      return res.json({ success: true, page, data: [] });
    }
    console.error("Search error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape search results", details: e.message });
  }
});
router.get("/latest-episodes", async (_req, res) => {
  try {
    const data = await fetchPage("/");
    const $ = cheerio.load(data);
    const results = [];
    $("section.widget_list_episodes article.post, .widget_list_episodes article, article.post").each((_, el) => {
      const linkEl = $(el).find("a.lnk-blk").first();
      let url = linkEl.attr("href") || $(el).find("a[href*='/series/'], a[href*='/movies/'], a[href*='/episode/']").first().attr("href") || "";
      const slugMatch = url.match(/\/(series|movies|episode)\/([^/]+)\/?$/);
      const id = slugMatch ? slugMatch[2] : "";
      if (!id) return;
      const title = $(el).find("h2.entry-title, h3, .entry-title").text().trim() || $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "").trim() || "";
      let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
      if (image && image.startsWith("//")) image = "https:" + image;
      if (!results.find((r) => r.id === id)) {
        results.push({
          id,
          title,
          image,
          type: slugMatch?.[1] || null,
          url: url || null
        });
      }
    });
    res.json({ success: true, data: results });
  } catch (e) {
    console.error("Latest eps error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape latest episodes", details: e.message });
  }
});
router.get("/popular", async (req, res) => {
  const type = req.query.type;
  try {
    const data = await fetchPage("/");
    let results = extractPopularItems(data, type);
    if (results.length === 0) {
      const $ = cheerio.load(data);
      $("section[id*='widget_list_movies_series'] article.post").each((i, el) => {
        const linkEl = $(el).find("a.lnk-blk").first();
        const url = linkEl.attr("href") || "";
        const slugMatch = url.match(/\/(series|movies)\/([^/]+)\/?$/);
        const id = slugMatch ? slugMatch[2] : "";
        if (!id) return;
        const title = $(el).find("h2.entry-title, .entry-title").text().trim();
        let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
        if (image && image.startsWith("//")) image = "https:" + image;
        if (!results.find((r) => r.id === id)) {
          results.push({
            rank: i + 1,
            id,
            title,
            image,
            type: slugMatch?.[1] || null,
            genre: null,
            url
          });
        }
      });
    }
    res.json({ success: true, data: results });
  } catch (e) {
    console.error("Popular error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape popular anime", details: e.message });
  }
});
router.get("/completed", async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const path2 = page > 1 ? `/category/status/completed/page/${page}/` : "/category/status/completed/";
  try {
    const data = await fetchPage(path2);
    const results = extractAnimeList(data);
    res.json({ success: true, page, data: results });
  } catch (e) {
    if (e.status === 404 || e.response?.status === 404) {
      return res.json({ success: true, page, data: [] });
    }
    console.error("Completed error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape completed anime", details: e.message });
  }
});
router.get("/ongoing", async (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const path2 = page > 1 ? `/category/status/ongoing/page/${page}/` : "/category/status/ongoing/";
  try {
    const data = await fetchPage(path2);
    const results = extractAnimeList(data);
    res.json({ success: true, page, data: results });
  } catch (e) {
    if (e.status === 404 || e.response?.status === 404) {
      return res.json({ success: true, page, data: [] });
    }
    console.error("Ongoing error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape ongoing anime", details: e.message });
  }
});
router.get("/type/:type", async (req, res) => {
  const { type } = req.params;
  const subtype = req.query.subtype || "series";
  const page = parseInt(req.query.page || "1", 10);
  const path2 = page > 1 ? `/category/type/${type}/page/${page}/` : `/category/type/${type}/`;
  try {
    const data = await fetchPage(path2, { params: { type: subtype } });
    const results = extractAnimeList(data);
    res.json({ success: true, page, type, subtype, data: results });
  } catch (e) {
    if (e.status === 404 || e.response?.status === 404) {
      return res.json({ success: true, page, type, subtype, data: [] });
    }
    console.error("Type error:", e.message);
    res.status(500).json({ success: false, error: `Failed to scrape type ${type}`, details: e.message });
  }
});
router.get("/genre/:category", async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page || "1", 10);
  const path2 = page > 1 ? `/category/genre/${category}/page/${page}/` : `/category/genre/${category}/`;
  try {
    const data = await fetchPage(path2);
    const results = extractAnimeList(data);
    res.json({ success: true, page, genre: category, data: results });
  } catch (e) {
    if (e.status === 404 || e.response?.status === 404) {
      return res.json({ success: true, page, genre: category, data: [] });
    }
    console.error("Genre error:", e.message);
    res.status(500).json({ success: false, error: `Failed to scrape genre ${category}`, details: e.message });
  }
});
router.get("/info", async (req, res) => {
  const animeId = req.query.id;
  if (!animeId) return res.status(400).json({ success: false, error: "Anime ID (slug) is required" });
  try {
    let data;
    let type = "series";
    try {
      data = await fetchPage(`/series/${animeId}/`);
    } catch (seriesErr) {
      data = await fetchPage(`/movies/${animeId}/`);
      type = "movies";
    }
    const $ = cheerio.load(data);
    const title = $("h1.entry-title, .sheader .data h1, h1").first().text().trim();
    let poster = $(".sheader .poster img, .post-thumbnail img, img.wp-post-image, .poster img").first().attr("data-src") || $(".sheader .poster img, .post-thumbnail img, img.wp-post-image, .poster img").first().attr("src") || "";
    if (poster && poster.startsWith("//")) poster = "https:" + poster;
    const description = $("#overview-text p, #overview-text, .overview, .synopsis, .sinopsis, .entry-content p, .wp-content p").first().text().trim();
    const genres = [];
    $('a[href*="/category/genre/"]').each((_, el) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) genres.push(g);
    });
    const languages = [];
    $('a[href*="/category/language/"]').each((_, el) => {
      const l = $(el).text().trim();
      if (l && !languages.includes(l)) languages.push(l);
    });
    const info = {};
    $(".custom_fields, .spe, .extra, .metainfo, .info-content").find("span, li, p").each((_, el) => {
      const text = $(el).text();
      const parts = text.split(":");
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
        const val = parts.slice(1).join(":").trim();
        if (key && val) info[key] = val;
      }
    });
    let seasons = [];
    let totalEpisodes = 0;
    if (type === "series") {
      try {
        const epData = await getEpisodesData(animeId);
        seasons = epData.seasons;
        const sumCounts = seasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0);
        totalEpisodes = sumCounts > 0 ? sumCounts : epData.episodes.length;
      } catch (epErr) {
        console.warn("Could not fetch episodes for info:", epErr);
      }
    } else {
      totalEpisodes = 1;
    }
    const related = [];
    $(".srelacionados article.post, .releated article.post, .related article").each((_, el) => {
      const url = $(el).find("a.lnk-blk").attr("href") || $(el).find("a").first().attr("href") || "";
      const slugMatch = url.match(/\/(series|movies)\/([^/]+)\/?$/);
      const relId = slugMatch ? slugMatch[2] : "";
      if (!relId) return;
      const relTitle = $(el).find("h2.entry-title, .entry-title").text().trim() || $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "").trim() || "";
      let relImage = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
      if (relImage && relImage.startsWith("//")) relImage = "https:" + relImage;
      if (!related.find((r) => r.id === relId)) {
        related.push({ id: relId, title: relTitle, image: relImage });
      }
    });
    res.json({
      success: true,
      data: {
        id: animeId,
        title,
        poster,
        description,
        type,
        totalEpisodes,
        seasons,
        related,
        ...info
      }
    });
  } catch (e) {
    console.error("Info error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape anime details", details: e.message });
  }
});
router.get("/episodes/:animeId", async (req, res) => {
  const { animeId } = req.params;
  const seasonParam = req.query.season;
  const requestedSeason = seasonParam ? parseInt(seasonParam, 10) : void 0;
  try {
    const { episodes, seasons } = await getEpisodesData(animeId, requestedSeason);
    const formattedEpisodes = episodes.map((e) => ({
      num: e.num,
      season: e.season,
      title: e.title,
      slug: e.slug,
      url: e.url
    }));
    res.json({
      success: true,
      data: {
        animeId,
        currentSeason: requestedSeason || "all",
        seasons,
        totalEpisodes: formattedEpisodes.length,
        episodes: formattedEpisodes
      }
    });
  } catch (e) {
    console.error("Episodes error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape episodes", details: e.message });
  }
});
router.get("/servers", async (req, res) => {
  const { ep: epSlug } = req.query;
  if (!epSlug) return res.status(400).json({ success: false, error: "Episode slug (ep) is required" });
  try {
    const epUrl = `/episode/${epSlug}/`;
    const data = await fetchPage(epUrl);
    const $ = cheerio.load(data);
    const servers = [];
    $(".server-btn").each((index, el) => {
      const serverNameHeader = $(el).find(".server-name").text().trim() || `SERVER ${index + 1}`;
      const serverInfo = $(el).find(".server-info").text().trim();
      const fullName = serverInfo ? `${serverNameHeader} - ${serverInfo}` : serverNameHeader;
      const videoContainer = $(`#options-${index}`).length ? $(`#options-${index}`) : $(".video.aa-tb").eq(index);
      const iframe = videoContainer.find("iframe");
      const embedUrl = iframe.attr("src") || iframe.attr("data-src") || "";
      let languages = [];
      if (embedUrl.includes("multi-lang-plyr/player.php?data=")) {
        try {
          const match = embedUrl.match(/data=([A-Za-z0-9+/=]+)/);
          if (match && match[1]) {
            const decoded = Buffer.from(match[1], "base64").toString("utf-8");
            languages = JSON.parse(decoded);
          }
        } catch (decErr) {
          console.warn("Base64 decode failed for multi-lang:", decErr);
        }
      }
      servers.push({
        index,
        serverName: fullName,
        embedUrl: embedUrl || null,
        isMultiLang: languages.length > 0,
        languages
      });
    });
    if (servers.length === 0) {
      $("iframe").each((i, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src") || "";
        if (src && !src.includes("google") && !src.includes("facebook") && !src.includes("ad")) {
          servers.push({
            index: i,
            serverName: `Server ${i + 1}`,
            embedUrl: src,
            isMultiLang: false,
            languages: []
          });
        }
      });
    }
    res.json({ success: true, data: servers });
  } catch (e) {
    console.error("Servers error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape servers", details: e.message });
  }
});
router.get("/stream", async (req, res) => {
  const { ep: epSlug, server: serverParam, lang } = req.query;
  if (!epSlug) return res.status(400).json({ success: false, error: "Episode slug (ep) is required" });
  try {
    const epUrl = `/episode/${epSlug}/`;
    const data = await fetchPage(epUrl);
    const $ = cheerio.load(data);
    const serverIndex = parseInt(serverParam || "0", 10);
    const videoContainer = $(`#options-${serverIndex}`).length ? $(`#options-${serverIndex}`) : $(".video.aa-tb").eq(serverIndex);
    const iframe = videoContainer.find("iframe").length ? videoContainer.find("iframe") : $("iframe").eq(serverIndex);
    let embedUrl = iframe.attr("src") || iframe.attr("data-src") || null;
    let selectedLanguage = null;
    if (embedUrl && embedUrl.includes("multi-lang-plyr/player.php?data=")) {
      try {
        const match = embedUrl.match(/data=([A-Za-z0-9+/=]+)/);
        if (match && match[1]) {
          const decoded = Buffer.from(match[1], "base64").toString("utf-8");
          const languages = JSON.parse(decoded);
          if (Array.isArray(languages)) {
            if (lang) {
              const matchedLang = languages.find((l) => l.language?.toLowerCase() === lang.toLowerCase());
              if (matchedLang) {
                embedUrl = matchedLang.link;
                selectedLanguage = matchedLang.language;
              }
            } else if (languages.length > 0) {
              const english = languages.find((l) => l.language?.toLowerCase().includes("eng"));
              if (english) {
                selectedLanguage = english.language;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not parse multi-lang stream data:", err);
      }
    }
    if (embedUrl && embedUrl.startsWith("//")) {
      embedUrl = "https:" + embedUrl;
    }
    res.json({
      success: true,
      data: {
        embedUrl,
        serverIndex,
        selectedLanguage,
        isIframe: true,
        referer: `${BASE_URL}${epUrl}`
      }
    });
  } catch (e) {
    console.error("Stream error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape stream", details: e.message });
  }
});
app.use("/api", router);
app.use("/", router);
var api_default = app;

// server.ts
var processCwd = process.cwd();
async function startServer() {
  const app2 = (0, import_express2.default)();
  const PORT = 3e3;
  app2.use(api_default);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app2.use(import_express2.default.static(distPath));
    app2.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
