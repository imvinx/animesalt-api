import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();

app.use(cors());
app.use(express.json());

const BASE_URL = "https://animesalt.cx";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    Referer: BASE_URL,
  },
});

const ajaxClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "*/*",
    "X-Requested-With": "XMLHttpRequest",
    Referer: BASE_URL,
  },
});

// Helper to extract anime list from HTML (category/search/archive pages)
function extractAnimeList(html: string) {
  const $ = cheerio.load(html);
  const results: any[] = [];

  $("article.post, .result-item article, .items article").each((_, el) => {
    const linkEl = $(el).find("a.lnk-blk").first();
    let url = linkEl.attr("href") || $(el).find("a").first().attr("href") || "";

    // Extract slug from URL like /series/naruto/ or /movies/some-movie/
    const slugMatch = url.match(/\/(series|movies)\/([^/]+)\/?$/);
    const id = slugMatch ? slugMatch[2] : url.replace(/.*\//, "").replace(/\/$/, "");

    if (!id) return;

    const title = $(el).find("h2.entry-title, h3.entry-title, .entry-title").text().trim() ||
                  $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "").trim() || "";

    let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
    if (image && image.startsWith("//")) image = "https:" + image;

    const type = slugMatch ? slugMatch[1] : null; // "series" or "movies"
    const quality = $(el).find(".post-ql, .quality, .ql").text().trim() || null;
    const year = $(el).find(".year, .date, .time").text().trim() || null;

    results.push({
      id,
      title,
      image,
      type,
      quality,
      year,
      url: url || null,
    });
  });

  return results;
}

// Helper: Extract items from popular charts (Most-Watched Series & Films)
function extractPopularItems(html: string, targetType?: string) {
  const $ = cheerio.load(html);
  const results: any[] = [];

  // Look for popular widgets: #torofilm_wdgt_popular-3-aa-top (series) or #torofilm_wdgt_popular-2-aa-top (movies)
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

    const title = $(el).find(".chart-title").text().trim() ||
                  $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "").trim() || "";

    let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
    if (image && image.startsWith("//")) image = "https:" + image;

    const genre = $(el).find(".chart-genre").text().trim() || null;

    if (!results.find(r => r.id === id)) {
      results.push({
        rank,
        id,
        title,
        image,
        type,
        genre,
        url: url || null,
      });
    }
  });

  return results;
}

