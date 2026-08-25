/**
 * storage.js — Διαχείριση localStorage για watched & watchlist
 *
 * Δομή:
 *   wv_watched    → { "movie_123": true, "tv_456": true }
 *   wv_watchlist  → { "movie_789": true }
 *   wv_episodes   → { "tv_456_s1e3": true, "tv_456_s1e4": true }
 *   wv_progress   → { "tv_456": { season: 2, episode: 5 } }
 */

const Storage = (() => {

  const key = (suffix) => CONFIG.LS_PREFIX + suffix;

  // ── Helpers ──────────────────────────────────────
  function load(k) {
    try { return JSON.parse(localStorage.getItem(key(k))) || {}; }
    catch { return {}; }
  }
  function save(k, data) {
    try { localStorage.setItem(key(k), JSON.stringify(data)); }
    catch (e) { console.warn('Storage full:', e); }
  }

  function mediaKey(type, id) { return `${type}_${id}`; }
  function episodeKey(tvId, season, episode) { return `tv_${tvId}_s${season}e${episode}`; }

  // ── WATCHED ──────────────────────────────────────
  function isWatched(type, id) {
    return !!load('watched')[mediaKey(type, id)];
  }
  function setWatched(type, id, val = true) {
    const d = load('watched');
    if (val) d[mediaKey(type, id)] = true;
    else delete d[mediaKey(type, id)];
    save('watched', d);
  }
  function toggleWatched(type, id) {
    const was = isWatched(type, id);
    setWatched(type, id, !was);
    return !was;
  }
  function getWatchedIds() { return load('watched'); }

  // ── WATCHLIST ─────────────────────────────────────
  function isInWatchlist(type, id) {
    return !!load('watchlist')[mediaKey(type, id)];
  }
  function setWatchlist(type, id, val = true) {
    const d = load('watchlist');
    if (val) d[mediaKey(type, id)] = true;
    else delete d[mediaKey(type, id)];
    save('watchlist', d);
  }
  function toggleWatchlist(type, id) {
    const was = isInWatchlist(type, id);
    setWatchlist(type, id, !was);
    return !was;
  }
  function getWatchlistIds() { return load('watchlist'); }

  // ── EPISODES ──────────────────────────────────────
  function isEpisodeWatched(tvId, season, episode) {
    return !!load('episodes')[episodeKey(tvId, season, episode)];
  }
  function toggleEpisode(tvId, season, episode) {
    const d = load('episodes');
    const k = episodeKey(tvId, season, episode);
    if (d[k]) delete d[k];
    else d[k] = true;
    save('episodes', d);
    return !!d[k];
  }
  function getWatchedEpisodesForShow(tvId) {
    const d = load('episodes');
    const prefix = `tv_${tvId}_`;
    return Object.keys(d).filter(k => k.startsWith(prefix));
  }

  // ── PROGRESS (last watched season/ep) ────────────
  function saveProgress(tvId, season, episode) {
    const d = load('progress');
    d[`tv_${tvId}`] = { season, episode, ts: Date.now() };
    save('progress', d);
  }
  function getProgress(tvId) {
    return load('progress')[`tv_${tvId}`] || null;
  }

  // ── COUNTS (for UI badges) ────────────────────────
  function watchedCount()   { return Object.keys(load('watched')).length; }
  function watchlistCount() { return Object.keys(load('watchlist')).length; }

  // ── EXPORT ───────────────────────────────────────
  return {
    isWatched, setWatched, toggleWatched, getWatchedIds,
    isInWatchlist, setWatchlist, toggleWatchlist, getWatchlistIds,
    isEpisodeWatched, toggleEpisode, getWatchedEpisodesForShow,
    saveProgress, getProgress,
    watchedCount, watchlistCount,
  };

})();