/**
 * app.js — Main controller
 * Διαχειρίζεται views, navigation, search, filters, pagination
 */

const App = (() => {

  // ── State ─────────────────────────────────────────
  let state = {
    view:       'discover',   // 'discover' | 'watchlist' | 'watched'
    typeFilter: 'all',        // 'all' | 'movie' | 'tv'
    genre:      'all',
    sort:       'popularity',
    query:      '',
    page:       1,
    totalPages: 1,
    genreMap:   {},
    loading:    false,
  };

  // ── Sort map to TMDB param ─────────────────────────
  const SORT_MAP = {
    popularity: 'popularity.desc',
    rating:     'vote_average.desc',
    year_desc:  'primary_release_date.desc',
    year_asc:   'primary_release_date.asc',
    title:      'original_title.asc',
  };

 // ── Init ──────────────────────────────────────────
  async function init() {
    setupNavigation();
    setupSearch();
    setupFilters();
    setupLoadMore();

    try {
      state.genreMap = await API.getGenres();
      // ΑΛΛΑΓΗ ΕΔΩ: Ζητάμε το state.genreMap.all αντί για σκέτο state.genreMap
      UI.buildGenrePills(state.genreMap.all);
      setupGenreFilter();
    } catch {}

    await loadView();
  }

  // ── Navigation ────────────────────────────────────
  function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.view = btn.dataset.view;
        state.page = 1;
        state.query = '';
        document.getElementById('searchInput').value = '';
        const hero = document.getElementById('heroStrip');
        hero.style.display = state.view === 'discover' ? '' : 'none';
        loadView();
      });
    });
  }

  // ── Search ────────────────────────────────────────
  let searchTimer;
  function setupSearch() {
    const input = document.getElementById('searchInput');
    input.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        state.query = input.value.trim();
        state.page  = 1;
        loadView();
      }, 400);
    });
  }

  // ── Filters ───────────────────────────────────────
  function setupFilters() {
    // Filter toggle
    const btn = document.getElementById('filterToggle');
    const bar = document.getElementById('filterBar');
    btn.addEventListener('click', () => {
      bar.classList.toggle('open');
      btn.classList.toggle('open');
    });

  // Type pills
    document.getElementById('typeFilter').addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      
      document.querySelectorAll('#typeFilter .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      state.typeFilter = pill.dataset.type;
      
      // ΝΕΟΣ ΚΩΔΙΚΑΣ: Ανανέωση των κατηγοριών με βάση το νέο τύπο
      const currentGenres = state.genreMap[state.typeFilter];
      UI.buildGenrePills(currentGenres);
      
      // Αν το είδος που είχαμε επιλέξει πριν δεν υποστηρίζεται στη νέα λίστα (π.χ. Τρόμου στις σειρές), το κάνουμε reset σε 'all'
      if (state.genre !== 'all' && !currentGenres[state.genre]) {
         state.genre = 'all';
      } else if (state.genre !== 'all') {
         // Αν το είδος υποστηρίζεται ακόμα (π.χ. Δράση), το κάνουμε ξανά visually active
         setTimeout(() => {
           const activePill = document.querySelector(`#genreFilter .pill[data-genre="${state.genre}"]`);
           if (activePill) {
             document.querySelectorAll('#genreFilter .pill').forEach(p => p.classList.remove('active'));
             activePill.classList.add('active');
           }
         }, 0);
      }
      
      state.page = 1;
      loadView();
    });

    // Sort select
    document.getElementById('sortSelect').addEventListener('change', (e) => {
      state.sort = e.target.value;
      state.page = 1;
      loadView();
    });
  }

  function setupGenreFilter() {
    document.getElementById('genreFilter').addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      document.querySelectorAll('#genreFilter .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.genre = pill.dataset.genre;
      state.page  = 1;
      loadView();
    });
  }

  // ── Load More ─────────────────────────────────────
  function setupLoadMore() {
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
      if (state.page < state.totalPages && !state.loading) {
        state.page++;
        loadMore();
      }
    });
  }

  // ── Main load ─────────────────────────────────────
  async function loadView() {
    state.loading = true;
    UI.showGridLoading();
    document.getElementById('loadMoreBtn').style.display = 'none';

    try {
      if (state.query) {
        await loadSearch();
      } else if (state.view === 'discover') {
        await loadDiscover();
      } else if (state.view === 'watchlist') {
        await loadSavedList('watchlist');
      } else if (state.view === 'watched') {
        await loadSavedList('watched');
      }
    } catch (e) {
      if (e.message === 'NO_API_KEY') {
        UI.showApiKeyBanner();
      } else {
        console.error(e);
        document.getElementById('cardGrid').innerHTML = `
          <div class="empty-state">
            <h3>Κάτι πήγε στραβά</h3>
            <p>${e.message}</p>
          </div>`;
      }
    }

    state.loading = false;
  }

  // ── Discover ──────────────────────────────────────
  async function loadDiscover() {
    const tmdbSort = SORT_MAP[state.sort] || 'popularity.desc';
    const genre    = state.genre !== 'all' ? state.genre : undefined;

    let result;

    if (state.typeFilter === 'all') {
      // trending mix
      result = await API.getTrending(state.page);
    } else if (state.typeFilter === 'movie') {
      result = await API.discoverMovies({ genre, sort: tmdbSort, page: state.page });
    } else {
      result = await API.discoverTV({ genre, sort: tmdbSort, page: state.page });
    }

    state.totalPages = result.total_pages || 1;
    UI.renderGrid(result.results);
    UI.setResultCount(null);
    UI.setSectionTitle(state.query ? 'Αποτελέσματα' : 'Trending τώρα');

    // hero only on first page discover
    if (state.page === 1 && state.view === 'discover' && !state.query) {
      const heroItems = result.results.slice(0, 6);
      UI.buildHero(heroItems);
    }

    updateLoadMore();
  }

  // ── Search ────────────────────────────────────────
  async function loadSearch() {
    UI.setSectionTitle(`Αποτελέσματα για "${state.query}"`);
    document.getElementById('heroStrip').style.display = 'none';

    const result = await API.search(state.query, state.page);
    let items = result.results;
    if (state.typeFilter !== 'all') {
      items = items.filter(i => i.type === state.typeFilter);
    }

    state.totalPages = result.total_pages || 1;
    UI.renderGrid(items);
    UI.setResultCount(items.length);
    updateLoadMore();
  }

  // ── Saved lists (watchlist / watched) ─────────────
  async function loadSavedList(listType) {
    const ids = listType === 'watchlist'
      ? Storage.getWatchlistIds()
      : Storage.getWatchedIds();

    const keys = Object.keys(ids);

    UI.setSectionTitle(listType === 'watchlist'
      ? `Watchlist (${keys.length})`
      : `Είδα (${keys.length})`);

    if (!keys.length) {
      document.getElementById('cardGrid').innerHTML = `
        <div class="empty-state">
          <h3>${listType === 'watchlist' ? 'Το Watchlist σου είναι άδειο' : 'Δεν έχεις σημειώσει τίποτα ως "Είδα"'}</h3>
          <p>Πρόσθεσε κάτι από την Ανακάλυψη!</p>
        </div>`;
      return;
    }

    // fetch details for each saved item
    const entries = keys.map(k => {
      const [type, id] = k.split('_');
      return { type, id: +id };
    });

    const grid = document.getElementById('cardGrid');
    grid.innerHTML = '';

    // fetch in batches of 5 to avoid too many concurrent requests
    for (let i = 0; i < entries.length; i += 5) {
      const batch = entries.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(e => e.type === 'movie'
          ? API.getMovieDetails(e.id)
          : API.getTVDetails(e.id))
      );
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          grid.appendChild(UI.buildCard(r.value));
        }
      });
    }

    UI.setResultCount(keys.length);
    state.totalPages = 1;
    updateLoadMore();
  }

  // ── Load More (append) ────────────────────────────
  async function loadMore() {
    state.loading = true;
    const tmdbSort = SORT_MAP[state.sort] || 'popularity.desc';
    const genre    = state.genre !== 'all' ? state.genre : undefined;

    try {
      let result;
      if (state.query) {
        result = await API.search(state.query, state.page);
      } else if (state.typeFilter === 'movie') {
        result = await API.discoverMovies({ genre, sort: tmdbSort, page: state.page });
      } else if (state.typeFilter === 'tv') {
        result = await API.discoverTV({ genre, sort: tmdbSort, page: state.page });
      } else {
        result = await API.getTrending(state.page);
      }
      const grid = document.getElementById('cardGrid');
      UI.renderGrid(result.results, grid);
      state.totalPages = result.total_pages || 1;
    } catch {}

    state.loading = false;
    updateLoadMore();
  }

  // ── Load more button visibility ───────────────────
  function updateLoadMore() {
    const btn = document.getElementById('loadMoreBtn');
    btn.style.display = (state.page < state.totalPages) ? 'block' : 'none';
  }

  // ── Start ─────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  return { state };

})();