// Helper: Fetch episodes for a series (supports specific season or all seasons via AJAX)
async function getEpisodesData(seriesSlug: string, requestedSeason?: number | "all") {
  const { data } = await client.get(`/series/${seriesSlug}/`);
  const $ = cheerio.load(data);

  // Extract post ID for AJAX requests
  const postId = $(".season-btn[data-post]").attr("data-post") ||
                 $("body").attr("class")?.match(/postid-(\d+)/)?.[1] ||
                 $(".bookmark-button, [data-post]").attr("data-post") ||
                 $("[data-id]").attr("data-id") || null;

  // Extract seasons list from buttons
  const seasons: { num: number; title: string; episodeCount?: number }[] = [];
  $(".season-btn, .sel-temp, .aa-stn li").each((_, el) => {
    const sNum = parseInt($(el).attr("data-season") || "0", 10);
    const sTitle = $(el).text().trim();
    const countMatch = sTitle.match(/\((\d+)\)/);
    const episodeCount = countMatch ? parseInt(countMatch[1], 10) : undefined;
    if (sNum > 0 && !seasons.find(s => s.num === sNum)) {
      seasons.push({ num: sNum, title: sTitle, episodeCount });
    }
  });

  // Function to parse episodes from HTML snippet
  const parseEpisodesFromHtml = (htmlContent: string, seasonNum: number) => {
    const $c = cheerio.load(htmlContent);
    const eps: any[] = [];
    $c("a[href*='/episode/']").each((_, a) => {
      const href = $c(a).attr("href") || "";
      const m = href.match(/\/episode\/([^/]+)\/?$/);
      const epSlug = m ? m[1] : "";
      if (!epSlug) return;

      const sxe = epSlug.match(/(\d+)x(\d+)$/);
      const sNum = sxe ? parseInt(sxe[1], 10) : seasonNum;
      const epNum = sxe ? parseInt(sxe[2], 10) : 0;
      if (epNum === 0) return;

      const title = $c(a).closest("li, article, .item, div").find(".entry-title, .title").text().trim() ||
                    $c(a).text().trim().replace(/^\d+\s*/, "").replace(/\s*View\s*$/i, "").trim() ||
                    `Episode ${epNum}`;

      if (!eps.find(e => e.slug === epSlug)) {
        eps.push({
          num: epNum,
          season: sNum,
          title,
          slug: epSlug,
          url: href,
        });
      }
    });
    return eps;
  };

  let episodes: any[] = [];

  // If specific season requested and postId available
  if (typeof requestedSeason === "number" && requestedSeason > 0 && postId) {
    try {
      const resp = await ajaxClient.get(`/wp-admin/admin-ajax.php?action=action_select_season&season=${requestedSeason}&post=${postId}`);
      episodes = parseEpisodesFromHtml(resp.data, requestedSeason);
    } catch (err: any) {
      console.warn(`AJAX fetch failed for season ${requestedSeason}:`, err.message);
    }
  } else if (postId && seasons.length > 1) {
    // Fetch all seasons in parallel via AJAX
    const seasonRequests = seasons.map(async (s) => {
      try {
        const resp = await ajaxClient.get(`/wp-admin/admin-ajax.php?action=action_select_season&season=${s.num}&post=${postId}`);
        return parseEpisodesFromHtml(resp.data, s.num);
      } catch (err: any) {
        console.warn(`AJAX fetch failed for season ${s.num}:`, err.message);
        return [];
      }
    });

    const allSeasonEpisodes = await Promise.all(seasonRequests);
    episodes = allSeasonEpisodes.flat();
  } else {
    // Fallback: Parse episodes already in the page DOM
    episodes = parseEpisodesFromHtml(data, 1);
  }

  // Sort episodes by season then episode number
  episodes.sort((a, b) => a.season - b.season || a.num - b.num);

  return { postId, seasons, episodes };
}

// ==========================================
// 0. Health & Diagnostics
app.get("/api/health", async (_req, res) => {
  const t0 = performance.now();
  let upstreamOnline = false;
  let upstreamLatency = 0;
  try {
    const upstreamRes = await client.get("/", { timeout: 8000 });
    upstreamOnline = upstreamRes.status === 200;
    upstreamLatency = Math.round(performance.now() - t0);
  } catch {
    upstreamOnline = false;
  }
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    upstream: {
      source: "https://animesalt.cx",
      online: upstreamOnline,
      latencyMs: upstreamLatency,
    },
    version: "2.0.0",
    endpointsCount: 12,
  });
});

// 1. Search with pagination
app.get("/api/search", async (req, res) => {
  const keyword = req.query.keyword as string;
  const page = parseInt(req.query.page as string || "1", 10);
  if (!keyword) return res.status(400).json({ error: "Keyword required" });

  try {
    const searchUrl = page > 1 ? `/?s=${encodeURIComponent(keyword)}&paged=${page}` : "/";
    const resp = await client.get(searchUrl, { params: page === 1 ? { s: keyword } : {} });
    const results = extractAnimeList(resp.data);
    res.json({ success: true, page, data: results });
  } catch (e: any) {
    if (e.response?.status === 404) {
      // 404 means no further pages
      return res.json({ success: true, page, data: [] });
    }
    console.error("Search error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape search results", details: e.message });
  }
});

// 2. Latest Episodes
app.get("/api/latest-episodes", async (req, res) => {
  try {
    const resp = await client.get("/");
    const $ = cheerio.load(resp.data);
    const results: any[] = [];

    // Fresh Drops widget and latest article posts
    $("section.widget_list_episodes article.post, .widget_list_episodes article, article.post").each((_, el) => {
      const linkEl = $(el).find("a.lnk-blk").first();
      let url = linkEl.attr("href") || $(el).find("a[href*='/series/'], a[href*='/movies/'], a[href*='/episode/']").first().attr("href") || "";
      const slugMatch = url.match(/\/(series|movies|episode)\/([^/]+)\/?$/);
      const id = slugMatch ? slugMatch[2] : "";
      if (!id) return;

      const title = $(el).find("h2.entry-title, h3, .entry-title").text().trim() ||
                    $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "").trim() || "";
      let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
      if (image && image.startsWith("//")) image = "https:" + image;

      if (!results.find(r => r.id === id)) {
        results.push({
          id,
          title,
          image,
          type: slugMatch?.[1] || null,
          url: url || null,
        });
      }
    });

    res.json({ success: true, data: results });
  } catch (e: any) {
    console.error("Latest eps error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape latest episodes", details: e.message });
  }
});

