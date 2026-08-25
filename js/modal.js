/**
 * modal.js — Detail modal για ταινίες & σειρές
 * Χειρίζεται: info, seasons, episodes, cast
 */

const Modal = (() => {

  const overlay   = document.getElementById('modalOverlay');
  const closeBtn  = document.getElementById('modalClose');
  const content   = document.getElementById('modalContent');

  let currentTVId = null;
  let currentSeasonData = {};  // cache { seasonNum: episodes[] }

  // ── Open ──────────────────────────────────────────
  async function open(type, id) {
    content.innerHTML = `<div class="loading-state" style="padding:60px 0">
      <div class="spinner"></div><p>Φόρτωση…</p>
    </div>`;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
      if (type === 'movie') {
        const data = await API.getMovieDetails(id);
        renderMovie(data);
      } else {
        const data = await API.getTVDetails(id);
        currentTVId = id;
        currentSeasonData = {};
        renderTV(data);
      }
    } catch (e) {
      content.innerHTML = `<div class="empty-state" style="padding:60px 0">
        <h3>Σφάλμα φόρτωσης</h3><p>${e.message}</p>
      </div>`;
    }
  }

  // ── Close ─────────────────────────────────────────
  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    currentTVId = null;
  }

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

 // ── Movie render ──────────────────────────────────
  function renderMovie(d) {
    const watched   = Storage.isWatched('movie', d.id);
    const inWatchlist = Storage.isInWatchlist('movie', d.id);

 // ΝΕΟΣ ΚΑΘΑΡΟΣ ΚΩΔΙΚΑΣ: HTML για τους Watch Providers
    const providersHTML = (d.providers && d.providers.length > 0) ? `
      <div class="providers-section">
        <div class="providers-label">Διαθεσιμο στο (Ελλαδα):</div>
        <div class="providers-list">
          ${d.providers.map(p => `<img src="${p.logo}" alt="${p.name}" title="${p.name}" class="provider-logo" />`).join('')}
        </div>
      </div>
    ` : '';

    content.innerHTML = `
      ${heroHTML(d)}
      <div class="modal-body">
        <h2 class="modal-title">${UI.esc(d.title)}</h2>
        ${d.tagline ? `<p class="modal-tagline">${UI.esc(d.tagline)}</p>` : ''}
        <div class="modal-meta">
          ${d.year ? `<span class="meta-chip">${d.year}</span><span class="meta-dot">·</span>` : ''}
          ${d.runtime ? `<span class="meta-chip">${d.runtime}</span><span class="meta-dot">·</span>` : ''}
          ${d.rating ? `<span class="meta-chip rating">★ ${d.rating}</span>` : ''}
        </div>
        ${d.genres.length ? `<div class="modal-genres">${d.genres.map(g =>
          `<span class="genre-tag">${UI.esc(g.name)}</span>`).join('')}</div>` : ''}
        
        ${providersHTML} <!-- Προσθήκη των providers εδώ -->

        <p class="modal-overview">${UI.esc(d.overview)}</p>
        <div class="modal-actions" id="movieActions">
          <button class="btn ${watched ? 'btn-danger' : 'btn-primary'} action-watched"
            data-id="${d.id}" data-type="movie">
            ${watched ? '✕ Αφαίρεση από Είδα' : '✓ Σημείωσε ως Είδα'}
          </button>
          <button class="btn btn-ghost action-watchlist"
            data-id="${d.id}" data-type="movie">
            ${inWatchlist ? '✓ Στη λίστα' : '+ Watchlist'}
          </button>
        </div>
        ${castHTML(d.cast)}
      </div>
    `;

    bindActionButtons(content, 'movie', d.id);
  }

