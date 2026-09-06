/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Play,
  Tv,
  Film,
  Search,
  Flame,
  Sparkles,
  CheckCircle2,
  Radio,
  Code,
  Copy,
  Check,
  ChevronRight,
  Info,
  Languages,
  SlidersHorizontal,
  Layers,
  ArrowLeft,
  Activity,
  Terminal,
  Download,
  RefreshCw,
  Zap,
  Eye,
  Clock,
  AlertTriangle,
  Server as ServerIcon,
  Compass,
} from "lucide-react";

interface AnimeItem {
  id: string;
  title: string;
  image: string;
  type?: string | null;
  quality?: string | null;
  genre?: string | null;
  rank?: number | null;
  year?: string | null;
  url?: string | null;
}

interface Season {
  num: number;
  title: string;
  episodeCount?: number;
}

interface Episode {
  num: number;
  season: number;
  title: string;
  slug: string;
  url?: string;
}

interface VideoServer {
  index: number;
  serverName: string;
  embedUrl: string | null;
  isMultiLang: boolean;
  languages: { language: string; link: string }[];
}

interface AnimeDetail {
  id: string;
  title: string;
  poster: string;
  description: string;
  type: string;
  totalEpisodes: number;
  seasons: Season[];
  genres?: string[];
  languages?: string[];
  related?: AnimeItem[];
  [key: string]: any;
}

interface RequestLog {
  id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  durationMs: number;
  success: boolean;
  itemCount?: string;
}

interface HealthCheckResult {
  endpoint: string;
  name: string;
  status: "idle" | "loading" | "pass" | "fail";
  statusCode?: number;
  durationMs?: number;
  resultSummary?: string;
}

