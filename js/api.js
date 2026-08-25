/**
 * api.js — Όλα τα TMDB API calls
 *
 * Endpoints που χρησιμοποιούμε:
 *   /trending/all/week        → hero + discover grid
 *   /movie/popular            → popular movies
 *   /tv/popular               → popular TV
 *   /search/multi             → search
 *   /genre/movie/list         → genres
 *   /genre/tv/list
 *   /movie/{id}               → movie details
 *   /tv/{id}                  → TV details
 *   /tv/{id}/season/{n}       → episodes για season
 *   /movie/{id}/credits       → cast
 *   /tv/{id}/credits
 */

const API = (() => {

  const { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE, IMG,
          DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } = CONFIG;

  // ── Core fetch ────────────────────────────────────
  async function fetchTMDB(endpoint, params = {}) {
    if (!TMDB_API_KEY || TMDB_API_KEY.includes('ΔΩΣ')) {
      throw new Error('NO_API_KEY');
    }
    const url = new URL(TMDB_BASE_URL + endpoint);
    url.searchParams.set('api_key', TMDB_API_KEY);
    url.searchParams.set('language', DEFAULT_LANGUAGE);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`);
    return res.json();
  }

  // ── Image helpers ─────────────────────────────────
  function posterUrl(path, size = IMG.POSTER_MD) {
    return path ? `${TMDB_IMAGE_BASE}${size}${path}` : null;
  }
  function backdropUrl(path, size = IMG.BACKDROP_LG) {
    return path ? `${TMDB_IMAGE_BASE}${size}${path}` : null;
  }
  function faceUrl(path) {
    return path ? `${TMDB_IMAGE_BASE}${IMG.FACE}${path}` : null;
  }

  // ── Normalise movie/TV to common shape ────────────
  function normalise(item) {
    const isMovie = item.media_type === 'movie' || item.title !== undefined;
    return {
      id:          item.id,
      type:        isMovie ? 'movie' : 'tv',
      title:       item.title || item.name || '—',
      year:        (item.release_date || item.first_air_date || '').slice(0, 4),
      overview:    item.overview || '',
      rating:      item.vote_average ? item.vote_average.toFixed(1) : null,
      posterPath:  item.poster_path,
      backdropPath: item.backdrop_path,
      poster:      posterUrl(item.poster_path),
      backdrop:    backdropUrl(item.backdrop_path),
      genreIds:    item.genre_ids || [],
      popularity:  item.popularity || 0,
      // TV-only
      seasons:     item.number_of_seasons,
    };
  }

  // ── Discover / Trending ───────────────────────────
  async function getTrending(page = 1) {
    const data = await fetchTMDB('/trending/all/week', { page });
    return {
      results: data.results.map(normalise),
      total_pages: data.total_pages,
      page: data.page,
    };
  }

  async function getPopularMovies(page = 1) {
    const data = await fetchTMDB('/movie/popular', { page });
    return {
      results: data.results.map(i => normalise({ ...i, media_type: 'movie' })),
      total_pages: data.total_pages,
    };
  }

  async function getPopularTV(page = 1) {
    const data = await fetchTMDB('/tv/popular', { page });
    return {
      results: data.results.map(i => normalise({ ...i, media_type: 'tv' })),
      total_pages: data.total_pages,
    };
  }

  // ── Search ────────────────────────────────────────
  async function search(query, page = 1) {
    if (!query.trim()) return { results: [], total_pages: 0 };
    const data = await fetchTMDB('/search/multi', { query, page });
    return {
      results: data.results
        .filter(i => i.media_type === 'movie' || i.media_type === 'tv')
        .map(normalise),
      total_pages: data.total_pages,
    };
  }

// ── Genres ───────────────────────────────────────
  async function getGenres() {
    const [movies, tv] = await Promise.all([
      fetchTMDB('/genre/movie/list'),
      fetchTMDB('/genre/tv/list'),
    ]);
    
    const movieGenres = {};
    const tvGenres = {};
    const allGenres = {};

    // Φτιάχνουμε τις λίστες ξεχωριστά
    movies.genres.forEach(g => { 
      movieGenres[g.id] = g.name; 
      allGenres[g.id] = g.name;
    });
    
    tv.genres.forEach(g => { 
      tvGenres[g.id] = g.name; 
      allGenres[g.id] = g.name;
    });

    // Επιστρέφουμε και τις 3 ομάδες
    return {
      movie: movieGenres,
      tv: tvGenres,
      all: allGenres
    };
  }

 // ── Details ───────────────────────────────────────
  async function getMovieDetails(id) {
    const [details, credits] = await Promise.all([
      fetchTMDB(`/movie/${id}`, { append_to_response: 'videos,watch/providers' }), // Προσθήκη watch/providers
      fetchTMDB(`/movie/${id}/credits`),
    ]);
    
    // Ψάχνουμε τις πλατφόρμες streaming (flatrate) για Ελλάδα (GR)
    const providersGR = details['watch/providers']?.results?.GR?.flatrate || [];

    return {
      ...normalise({ ...details, media_type: 'movie' }),
      tagline:    details.tagline || '',
      runtime:    details.runtime ? `${details.runtime} λεπτά` : null,
      genres:     details.genres || [],
      production: (details.production_companies || []).map(c => c.name).slice(0, 3),
      cast:       (credits.cast || []).slice(0, 12).map(p => ({
        id:        p.id,
        name:      p.name,
        character: p.character,
        photo:     faceUrl(p.profile_path),
      })),
      // Προσθήκη των providers στο object
      providers:  providersGR.map(p => ({
        name: p.provider_name,
        logo: posterUrl(p.logo_path, 'w92') // Χρησιμοποιούμε μικρό μέγεθος εικόνας
      })),
    };
  }

  async function getTVDetails(id) {
    const [details, credits] = await Promise.all([
      fetchTMDB(`/tv/${id}`, { append_to_response: 'watch/providers' }), // Προσθήκη watch/providers
      fetchTMDB(`/tv/${id}/credits`),
    ]);
    
    // Ψάχνουμε τις πλατφόρμες streaming (flatrate) για Ελλάδα (GR)
    const providersGR = details['watch/providers']?.results?.GR?.flatrate || [];

    return {
      ...normalise({ ...details, media_type: 'tv' }),
      tagline:      details.tagline || '',
      status:       details.status || '',
      genres:       details.genres || [],
      numberOfSeasons:  details.number_of_seasons || 0,
      numberOfEpisodes: details.number_of_episodes || 0,
      seasons:      (details.seasons || []).filter(s => s.season_number > 0),
      networks:     (details.networks || []).map(n => n.name).slice(0, 2),
      cast:         (credits.cast || []).slice(0, 12).map(p => ({
        id:        p.id,
        name:      p.name,
        character: p.character,
        photo:     faceUrl(p.profile_path),
      })),
      // Προσθήκη των providers στο object
      providers:  providersGR.map(p => ({
        name: p.provider_name,
        logo: posterUrl(p.logo_path, 'w92')
      })),
    };
  }

  
  // ── Discover with filters (genre, sort) ──────────
  async function discoverMovies({ genre, sort = 'popularity.desc', page = 1 } = {}) {
    const params = { sort_by: sort, page };
    if (genre && genre !== 'all') params.with_genres = genre;
    const data = await fetchTMDB('/discover/movie', params);
    return {
      results: data.results.map(i => normalise({ ...i, media_type: 'movie' })),
      total_pages: data.total_pages,
    };
  }

  async function discoverTV({ genre, sort = 'popularity.desc', page = 1 } = {}) {
    const params = { sort_by: sort, page };
    if (genre && genre !== 'all') params.with_genres = genre;
    const data = await fetchTMDB('/discover/tv', params);
    return {
      results: data.results.map(i => normalise({ ...i, media_type: 'tv' })),
      total_pages: data.total_pages,
    };
  }

  // ── Fetch by IDs (for watchlist/watched views) ────
  async function getMovieById(id) { return getMovieDetails(id); }
  async function getTVById(id)    { return getTVDetails(id); }

  return {
    getTrending, getPopularMovies, getPopularTV,
    search, getGenres,
    getMovieDetails, getTVDetails, getSeasonEpisodes,
    discoverMovies, discoverTV,
    getMovieById, getTVById,
    posterUrl, backdropUrl,
  };

})();