// ── TV render ─────────────────────────────────────
  function renderTV(d) {
    const watched   = Storage.isWatched('tv', d.id);
    const inWatchlist = Storage.isInWatchlist('tv', d.id);
    const epCount   = Storage.getWatchedEpisodesForShow(d.id).length;

    // ΝΕΟΣ ΚΩΔΙΚΑΣ: HTML για τους Watch Providers (Σειρές)
    const providersHTML = (d.providers && d.providers.length > 0) ? `
      <div class="providers-section" style="margin-bottom: 16px;">
        <div class="providers-label" style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Διαθεσιμο στο (Ελλαδα):</div>
        <div class="providers-list" style="display:flex;gap:8px;flex-wrap:wrap;">
          ${d.providers.map(p => `<img src="${p.logo}" alt="${p.name}" title="${p.name}" style="width:36px;height:36px;border-radius:var(--r-sm);border:1px solid var(--border-subtle);" />`).join('')}
        </div>
      </div>
    ` : '';

    content.innerHTML = `
      ${heroHTML(d)}
      <div class="modal-body">
        <h2 class="modal-title">${UI.esc(d.title)}</h2>
        ${d.tagline ? `<p class="modal-tagline">${UI.esc(d.tagline)}</p>` : ''}
        <div class="modal-meta">
          ${d.year ? `<span class="meta-chip">${d.year}</span><span class="meta-dot">·</span>` : ''}
          ${d.numberOfSeasons ? `<span class="meta-chip">${d.numberOfSeasons} Σεζόν</span><span class="meta-dot">·</span>` : ''}
          ${d.numberOfEpisodes ? `<span class="meta-chip">${d.numberOfEpisodes} Επεισόδια</span><span class="meta-dot">·</span>` : ''}
          ${d.rating ? `<span class="meta-chip rating">★ ${d.rating}</span>` : ''}
          ${d.networks.length ? `<span class="meta-dot">·</span><span class="meta-chip">${UI.esc(d.networks.join(', '))}</span>` : ''}
        </div>
        ${d.genres.length ? `<div class="modal-genres">${d.genres.map(g =>
          `<span class="genre-tag">${UI.esc(g.name)}</span>`).join('')}</div>` : ''}
        
        ${providersHTML} <!-- Προσθήκη των providers εδώ -->

        <p class="modal-overview">${UI.esc(d.overview)}</p>
        <div class="modal-actions" id="tvActions">
          <button class="btn ${watched ? 'btn-danger' : 'btn-primary'} action-watched"
            data-id="${d.id}" data-type="tv">
            ${watched ? '✕ Αφαίρεση από Είδα' : '✓ Σημείωσε ως Είδα'}
          </button>
          <button class="btn btn-ghost action-watchlist"
            data-id="${d.id}" data-type="tv">
            ${inWatchlist ? '✓ Στη λίστα' : '+ Watchlist'}
          </button>
        </div>
        ${epCount > 0 ? `<p style="font-size:13px;color:var(--watched-color);margin-top:-8px;margin-bottom:16px">
          ✓ ${epCount} επεισόδια έχεις δει</p>` : ''}

        <!-- SEASONS & EPISODES -->
        ${d.seasons.length ? seasonsHTML(d) : ''}

        <!-- CAST -->
        ${castHTML(d.cast)}
      </div>
    `;

    bindActionButtons(content, 'tv', d.id);

    // load first season episodes automatically
    if (d.seasons.length) {
      loadSeasonEpisodes(d.id, d.seasons[0].season_number);
      // Season tab clicks
      content.querySelector('.season-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.season-tab');
        if (!tab) return;
        content.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadSeasonEpisodes(d.id, +tab.dataset.season);
      });
    }
  }
  

  // ── Hero HTML ─────────────────────────────────────
  function heroHTML(d) {
    return `
      <div class="modal-hero">
        ${d.backdrop
          ? `<div class="modal-backdrop" style="background-image:url('${d.backdrop}')"></div>`
          : `<div class="modal-backdrop" style="background:var(--bg-elevated)"></div>`}
        <div class="modal-poster-wrap">
          ${d.poster
            ? `<img class="modal-poster" src="${d.poster}" alt="${UI.esc(d.title)}" />`
            : `<div class="modal-poster" style="display:flex;align-items:center;justify-content:center;height:180px;background:var(--bg-elevated);color:var(--text-muted);font-size:40px">${d.type === 'movie' ? '🎬' : '📺'}</div>`}
        </div>
      </div>
    `;
  }

  // ── Seasons HTML ──────────────────────────────────
  function seasonsHTML(d) {
    const tabs = d.seasons.map((s, i) => `
      <button class="season-tab${i === 0 ? ' active' : ''}" data-season="${s.season_number}">
        Σεζόν ${s.season_number}
        ${s.episode_count ? `<span style="opacity:.5;font-size:11px"> · ${s.episode_count}ep</span>` : ''}
      </button>
    `).join('');
    return `
      <div class="seasons-section">
        <h3 class="seasons-title">Επεισόδια</h3>
        <div class="season-tabs">${tabs}</div>
        <div class="episodes-list" id="episodesList">
          <p class="episodes-loading">Φόρτωση επεισοδίων…</p>
        </div>
      </div>
    `;
  }

  // ── Load episodes for season ──────────────────────
  async function loadSeasonEpisodes(tvId, seasonNum) {
    const list = content.querySelector('#episodesList');
    if (!list) return;
    list.innerHTML = '<p class="episodes-loading"><span class="spinner" style="display:inline-block;width:20px;height:20px;border-width:2px;vertical-align:middle;margin-right:8px"></span>Φόρτωση…</p>';

    try {
      let episodes = currentSeasonData[seasonNum];
      if (!episodes) {
        episodes = await API.getSeasonEpisodes(tvId, seasonNum);
        currentSeasonData[seasonNum] = episodes;
      }
      renderEpisodes(list, tvId, seasonNum, episodes);
    } catch (e) {
      list.innerHTML = `<p class="episodes-loading" style="color:var(--danger)">Σφάλμα: ${e.message}</p>`;
    }
  }

  function renderEpisodes(container, tvId, seasonNum, episodes) {
    if (!episodes.length) {
      container.innerHTML = '<p class="episodes-loading">Δεν βρέθηκαν επεισόδια.</p>';
      return;
    }
    container.innerHTML = episodes.map(ep => {
      const watched = Storage.isEpisodeWatched(tvId, seasonNum, ep.number);
      return `
        <div class="episode-row" data-ep="${ep.number}">
          <div class="episode-num">${ep.number}</div>
          <div class="episode-info">
            <div class="episode-title">${UI.esc(ep.title)}</div>
            ${ep.airDate ? `<div class="episode-air-date">${formatDate(ep.airDate)}</div>` : ''}
          </div>
          <button class="episode-check-btn ${watched ? 'watched' : ''}"
            data-tvid="${tvId}" data-season="${seasonNum}" data-ep="${ep.number}"
            title="${watched ? 'Σημείωσε ως μη παρακολουθημένο' : 'Σημείωσε ως παρακολουθημένο'}">
            ${watched ? '✓' : '○'}
          </button>
        </div>
      `;
    }).join('');

    // episode check buttons
    container.querySelectorAll('.episode-check-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const { tvid, season, ep } = btn.dataset;
        const now = Storage.toggleEpisode(+tvid, +season, +ep);
        btn.className = `episode-check-btn ${now ? 'watched' : ''}`;
        btn.textContent = now ? '✓' : '○';
        btn.title = now
          ? 'Σημείωσε ως μη παρακολουθημένο'
          : 'Σημείωσε ως παρακολουθημένο';
        if (now) {
          Storage.saveProgress(+tvid, +season, +ep);
          UI.toast(`S${season}E${ep.padStart ? ep : ep} ✓`, 'success');
        }
      });
    });
  }

  // ── Cast HTML ─────────────────────────────────────
  function castHTML(cast) {
    if (!cast || !cast.length) return '';
    const cards = cast.map(p => `
      <div class="cast-card">
        ${p.photo
          ? `<img class="cast-photo" src="${p.photo}" alt="${UI.esc(p.name)}" loading="lazy" />`
          : `<div class="cast-photo" style="display:flex;align-items:center;justify-content:center;background:var(--bg-elevated);color:var(--text-muted);font-size:22px">👤</div>`}
        <div class="cast-name">${UI.esc(p.name)}</div>
        <div class="cast-character">${UI.esc(p.character || '')}</div>
      </div>
    `).join('');
    return `
      <p class="modal-section-title">Ηθοποιοί</p>
      <div class="cast-scroll">${cards}</div>
    `;
  }

  // ── Action buttons (watched / watchlist) ──────────
  function bindActionButtons(root, type, id) {
    root.querySelectorAll('.action-watched').forEach(btn => {
      btn.addEventListener('click', () => {
        const now = Storage.toggleWatched(type, id);
        btn.className = `btn ${now ? 'btn-danger' : 'btn-primary'} action-watched`;
        btn.textContent = now ? '✕ Αφαίρεση από Είδα' : '✓ Σημείωσε ως Είδα';
        UI.toast(now ? 'Προστέθηκε στο "Είδα" ✓' : 'Αφαιρέθηκε από το "Είδα"',
          now ? 'success' : 'remove');
      });
    });
    root.querySelectorAll('.action-watchlist').forEach(btn => {
      btn.addEventListener('click', () => {
        const now = Storage.toggleWatchlist(type, id);
        btn.textContent = now ? '✓ Στη λίστα' : '+ Watchlist';
        UI.toast(now ? 'Προστέθηκε στο Watchlist' : 'Αφαιρέθηκε από το Watchlist',
          now ? 'info' : 'remove');
      });
    });
  }

  // ── Helpers ───────────────────────────────────────
  function formatDate(str) {
    if (!str) return '';
    try {
      return new Date(str).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return str; }
  }

  return { open, close };

})();