export default function App() {
  // Main view mode: "browse" (Anime Catalog & Player) vs "console" (Huge API Console)
  const [mainView, setMainView] = useState<"browse" | "console">("browse");

  // Navigation & Category state for Browse view
  const [activeTab, setActiveTab] = useState<string>("popular");
  const [items, setItems] = useState<AnimeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Detailed view state for Player
  const [selectedAnimeId, setSelectedAnimeId] = useState<string | null>(null);
  const [animeDetail, setAnimeDetail] = useState<AnimeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Episodes & Player state
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [servers, setServers] = useState<VideoServer[]>([]);
  const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState<boolean>(false);

  // ==========================================
  // HUGE API CONSOLE STATE
  // ==========================================
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("popular");
  const [consoleUrl, setConsoleUrl] = useState<string>("/api/popular");
  const [consoleLoading, setConsoleLoading] = useState<boolean>(false);
  const [consoleResponse, setConsoleResponse] = useState<any>(null);
  const [consoleRawJson, setConsoleRawJson] = useState<string>("");
  const [consoleStatus, setConsoleStatus] = useState<number | null>(null);
  const [consoleDuration, setConsoleDuration] = useState<number | null>(null);
  const [consolePayloadSize, setConsolePayloadSize] = useState<string>("");
  const [consoleActiveTab, setConsoleActiveTab] = useState<"visual" | "json" | "code" | "health" | "history">("visual");
  const [jsonSearchQuery, setJsonSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Endpoint Parameter Form state
  const [paramSearch, setParamSearch] = useState<string>("naruto");
  const [paramPage, setParamPage] = useState<number>(1);
  const [paramPopularType, setParamPopularType] = useState<string>("all");
  const [paramTypeCategory, setParamTypeCategory] = useState<string>("anime");
  const [paramTypeSubtype, setParamTypeSubtype] = useState<string>("series");
  const [paramGenre, setParamGenre] = useState<string>("action");
  const [paramAnimeId, setParamAnimeId] = useState<string>("naruto");
  const [paramSeason, setParamSeason] = useState<string>("all");
  const [paramEpSlug, setParamEpSlug] = useState<string>("naruto-1x1");
  const [paramServerIdx, setParamServerIdx] = useState<string>("0");
  const [paramAudioLang, setParamAudioLang] = useState<string>("");

  // Request History Log
  const [historyLogs, setHistoryLogs] = useState<RequestLog[]>([]);

  // Health Diagnostics state
  const [healthRunning, setHealthRunning] = useState<boolean>(false);
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([
    { endpoint: "/api/health", name: "System Health & Ping", status: "idle" },
    { endpoint: "/api/popular", name: "Popular Charts (Top 50)", status: "idle" },
    { endpoint: "/api/latest-episodes", name: "Latest Fresh Drops", status: "idle" },
    { endpoint: "/api/ongoing", name: "Ongoing Anime List", status: "idle" },
    { endpoint: "/api/completed", name: "Completed Anime List", status: "idle" },
    { endpoint: "/api/type/anime?subtype=series", name: "Type Filter (Anime Series)", status: "idle" },
    { endpoint: "/api/genre/action", name: "Genre Filter (Action)", status: "idle" },
    { endpoint: "/api/search?keyword=naruto", name: "Search Engine ('naruto')", status: "idle" },
    { endpoint: "/api/info?id=naruto", name: "Anime Metadata ('naruto')", status: "idle" },
    { endpoint: "/api/episodes/naruto", name: "Multi-Season Episodes ('naruto')", status: "idle" },
    { endpoint: "/api/servers?id=naruto&ep=naruto-1x1", name: "Episode Servers ('naruto-1x1')", status: "idle" },
    { endpoint: "/api/stream?id=naruto&ep=naruto-1x1&server=0", name: "Video Stream Embed Resolver", status: "idle" },
  ]);

  // Load catalog on Browse tab change
  useEffect(() => {
    if (mainView === "browse") {
      loadCategory(activeTab);
    }
  }, [activeTab, mainView]);

  // Sync console URL when endpoint or params change
  useEffect(() => {
    let url = "/api/popular";
    switch (selectedEndpointId) {
      case "health":
        url = "/api/health";
        break;
      case "popular":
        url = paramPopularType === "all" ? "/api/popular" : `/api/popular?type=${paramPopularType}`;
        break;
      case "latest":
        url = "/api/latest-episodes";
        break;
      case "ongoing":
        url = paramPage > 1 ? `/api/ongoing?page=${paramPage}` : "/api/ongoing";
        break;
      case "completed":
        url = paramPage > 1 ? `/api/completed?page=${paramPage}` : "/api/completed";
        break;
      case "type":
        url = paramPage > 1
          ? `/api/type/${paramTypeCategory}?subtype=${paramTypeSubtype}&page=${paramPage}`
          : `/api/type/${paramTypeCategory}?subtype=${paramTypeSubtype}`;
        break;
      case "genre":
        url = paramPage > 1 ? `/api/genre/${paramGenre}?page=${paramPage}` : `/api/genre/${paramGenre}`;
        break;
      case "search":
        url = paramPage > 1
          ? `/api/search?keyword=${encodeURIComponent(paramSearch)}&page=${paramPage}`
          : `/api/search?keyword=${encodeURIComponent(paramSearch)}`;
        break;
      case "info":
        url = `/api/info?id=${encodeURIComponent(paramAnimeId)}`;
        break;
      case "episodes":
        url = paramSeason && paramSeason !== "all"
          ? `/api/episodes/${encodeURIComponent(paramAnimeId)}?season=${paramSeason}`
          : `/api/episodes/${encodeURIComponent(paramAnimeId)}`;
        break;
      case "servers":
        url = `/api/servers?id=${encodeURIComponent(paramAnimeId)}&ep=${encodeURIComponent(paramEpSlug)}`;
        break;
      case "stream":
        url = paramAudioLang
          ? `/api/stream?id=${encodeURIComponent(paramAnimeId)}&ep=${encodeURIComponent(paramEpSlug)}&server=${paramServerIdx}&lang=${encodeURIComponent(paramAudioLang)}`
          : `/api/stream?id=${encodeURIComponent(paramAnimeId)}&ep=${encodeURIComponent(paramEpSlug)}&server=${paramServerIdx}`;
        break;
    }
    setConsoleUrl(url);
  }, [
    selectedEndpointId,
    paramSearch,
    paramPage,
    paramPopularType,
    paramTypeCategory,
    paramTypeSubtype,
    paramGenre,
    paramAnimeId,
    paramSeason,
    paramEpSlug,
    paramServerIdx,
    paramAudioLang,
  ]);

  const loadCategory = async (tab: string) => {
    setLoading(true);
    let url = "/api/popular";
    if (tab === "popular") url = "/api/popular";
    else if (tab === "latest") url = "/api/latest-episodes";
    else if (tab === "ongoing") url = "/api/ongoing";
    else if (tab === "completed") url = "/api/completed";
    else if (tab === "movies") url = "/api/type/anime?subtype=movies";
    else if (tab === "cartoons") url = "/api/type/cartoon?subtype=series";

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setActiveTab("search");
    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSelectAnime = async (anime: AnimeItem) => {
    setSelectedAnimeId(anime.id);
    setDetailLoading(true);
    setStreamUrl(null);
    setCurrentEpisode(null);
    setServers([]);

    try {
      const res = await fetch(`/api/info?id=${anime.id}`);
      const detailData = await res.json();
      if (detailData?.success && detailData.data) {
        setAnimeDetail(detailData.data);
        const defaultSeason = detailData.data.seasons?.[0]?.num || 1;
        setSelectedSeason(defaultSeason);

        const epsRes = await fetch(`/api/episodes/${anime.id}?season=${defaultSeason}`);
        const epsData = await epsRes.json();
        if (epsData?.success && Array.isArray(epsData.data?.episodes)) {
          setEpisodes(epsData.data.episodes);
          if (epsData.data.episodes.length > 0) {
            playEpisode(epsData.data.episodes[0], anime.id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    setDetailLoading(false);
  };

  const handleSeasonChange = async (seasonNum: number) => {
    if (!selectedAnimeId) return;
    setSelectedSeason(seasonNum);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/episodes/${selectedAnimeId}?season=${seasonNum}`);
      const epsData = await res.json();
      if (epsData?.success && Array.isArray(epsData.data?.episodes)) {
        setEpisodes(epsData.data.episodes);
      }
    } catch (err) {
      console.error(err);
    }
    setDetailLoading(false);
  };

  const playEpisode = async (episode: Episode, animeId?: string) => {
    setCurrentEpisode(episode);
    setPlayerLoading(true);
    const aId = animeId || selectedAnimeId || "";

    try {
      const sRes = await fetch(`/api/servers?id=${aId}&ep=${episode.slug}`);
      const sData = await sRes.json();
      if (sData?.success && Array.isArray(sData.data)) {
        setServers(sData.data);
        const firstServer = sData.data[0];
        setSelectedServerIndex(0);

        if (firstServer?.embedUrl) {
          setStreamUrl(firstServer.embedUrl);
        } else {
          const stRes = await fetch(`/api/stream?id=${aId}&ep=${episode.slug}&server=0`);
          const stData = await stRes.json();
          if (stData?.success && stData.data?.embedUrl) {
            setStreamUrl(stData.data.embedUrl);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    setPlayerLoading(false);
  };

  const handleServerChange = async (serverIndex: number, server: VideoServer) => {
    setSelectedServerIndex(serverIndex);
    setSelectedLang(null);
    if (server.embedUrl) {
      setStreamUrl(server.embedUrl);
    } else if (currentEpisode && selectedAnimeId) {
      setPlayerLoading(true);
      try {
        const res = await fetch(`/api/stream?id=${selectedAnimeId}&ep=${currentEpisode.slug}&server=${serverIndex}`);
        const stData = await res.json();
        if (stData?.success && stData.data?.embedUrl) {
          setStreamUrl(stData.data.embedUrl);
        }
      } catch (err) {
        console.error(err);
      }
      setPlayerLoading(false);
    }
  };

  // ==========================================
  // HUGE CONSOLE LOGIC & EXECUTION
  // ==========================================
  const runConsoleApi = async (overrideUrl?: string) => {
    const url = overrideUrl || consoleUrl;
    setConsoleLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(url);
      const data = await res.json();
      const duration = Math.round(performance.now() - start);

      const jsonString = JSON.stringify(data, null, 2);
      const sizeBytes = new Blob([jsonString]).size;
      const sizeFormatted =
        sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(1)} KB` : `${sizeBytes} B`;

      let summary = "";
      if (Array.isArray(data.data)) {
        summary = `${data.data.length} items`;
      } else if (data.data?.episodes) {
        summary = `${data.data.episodes.length} episodes`;
      } else if (data.data && typeof data.data === "object") {
        summary = `${Object.keys(data.data).length} properties`;
      }

      setConsoleStatus(res.status);
      setConsoleDuration(duration);
      setConsolePayloadSize(sizeFormatted);
      setConsoleResponse(data);
      setConsoleRawJson(jsonString);

      // Add to session log
      const newLog: RequestLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        endpoint: url,
        status: res.status,
        durationMs: duration,
        success: data.success ?? (res.status === 200),
        itemCount: summary,
      };
      setHistoryLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setConsoleStatus(500);
      setConsoleDuration(duration);
      setConsolePayloadSize("0 B");
      setConsoleResponse({ error: err.message });
      setConsoleRawJson(JSON.stringify({ error: err.message }, null, 2));

      const newLog: RequestLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        endpoint: url,
        status: 500,
        durationMs: duration,
        success: false,
        itemCount: "Error",
      };
      setHistoryLogs((prev) => [newLog, ...prev.slice(0, 49)]);
    }
    setConsoleLoading(false);
  };

  // Run Full System Health Diagnostics
  const runFullHealthCheck = async () => {
    setHealthRunning(true);
    setConsoleActiveTab("health");

    for (let i = 0; i < healthResults.length; i++) {
      const target = healthResults[i];
      setHealthResults((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: "loading" } : item))
      );

      const start = performance.now();
      try {
        const res = await fetch(target.endpoint);
        const data = await res.json();
        const duration = Math.round(performance.now() - start);

        let summary = "OK";
        if (Array.isArray(data.data)) {
          summary = `${data.data.length} items`;
        } else if (data.data?.episodes) {
          summary = `${data.data.episodes.length} eps (${data.data.seasons?.length || 1} seasons)`;
        } else if (data.data?.title) {
          summary = data.data.title;
        } else if (data.data?.embedUrl) {
          summary = "Embed URL found";
        }

        setHealthResults((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: data.success || res.status === 200 ? "pass" : "fail",
                  statusCode: res.status,
                  durationMs: duration,
                  resultSummary: summary,
                }
              : item
          )
        );
      } catch (err: any) {
        const duration = Math.round(performance.now() - start);
        setHealthResults((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "fail",
                  statusCode: 500,
                  durationMs: duration,
                  resultSummary: err.message,
                }
              : item
          )
        );
      }
    }
    setHealthRunning(false);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(consoleRawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([consoleRawJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `animesalt_${selectedEndpointId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Quick Preset Handlers
  const applyPresetAnime = (slug: string) => {
    setParamAnimeId(slug);
    setParamEpSlug(`${slug}-1x1`);
  };

  return (
    <div className="min-h-screen bg-[#090b11] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-50 bg-[#0f121d]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setMainView("browse");
                setSelectedAnimeId(null);
                setAnimeDetail(null);
                loadCategory("popular");
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  AnimeSalt <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono border border-indigo-500/30">API v2</span>
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  animesalt.cx connected
                </span>
              </div>
            </button>

            {/* Main Mode Toggle: Browse vs Huge Scraper Console */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setMainView("browse")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mainView === "browse"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Browse & Watch</span>
              </button>
              <button
                onClick={() => {
                  setMainView("console");
                  if (!consoleResponse) runConsoleApi();
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mainView === "console"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="flex items-center gap-1.5">
                  Live Scraper Studio
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                </span>
              </button>
            </div>
          </div>

          {/* Right Header: Search (in browse mode) or Health Button (in console mode) */}
          <div className="flex items-center gap-3">
            {mainView === "browse" ? (
              <form onSubmit={handleSearch} className="relative w-64 sm:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search anime (e.g. naruto)..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={runFullHealthCheck}
                  disabled={healthRunning}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Activity className={`w-4 h-4 ${healthRunning ? "animate-spin" : ""}`} />
                  <span>Run Full Health Check</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* VIEW 1: HUGE LIVE SCRAPER API STUDIO                                      */}
      {/* ========================================================================= */}
      {mainView === "console" && (
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 lg:p-6 gap-6">
          {/* Studio Top Control & Metrics Bar */}
          <div className="bg-[#121522] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  AnimeSalt Live Scraper Studio & API Diagnostic Console
                </h1>
                <p className="text-xs text-slate-400">
                  Real-time scraper inspector • 12 Production Endpoints • Upstream Target:{" "}
                  <code className="text-cyan-400 font-mono">https://animesalt.cx</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Status</span>
                  {consoleStatus ? (
                    <span className={`font-bold font-mono ${consoleStatus === 200 ? "text-emerald-400" : "text-rose-400"}`}>
                      {consoleStatus} {consoleStatus === 200 ? "OK" : "ERROR"}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono">IDLE</span>
                  )}
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Latency</span>
                  <span className="font-bold font-mono text-cyan-400">
                    {consoleDuration !== null ? `${consoleDuration}ms` : "--"}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-800"></div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Size</span>
                  <span className="font-bold font-mono text-indigo-400">{consolePayloadSize || "--"}</span>
                </div>
              </div>

              <button
                onClick={() => runConsoleApi()}
                disabled={consoleLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${consoleLoading ? "animate-spin" : ""}`} />
                <span>Execute Request</span>
              </button>
            </div>
          </div>

          {/* URL & Method Bar */}
          <div className="bg-[#121522] border border-slate-800/90 rounded-2xl p-3 flex items-center gap-3 shadow-md">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs border border-emerald-500/30">
              GET
            </span>
            <div className="flex-1 flex items-center bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
              <span className="text-slate-500 mr-1 select-none">http://localhost:3000</span>
              <span className="text-white font-semibold">{consoleUrl}</span>
            </div>
            <button
              onClick={() => runConsoleApi()}
              disabled={consoleLoading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Send
            </button>
          </div>

          {/* Studio Grid: Sidebar on Left, Content Studio on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6 flex-1 items-start">
            {/* Left: Interactive Endpoint Directory & Form Parameters */}
            <div className="bg-[#121522] border border-slate-800/90 rounded-2xl p-5 space-y-6 shadow-xl">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <ServerIcon className="w-4 h-4 text-indigo-400" /> Select API Endpoint
                </h3>

                <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                  {[
                    { id: "health", label: "/api/health", desc: "System Health & Ping", tag: "SYS" },
                    { id: "popular", label: "/api/popular", desc: "Top 50 Ranked Charts", tag: "HOT" },
                    { id: "latest", label: "/api/latest-episodes", desc: "Fresh Drops & Latest", tag: "NEW" },
                    { id: "ongoing", label: "/api/ongoing", desc: "Currently Airing Anime", tag: "PAGE" },
                    { id: "completed", label: "/api/completed", desc: "Completed Series Archive", tag: "PAGE" },
                    { id: "type", label: "/api/type/:type", desc: "Anime/Cartoon & Movies", tag: "PAGE" },
                    { id: "genre", label: "/api/genre/:category", desc: "Genre Filter (Action, etc)", tag: "PAGE" },
                    { id: "search", label: "/api/search", desc: "Keyword Search Engine", tag: "QUERY" },
                    { id: "info", label: "/api/info", desc: "Full Anime Metadata", tag: "ID" },
                    { id: "episodes", label: "/api/episodes/:id", desc: "Parallel Multi-Season Scraper", tag: "ID" },
                    { id: "servers", label: "/api/servers", desc: "Video Server Detector", tag: "STREAM" },
                    { id: "stream", label: "/api/stream", desc: "Embed Video Stream Resolver", tag: "STREAM" },
                  ].map((ep) => (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setSelectedEndpointId(ep.id);
                        setTimeout(() => runConsoleApi(), 50);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group ${
                        selectedEndpointId === ep.id
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "bg-slate-900/50 hover:bg-slate-800/80 text-slate-300"
                      }`}
                    >
                      <div>
                        <span className="font-mono text-xs font-semibold block group-hover:text-white">
                          {ep.label}
                        </span>
                        <span className={`text-[10px] block ${selectedEndpointId === ep.id ? "text-indigo-200" : "text-slate-500"}`}>
                          {ep.desc}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          selectedEndpointId === ep.id
                            ? "bg-indigo-900 text-indigo-200"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {ep.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Endpoint Parameters Customizer */}
              <div className="border-t border-slate-800 pt-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Endpoint Parameters
                </h3>

                {/* Popular Params */}
                {selectedEndpointId === "popular" && (
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Filter by Chart Type:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["all", "series", "movies"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setParamPopularType(t)}
                          className={`px-2 py-1 rounded text-xs font-medium capitalize cursor-pointer ${
                            paramPopularType === t ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Params */}
                {selectedEndpointId === "search" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Keyword Query:</label>
                      <input
                        type="text"
                        value={paramSearch}
                        onChange={(e) => setParamSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Quick Sample Keywords:</span>
                      <div className="flex flex-wrap gap-1">
                        {["naruto", "solo leveling", "bleach", "one piece", "demon slayer"].map((kw) => (
                          <button
                            key={kw}
                            onClick={() => setParamSearch(kw)}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] text-indigo-300 cursor-pointer"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Type Params */}
                {selectedEndpointId === "type" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Category:</label>
                        <select
                          value={paramTypeCategory}
                          onChange={(e) => setParamTypeCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                        >
                          <option value="anime">anime</option>
                          <option value="cartoon">cartoon</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Subtype:</label>
                        <select
                          value={paramTypeSubtype}
                          onChange={(e) => setParamTypeSubtype(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                        >
                          <option value="series">series</option>
                          <option value="movies">movies</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Genre Params */}
                {selectedEndpointId === "genre" && (
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400 block">Genre Slug:</label>
                    <input
                      type="text"
                      value={paramGenre}
                      onChange={(e) => setParamGenre(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["action", "comedy", "fantasy", "shounen", "adventure", "romance", "supernatural"].map((g) => (
                        <button
                          key={g}
                          onClick={() => setParamGenre(g)}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] text-cyan-300 cursor-pointer"
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anime Slug Params for Info & Episodes */}
                {(selectedEndpointId === "info" ||
                  selectedEndpointId === "episodes" ||
                  selectedEndpointId === "servers" ||
                  selectedEndpointId === "stream") && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Anime Slug (ID):</label>
                      <input
                        type="text"
                        value={paramAnimeId}
                        onChange={(e) => setParamAnimeId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Sample Anime:</span>
                      <div className="flex flex-wrap gap-1">
                        {["naruto", "naruto-shippuden", "jujutsu-kaisen", "one-piece", "solo-leveling"].map((s) => (
                          <button
                            key={s}
                            onClick={() => applyPresetAnime(s)}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] text-indigo-300 cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedEndpointId === "episodes" && (
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Season Filter:</label>
                        <select
                          value={paramSeason}
                          onChange={(e) => setParamSeason(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                        >
                          <option value="all">All Seasons (Parallel Scraped)</option>
                          <option value="1">Season 1</option>
                          <option value="2">Season 2</option>
                          <option value="3">Season 3</option>
                          <option value="4">Season 4</option>
                          <option value="5">Season 5</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Episode & Streaming Specific Params */}
                {(selectedEndpointId === "servers" || selectedEndpointId === "stream") && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Episode Slug (ep):</label>
                      <input
                        type="text"
                        value={paramEpSlug}
                        onChange={(e) => setParamEpSlug(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    {selectedEndpointId === "stream" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Server Index:</label>
                          <input
                            type="text"
                            value={paramServerIdx}
                            onChange={(e) => setParamServerIdx(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">Audio Language:</label>
                          <input
                            type="text"
                            value={paramAudioLang}
                            onChange={(e) => setParamAudioLang(e.target.value)}
                            placeholder="e.g. English"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination input for list routes */}
                {(selectedEndpointId === "search" ||
                  selectedEndpointId === "ongoing" ||
                  selectedEndpointId === "completed" ||
                  selectedEndpointId === "type" ||
                  selectedEndpointId === "genre") && (
                  <div className="flex items-center justify-between pt-2">
                    <label className="text-[11px] text-slate-400">Page Number:</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setParamPage((p) => Math.max(1, p - 1))}
                        disabled={paramPage <= 1}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs text-white font-bold w-6 text-center">{paramPage}</span>
                      <button
                        onClick={() => setParamPage((p) => p + 1)}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Response Studio Tabs */}
            <div className="bg-[#121522] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[600px]">
              {/* Studio Tabs Header */}
              <div className="border-b border-slate-800 px-5 py-3 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "visual", label: "Visual Preview", icon: Eye },
                    { id: "json", label: "Raw JSON", icon: Code },
                    { id: "code", label: "Client Code (cURL/Fetch)", icon: Terminal },
                    { id: "health", label: "Health Diagnostic Suite", icon: Activity },
                    { id: "history", label: `History (${historyLogs.length})`, icon: Clock },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setConsoleActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          consoleActiveTab === tab.id
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Action Icons for JSON */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyJson}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={downloadJson}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Visual Preview */}
              {consoleActiveTab === "visual" && (
                <div className="p-6 overflow-y-auto max-h-[640px] flex-1">
                  {consoleLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-indigo-400">
                      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Scraping from animesalt.cx...</span>
                    </div>
                  ) : !consoleResponse ? (
                    <div className="text-center py-24 text-slate-500 space-y-2">
                      <Zap className="w-10 h-10 mx-auto stroke-1" />
                      <p className="text-sm">Click "Execute Request" above to scrape and preview live data.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Health Response Preview */}
                      {selectedEndpointId === "health" && consoleResponse.upstream && (
                        <div className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                              Scraper Health: {consoleResponse.status?.toUpperCase()}
                            </span>
                            <span className="text-xs font-mono text-slate-400">{consoleResponse.timestamp}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-500 block uppercase font-bold">Upstream Source</span>
                              <span className="font-mono text-xs text-indigo-300">{consoleResponse.upstream.source}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-500 block uppercase font-bold">Upstream Ping</span>
                              <span className="font-mono text-xs text-emerald-400">
                                {consoleResponse.upstream.online ? "ONLINE" : "OFFLINE"} ({consoleResponse.upstream.latencyMs}ms)
                              </span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-500 block uppercase font-bold">Uptime</span>
                              <span className="font-mono text-xs text-white">{consoleResponse.uptime}s</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-500 block uppercase font-bold">API Version</span>
                              <span className="font-mono text-xs text-cyan-400">{consoleResponse.version}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Anime List Grid (Popular, Latest, Ongoing, Completed, Search, Genre, Type) */}
                      {Array.isArray(consoleResponse.data) && consoleResponse.data.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Returned {consoleResponse.data.length} Scraped Items</span>
                            <span className="font-mono text-slate-500">Live Scraped Data</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {consoleResponse.data.map((item: AnimeItem, idx: number) => (
                              <div
                                key={idx}
                                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl overflow-hidden shadow-md flex flex-col justify-between group transition-all"
                              >
                                <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                                      <Film className="w-8 h-8" />
                                    </div>
                                  )}
                                  {item.rank && (
                                    <span className="absolute top-2 left-2 bg-indigo-600 text-white font-black text-xs px-2 py-0.5 rounded shadow">
                                      #{item.rank}
                                    </span>
                                  )}
                                  {item.quality && (
                                    <span className="absolute top-2 right-2 bg-black/80 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                                      {item.quality}
                                    </span>
                                  )}
                                </div>
                                <div className="p-2.5">
                                  <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-indigo-300">
                                    {item.title}
                                  </h4>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                                    <span>{item.type || "series"}</span>
                                    <button
                                      onClick={() => {
                                        setParamAnimeId(item.id);
                                        setParamEpSlug(`${item.id}-1x1`);
                                        setSelectedEndpointId("info");
                                      }}
                                      className="text-indigo-400 hover:text-indigo-300 cursor-pointer underline"
                                    >
                                      Test Info
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Anime Details View Preview */}
                      {selectedEndpointId === "info" && consoleResponse.data?.title && (
                        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-6">
                          <div className="flex flex-col sm:flex-row gap-5">
                            {consoleResponse.data.poster && (
                              <img
                                src={consoleResponse.data.poster}
                                alt={consoleResponse.data.title}
                                className="w-28 h-40 object-cover rounded-xl shadow-lg border border-slate-800 flex-shrink-0"
                              />
                            )}
                            <div className="space-y-2">
                              <h2 className="text-2xl font-black text-white">{consoleResponse.data.title}</h2>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                                  {consoleResponse.data.type}
                                </span>
                                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {consoleResponse.data.totalEpisodes} Total Episodes
                                </span>
                                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {consoleResponse.data.seasons?.length || 0} Seasons
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed pt-2">
                                {consoleResponse.data.description || "No description found."}
                              </p>
                              {consoleResponse.data.genres && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {consoleResponse.data.genres.map((g: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-400">
                                      {g}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button: Test Episodes */}
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => {
                                setSelectedEndpointId("episodes");
                              }}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Scrape All Episodes for this Title »
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Episodes List View Preview */}
                      {selectedEndpointId === "episodes" && consoleResponse.data?.episodes && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white">
                              Total Scraped Episodes: {consoleResponse.data.episodes.length} (Seasons:{" "}
                              {consoleResponse.data.seasons?.length || 1})
                            </span>
                            <span className="text-slate-400 font-mono">Current Filter: {consoleResponse.data.currentSeason}</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                            {consoleResponse.data.episodes.map((ep: Episode) => (
                              <div
                                key={ep.slug}
                                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-[10px] text-indigo-400 font-bold">
                                    S{ep.season} E{ep.num}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setParamEpSlug(ep.slug);
                                      setSelectedEndpointId("servers");
                                    }}
                                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 hover:bg-slate-700 cursor-pointer"
                                  >
                                    Get Servers
                                  </button>
                                </div>
                                <span className="text-xs font-medium text-slate-200 line-clamp-1">{ep.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Video Servers View Preview */}
                      {selectedEndpointId === "servers" && Array.isArray(consoleResponse.data) && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-bold text-white">Detected Video Servers ({consoleResponse.data.length})</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {consoleResponse.data.map((s: VideoServer, sIdx: number) => (
                              <div key={sIdx} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-white flex items-center gap-2">
                                    <ServerIcon className="w-4 h-4 text-indigo-400" />
                                    {s.serverName}
                                  </span>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                                    Index #{s.index}
                                  </span>
                                </div>

                                <div className="p-2 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-300 break-all">
                                  {s.embedUrl || "Dynamic embed (click stream to resolve)"}
                                </div>

                                {s.isMultiLang && s.languages?.length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                      Decoded Audio Languages:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {s.languages.map((l, lIdx) => (
                                        <span
                                          key={lIdx}
                                          className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800/40"
                                        >
                                          {l.language}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2 flex justify-end">
                                  <button
                                    onClick={() => {
                                      setParamServerIdx(String(s.index));
                                      setSelectedEndpointId("stream");
                                    }}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    Test Stream Embed »
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stream Embed Player Preview */}
                      {selectedEndpointId === "stream" && consoleResponse.data?.embedUrl && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                              Live Stream Embed Player Preview
                            </h3>
                            <span className="text-xs font-mono text-emerald-400">Embed URL Verified</span>
                          </div>

                          <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                            <iframe
                              src={consoleResponse.data.embedUrl}
                              className="w-full h-full border-0"
                              allowFullScreen
                            ></iframe>
                          </div>

                          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 break-all">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Iframe Source URL:</span>
                            {consoleResponse.data.embedUrl}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Raw JSON Explorer */}
              {consoleActiveTab === "json" && (
                <div className="p-4 flex flex-col flex-1 overflow-hidden space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={jsonSearchQuery}
                      onChange={(e) => setJsonSearchQuery(e.target.value)}
                      placeholder="Search inside JSON response..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  <pre className="p-4 bg-[#080a10] border border-slate-800/80 rounded-xl overflow-auto font-mono text-xs text-slate-300 leading-relaxed flex-1 max-h-[520px] select-text">
                    {consoleRawJson || "// No response yet. Click Execute Request to fetch."}
                  </pre>
                </div>
              )}

              {/* Tab 3: Client Code Snippets */}
              {consoleActiveTab === "code" && (
                <div className="p-6 space-y-6 overflow-y-auto max-h-[600px] flex-1">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400" /> cURL Command
                    </h4>
                    <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-cyan-300 overflow-x-auto">
                      curl -X GET "http://localhost:3000{consoleUrl}"
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4 text-emerald-400" /> JavaScript (Fetch API)
                    </h4>
                    <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto">
{`const response = await fetch("http://localhost:3000${consoleUrl}");
const data = await response.json();
console.log(data);`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> Python (Requests)
                    </h4>
                    <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-300 overflow-x-auto">
{`import requests

url = "http://localhost:3000${consoleUrl}"
response = requests.get(url)
data = response.json()
print(data)`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab 4: Health Diagnostics Suite */}
              {consoleActiveTab === "health" && (
                <div className="p-6 space-y-4 overflow-y-auto max-h-[600px] flex-1">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Full System Health & Scraper Benchmark
                      </h3>
                      <p className="text-xs text-slate-400">
                        Validates that all 12 backend scraper routes are responding with 200 OK.
                      </p>
                    </div>
                    <button
                      onClick={runFullHealthCheck}
                      disabled={healthRunning}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {healthRunning ? "Running Diagnostics..." : "Run Test Suite"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {healthResults.map((hr, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          {hr.status === "pass" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {hr.status === "fail" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                          {hr.status === "loading" && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />}
                          {hr.status === "idle" && <Clock className="w-4 h-4 text-slate-600" />}
                          <div>
                            <span className="font-bold text-white block">{hr.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{hr.endpoint}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {hr.resultSummary && (
                            <span className="text-[11px] text-slate-400">{hr.resultSummary}</span>
                          )}
                          {hr.durationMs !== undefined && (
                            <span className="font-mono text-cyan-400 text-[11px]">{hr.durationMs}ms</span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              hr.status === "pass"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : hr.status === "fail"
                                ? "bg-rose-950 text-rose-400 border border-rose-800"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {hr.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Request History Logs */}
              {consoleActiveTab === "history" && (
                <div className="p-6 space-y-4 overflow-y-auto max-h-[600px] flex-1">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Live Execution History ({historyLogs.length})</span>
                    <button
                      onClick={() => setHistoryLogs([])}
                      className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Clear History
                    </button>
                  </div>

                  {historyLogs.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs">
                      No requests logged yet. Execute an endpoint to begin logging.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {historyLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                log.success ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                            ></span>
                            <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                            <span className="font-mono text-xs text-white font-semibold">{log.endpoint}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {log.itemCount && <span className="text-[10px] text-slate-400">{log.itemCount}</span>}
                            <span className="font-mono text-cyan-400 text-[11px]">{log.durationMs}ms</span>
                            <button
                              onClick={() => {
                                setConsoleUrl(log.endpoint);
                                runConsoleApi(log.endpoint);
                              }}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] cursor-pointer"
                            >
                              Replay
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ANIME BROWSE & STREAMING PLAYER                                   */}
      {/* ========================================================================= */}
      {mainView === "browse" && (
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex-1 w-full">
          {/* Subheader: Category Pills in Browse Mode */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <nav className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
              {[
                { id: "popular", label: "Popular", icon: Flame },
                { id: "latest", label: "Latest", icon: Sparkles },
                { id: "ongoing", label: "Ongoing", icon: Radio },
                { id: "completed", label: "Completed", icon: CheckCircle2 },
                { id: "movies", label: "Movies", icon: Film },
                { id: "cartoons", label: "Cartoons", icon: Tv },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id && !selectedAnimeId;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedAnimeId(null);
                      setActiveTab(tab.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/50"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => {
                setMainView("console");
                if (!consoleResponse) runConsoleApi();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Switch to Live Scraper Studio</span>
            </button>
          </div>

          {/* If an anime is selected, display the Player & Details View */}
          {selectedAnimeId && animeDetail ? (
            <div className="space-y-8 animate-fadeIn">
              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedAnimeId(null);
                  setAnimeDetail(null);
                  setStreamUrl(null);
                }}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-900/60 hover:bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-800"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Catalog
              </button>

              {/* Video Player Section */}
              <div className="bg-[#121522] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                  {playerLoading ? (
                    <div className="flex flex-col items-center gap-3 text-indigo-400">
                      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <span className="text-xs font-medium">Resolving video stream embed...</span>
                    </div>
                  ) : streamUrl ? (
                    <iframe
                      src={streamUrl}
                      className="w-full h-full border-0"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Play className="w-12 h-12 stroke-[1.5]" />
                      <span className="text-sm">Select an episode below to start watching</span>
                    </div>
                  )}
                </div>

                {/* Server & Audio Language Controls */}
                <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" /> Servers:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {servers.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleServerChange(idx, s)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            selectedServerIndex === idx
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          }`}
                        >
                          {s.serverName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multi-Language Audio Selection if available */}
                  {servers[selectedServerIndex]?.isMultiLang && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-cyan-400" /> Audio:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {servers[selectedServerIndex].languages.map((l, lIdx) => (
                          <button
                            key={lIdx}
                            onClick={() => {
                              setSelectedLang(l.language);
                              setStreamUrl(l.link);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              selectedLang === l.language
                                ? "bg-cyan-600 text-white shadow-sm"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                            }`}
                          >
                            {l.language}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Anime Info & Episodes Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Episodes List (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-400" />
                      Episodes ({episodes.length})
                    </h3>
                  </div>

                  {/* Season Tabs */}
                  {animeDetail.seasons && animeDetail.seasons.length > 1 && (
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
                      {animeDetail.seasons.map((season) => (
                        <button
                          key={season.num}
                          onClick={() => handleSeasonChange(season.num)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            selectedSeason === season.num
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {season.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Episode Pills Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {episodes.map((ep) => {
                      const isSelected = currentEpisode?.slug === ep.slug;
                      return (
                        <button
                          key={ep.slug}
                          onClick={() => playEpisode(ep)}
                          className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500"
                              : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`text-[11px] font-mono font-bold ${isSelected ? "text-indigo-400" : "text-slate-500"}`}>
                              EP {ep.num}
                            </span>
                            <Play className={`w-3 h-3 ${isSelected ? "text-indigo-400 fill-indigo-400" : "opacity-0"}`} />
                          </div>
                          <span className="text-xs font-medium line-clamp-1">{ep.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Anime Metadata Sidebar */}
                <div className="bg-[#121522] border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex gap-4">
                    {animeDetail.poster && (
                      <img
                        src={animeDetail.poster}
                        alt={animeDetail.title}
                        className="w-24 h-36 object-cover rounded-xl shadow-md flex-shrink-0"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-white mb-2">{animeDetail.title}</h2>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
                          {animeDetail.type || "Series"}
                        </span>
                        {animeDetail.totalEpisodes > 0 && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {animeDetail.totalEpisodes} Episodes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {animeDetail.description && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Synopsis</h4>
                      <p className="text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
                        {animeDetail.description}
                      </p>
                    </div>
                  )}

                  {animeDetail.genres && animeDetail.genres.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Genres</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {animeDetail.genres.map((g, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Catalog View (Grid of Anime Cards) */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white capitalize flex items-center gap-2">
                    {activeTab === "popular" && <Flame className="w-6 h-6 text-amber-500" />}
                    {activeTab === "latest" && <Sparkles className="w-6 h-6 text-indigo-400" />}
                    {activeTab === "ongoing" && <Radio className="w-6 h-6 text-emerald-400" />}
                    {activeTab === "completed" && <CheckCircle2 className="w-6 h-6 text-blue-400" />}
                    {activeTab === "movies" && <Film className="w-6 h-6 text-purple-400" />}
                    {activeTab === "cartoons" && <Tv className="w-6 h-6 text-pink-400" />}
                    {activeTab === "search" && <Search className="w-6 h-6 text-cyan-400" />}
                    {activeTab === "search" ? `Search: "${searchQuery}"` : activeTab.replace("-", " ")}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Scraped in real-time from animesalt.cx • {items.length} titles loaded
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-slate-900 rounded-2xl aspect-[2/3] animate-pulse border border-slate-800"></div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                  <Info className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-300">No anime found</h3>
                  <p className="text-xs text-slate-500 mt-1">Try another search keyword or switch categories.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectAnime(item)}
                      className="group relative bg-[#121522] border border-slate-800 hover:border-indigo-500/60 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700">
                            <Film className="w-8 h-8" />
                          </div>
                        )}

                        {/* Rank badge for popular */}
                        {item.rank && (
                          <span className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-indigo-600/90 backdrop-blur-md text-white font-black text-xs flex items-center justify-center shadow-md">
                            #{item.rank}
                          </span>
                        )}

                        {/* Quality badge */}
                        {item.quality && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-amber-400 font-bold text-[10px] border border-amber-500/30">
                            {item.quality}
                          </span>
                        )}

                        {/* Play hover overlay */}
                        <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-6 h-6 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Metadata Card Footer */}
                      <div className="p-3">
                        <h3 className="text-xs font-bold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                          <span>{item.type || "Series"}</span>
                          {item.year && <span>{item.year}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
