/**
 * config.js — API keys, base URLs, constants
 *
 * ⚠️  TMDB API Key:
 *   1. Πήγαινε στο https://www.themoviedb.org/ → Settings → API
 *   2. Βάλε το κλειδί σου στο TMDB_API_KEY παρακάτω
 *   3. ΠΟΤΕ μην ανεβάσεις αυτό το αρχείο δημόσια με το κλειδί σου!
 */

const CONFIG = {

  // ── TMDB ──────────────────────────────────────────
  TMDB_API_KEY:  'e57a4ef6bc85d0408c926e152f3269bb',   // ← αντικατέστησε
  TMDB_BASE_URL: 'https://api.themoviedb.org/3',
  TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p/',

  // Poster / Backdrop sizes (TMDB standard)
  IMG: {
    POSTER_SM:   'w185',
    POSTER_MD:   'w342',
    POSTER_LG:   'w500',
    BACKDROP_SM: 'w780',
    BACKDROP_LG: 'w1280',
    FACE:        'w185',
  },

  // ── App defaults ──────────────────────────────────
  DEFAULT_LANGUAGE: 'el-GR',   // Greek UI labels από TMDB όπου διαθέσιμα
  FALLBACK_LANGUAGE: 'en-US',  // fallback αν δεν υπάρχει ελληνική μετάφραση
  ITEMS_PER_PAGE: 20,

  // Hero auto-rotate interval (ms)
  HERO_INTERVAL: 7000,

  // LocalStorage keys (prefix για collision avoidance)
  LS_PREFIX: 'wv_',
};