// 3. Popular Anime / Charts (Most-Watched Series & Films)
app.get("/api/popular", async (req, res) => {
  const type = req.query.type as string; // 'series' | 'movies' | undefined
  try {
    const resp = await client.get("/");
    let results = extractPopularItems(resp.data, type);

    // Fallback if chart-items not present: use On-Air / New Arrivals
    if (results.length === 0) {
      const $ = cheerio.load(resp.data);
      $("section[id*='widget_list_movies_series'] article.post").each((i, el) => {
        const linkEl = $(el).find("a.lnk-blk").first();
        const url = linkEl.attr("href") || "";
        const slugMatch = url.match(/\/(series|movies)\/([^/]+)\/?$/);
        const id = slugMatch ? slugMatch[2] : "";
        if (!id) return;

        const title = $(el).find("h2.entry-title, .entry-title").text().trim();
        let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
        if (image && image.startsWith("//")) image = "https:" + image;

        if (!results.find(r => r.id === id)) {
          results.push({
            rank: i + 1,
            id,
            title,
            image,
            type: slugMatch?.[1] || null,
            genre: null,
            url,
          });
        }
      });
    }

    res.json({ success: true, data: results });
  } catch (e: any) {
    console.error("Popular error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape popular anime", details: e.message });
  }
});

// 4. Completed Anime with pagination
app.get("/api/completed", async (req, res) => {
  const page = parseInt(req.query.page as string || "1", 10);
  const path = page > 1 ? `/category/status/completed/page/${page}/` : "/category/status/completed/";
  try {
    const resp = await client.get(path);
    const results = extractAnimeList(resp.data);
    res.json({ success: true, page, data: results });
  } catch (e: any) {
    if (e.response?.status === 404) {
      return res.json({ success: true, page, data: [] });
    }
    console.error("Completed error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape completed anime", details: e.message });
  }
});

// 5. Ongoing Anime with pagination
app.get("/api/ongoing", async (req, res) => {
  const page = parseInt(req.query.page as string || "1", 10);
  const path = page > 1 ? `/category/status/ongoing/page/${page}/` : "/category/status/ongoing/";
  try {
    const resp = await client.get(path);
    const results = extractAnimeList(resp.data);
    res.json({ success: true, page, data: results });
  } catch (e: any) {
    if (e.response?.status === 404) {
      return res.json({ success: true, page, data: [] });
    }
    console.error("Ongoing error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape ongoing anime", details: e.message });
  }
});

// 6. Type filter (anime / cartoon) with subtype (series / movies) & pagination
app.get("/api/type/:type", async (req, res) => {
  const { type } = req.params;
  const subtype = (req.query.subtype as string) || "series";
  const page = parseInt(req.query.page as string || "1", 10);
  const path = page > 1 ? `/category/type/${type}/page/${page}/` : `/category/type/${type}/`;

  try {
    const resp = await client.get(path, { params: { type: subtype } });
    const results = extractAnimeList(resp.data);
    res.json({ success: true, page, type, subtype, data: results });
  } catch (e: any) {
    if (e.response?.status === 404) {
      return res.json({ success: true, page, type, subtype, data: [] });
    }
    console.error("Type error:", e.message);
    res.status(500).json({ success: false, error: `Failed to scrape type ${type}`, details: e.message });
  }
});

// 7. Genre filter with pagination
app.get("/api/genre/:category", async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page as string || "1", 10);
  const path = page > 1 ? `/category/genre/${category}/page/${page}/` : `/category/genre/${category}/`;

  try {
    const resp = await client.get(path);
    const results = extractAnimeList(resp.data);
    res.json({ success: true, page, genre: category, data: results });
  } catch (e: any) {
    if (e.response?.status === 404) {
      return res.json({ success: true, page, genre: category, data: [] });
    }
    console.error("Genre error:", e.message);
    res.status(500).json({ success: false, error: `Failed to scrape genre ${category}`, details: e.message });
  }
});

// 8. Anime Details / Info
app.get("/api/info", async (req, res) => {
  const animeId = req.query.id as string;
  if (!animeId) return res.status(400).json({ success: false, error: "Anime ID (slug) is required" });

  try {
    let data: string;
    let type = "series";

    try {
      const resp = await client.get(`/series/${animeId}/`);
      data = resp.data;
    } catch (seriesErr: any) {
      // If series fails, try /movies/
      const resp = await client.get(`/movies/${animeId}/`);
      data = resp.data;
      type = "movies";
    }

    const $ = cheerio.load(data);

    const title = $("h1.entry-title, .sheader .data h1, h1").first().text().trim();
    let poster = $(".sheader .poster img, .post-thumbnail img, img.wp-post-image, .poster img").first().attr("data-src") ||
                 $(".sheader .poster img, .post-thumbnail img, img.wp-post-image, .poster img").first().attr("src") || "";
    if (poster && poster.startsWith("//")) poster = "https:" + poster;

    // Accurate description selector for AnimeSalt
    const description = $("#overview-text p, #overview-text, .overview, .synopsis, .sinopsis, .entry-content p, .wp-content p")
                          .first().text().trim();

    // Extract genres
    const genres: string[] = [];
    $('a[href*="/category/genre/"]').each((_, el) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) genres.push(g);
    });

    // Extract languages
    const languages: string[] = [];
    $('a[href*="/category/language/"]').each((_, el) => {
      const l = $(el).text().trim();
      if (l && !languages.includes(l)) languages.push(l);
    });

    // Extract metadata
    const info: Record<string, string[]> = {};
    if (genres.length) info["genres"] = genres;
    if (languages.length) info["languages"] = languages;

    $(".sheader .data .extra .metadata span, .spe span, .info .meta span, .custom-fields span").each((_, el) => {
      const text = $(el).text().trim();
      const parts = text.split(":");
      if (parts.length === 2) {
        const key = parts[0].trim().toLowerCase();
        const val = parts[1].trim();
        if (key && val) {
          if (!info[key]) info[key] = [];
          info[key].push(val);
        }
      }
    });

    // Seasons and episodes summary
    let seasons: any[] = [];
    let totalEpisodes = 0;

    if (type === "series") {
      try {
        const epData = await getEpisodesData(animeId, 1);
        seasons = epData.seasons;
        // Total episodes from sum of season counts or actual scraped count
        const sumCounts = seasons.reduce((sum, s) => sum + (s.episodeCount || 0), 0);
        totalEpisodes = sumCounts > 0 ? sumCounts : epData.episodes.length;
      } catch (epErr) {
        console.warn("Could not fetch episodes for info:", epErr);
      }
    } else {
      totalEpisodes = 1;
    }

    // Related / Recommendations
    const related: any[] = [];
    $(".srelacionados article.post, .releated article.post, .related article").each((_, el) => {
      const url = $(el).find("a.lnk-blk").attr("href") || $(el).find("a").first().attr("href") || "";
      const slugMatch = url.match(/\/(series|movies)\/([^/]+)\/?$/);
      const relId = slugMatch ? slugMatch[2] : "";
      if (!relId) return;

      const relTitle = $(el).find("h2.entry-title, .entry-title").text().trim() ||
                       $(el).find("img").attr("alt")?.replace(/^Image\s+/i, "").trim() || "";
      let relImage = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || "";
      if (relImage && relImage.startsWith("//")) relImage = "https:" + relImage;

      if (!related.find(r => r.id === relId)) {
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
        ...info,
      },
    });
  } catch (e: any) {
    console.error("Info error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape anime details", details: e.message });
  }
});

// 9. Episodes List with optional season filter (?season=2 or default all seasons)
app.get("/api/episodes/:animeId", async (req, res) => {
  const { animeId } = req.params;
  const seasonParam = req.query.season as string;
  const requestedSeason = seasonParam ? parseInt(seasonParam, 10) : undefined;

  try {
    const { episodes, seasons } = await getEpisodesData(animeId, requestedSeason);
    const formattedEpisodes = episodes.map(e => ({
      num: e.num,
      season: e.season,
      title: e.title,
      slug: e.slug,
      url: e.url,
    }));

    res.json({
      success: true,
      data: {
        animeId,
        currentSeason: requestedSeason || "all",
        seasons,
        totalEpisodes: formattedEpisodes.length,
        episodes: formattedEpisodes,
      },
    });
  } catch (e: any) {
    console.error("Episodes error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape episodes", details: e.message });
  }
});

// 10. Video Servers for an episode
app.get("/api/servers", async (req, res) => {
  const { ep: epSlug } = req.query as { id?: string; ep: string };
  if (!epSlug) return res.status(400).json({ success: false, error: "Episode slug (ep) is required" });

  try {
    const epUrl = `/episode/${epSlug}/`;
    const { data } = await client.get(epUrl);
    const $ = cheerio.load(data);

    const servers: any[] = [];

    // Map each .server-btn to its corresponding .video.aa-tb player container
    $(".server-btn").each((index, el) => {
      const serverNameHeader = $(el).find(".server-name").text().trim() || `SERVER ${index + 1}`;
      const serverInfo = $(el).find(".server-info").text().trim();
      const fullName = serverInfo ? `${serverNameHeader} - ${serverInfo}` : serverNameHeader;

      // The corresponding iframe is inside #options-${index} or the index-th .video.aa-tb
      const videoContainer = $(`#options-${index}`).length ? $(`#options-${index}`) : $(".video.aa-tb").eq(index);
      const iframe = videoContainer.find("iframe");
      const embedUrl = iframe.attr("src") || iframe.attr("data-src") || "";

      // Check for multi-language player links
      let languages: any[] = [];
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
        languages,
      });
    });

    // Fallback: If no .server-btn was found, search direct iframes
    if (servers.length === 0) {
      $("iframe").each((i, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src") || "";
        if (src && !src.includes("google") && !src.includes("facebook") && !src.includes("ad")) {
          servers.push({
            index: i,
            serverName: `Server ${i + 1}`,
            embedUrl: src,
            isMultiLang: false,
            languages: [],
          });
        }
      });
    }

    res.json({ success: true, data: servers });
  } catch (e: any) {
    console.error("Servers error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape servers", details: e.message });
  }
});

// 11. Stream / Embed URL extractor
app.get("/api/stream", async (req, res) => {
  const { ep: epSlug, server: serverParam, lang } = req.query as {
    id?: string;
    ep: string;
    server?: string;
    lang?: string;
  };

  if (!epSlug) return res.status(400).json({ success: false, error: "Episode slug (ep) is required" });

  try {
    const epUrl = `/episode/${epSlug}/`;
    const { data } = await client.get(epUrl);
    const $ = cheerio.load(data);

    const serverIndex = parseInt(serverParam || "0", 10);
    const videoContainer = $(`#options-${serverIndex}`).length ? $(`#options-${serverIndex}`) : $(".video.aa-tb").eq(serverIndex);
    const iframe = videoContainer.find("iframe").length ? videoContainer.find("iframe") : $("iframe").eq(serverIndex);

    let embedUrl = iframe.attr("src") || iframe.attr("data-src") || null;
    let selectedLanguage: string | null = null;

    // If multi-language player is selected and a specific language is requested
    if (embedUrl && embedUrl.includes("multi-lang-plyr/player.php?data=")) {
      try {
        const match = embedUrl.match(/data=([A-Za-z0-9+/=]+)/);
        if (match && match[1]) {
          const decoded = Buffer.from(match[1], "base64").toString("utf-8");
          const languages = JSON.parse(decoded);
          if (Array.isArray(languages)) {
            if (lang) {
              const matchedLang = languages.find((l: any) => l.language?.toLowerCase() === lang.toLowerCase());
              if (matchedLang) {
                embedUrl = matchedLang.link;
                selectedLanguage = matchedLang.language;
              }
            } else if (languages.length > 0) {
              // Default to English or first available if requested
              const english = languages.find((l: any) => l.language?.toLowerCase().includes("eng"));
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
        referer: `${BASE_URL}${epUrl}`,
      },
    });
  } catch (e: any) {
    console.error("Stream error:", e.message);
    res.status(500).json({ success: false, error: "Failed to scrape stream", details: e.message });
  }
});

export default app;
