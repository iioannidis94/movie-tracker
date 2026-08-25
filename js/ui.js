/**
 * ui.js — Rendering helpers: cards, hero, grid, toast
 */

const UI = (() => {

  // ── TOAST ─────────────────────────────────────────
  let toastTimer;
  function toast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 2800);
  }

  // ── CARD ──────────────────────────────────────────
  function buildCard(item) {
    const watched    = Storage.isWatched(item.type, item.id);
    const inWatchlist = Storage.isInWatchlist(item.type, item.id);

    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id   = item.id;
    card.dataset.type = item.type;

    // poster
    let posterHTML;
    if (item.poster) {
      posterHTML = `<img class="card-poster" src="${item.poster}" alt="${esc(item.title)}" loading="lazy" />`;
    } else {
      const icon = item.type === 'movie' ? '🎬' : '📺';
      posterHTML = `<div class="card-poster-placeholder">${icon}<span>Χωρίς εξώφυλλο</span></div>`;
    }

    // badges
    const statusBadge = watched
      ? `<span class="card-badge watched">✓ Είδα</span>`
      : inWatchlist
        ? `<span class="card-badge watchlist">+ Watchlist</span>`
        : '';

    const typeBadge = `<span class="card-type-badge">${item.type === 'movie' ? 'Ταινία' : 'Σειρά'}</span>`;
    const ratingBadge = item.rating
      ? `<span class="card-rating">★ ${item.rating}</span>`
      : '';

    card.innerHTML = `
      ${posterHTML}
      <div class="card-overlay"></div>
      ${ratingBadge || typeBadge}
      ${statusBadge}
      <div class="card-footer">
        <div class="card-title">${esc(item.title)}</div>
        ${item.year ? `<div class="card-year">${item.year}</div>` : ''}
      </div>
      <div class="card-actions">
        <button class="card-action-btn secondary action-info" data-id="${item.id}" data-type="${item.type}">
          ℹ Info
        </button>
        <button class="card-action-btn primary action-watchlist" data-id="${item.id}" data-type="${item.type}">
          ${inWatchlist ? '✓ List' : '+ List'}
        </button>
      </div>
    `;

    // click on card (not buttons) → open modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-action-btn')) return;
      Modal.open(item.type, item.id);
    });

    // info button
    card.querySelector('.action-info').addEventListener('click', (e) => {
      e.stopPropagation();
      Modal.open(item.type, item.id);
    });

    // watchlist button
    card.querySelector('.action-watchlist').addEventListener('click', (e) => {
      e.stopPropagation();
      const added = Storage.toggleWatchlist(item.type, item.id);
      const btn = e.currentTarget;
      btn.textContent = added ? '✓ List' : '+ List';
      // update status badge
      const existingBadge = card.querySelector('.card-badge');
      if (existingBadge) existingBadge.remove();
      if (added) {
        card.insertAdjacentHTML('afterbegin',
          `<span class="card-badge watchlist">+ Watchlist</span>`);
        toast(`"${item.title}" προστέθηκε στο Watchlist`, 'info');
      } else {
        toast(`"${item.title}" αφαιρέθηκε από το Watchlist`, 'remove');
      }
    });

    return card;
  }

  // ── GRID ──────────────────────────────────────────
  function renderGrid(items, appendTo) {
    const grid = appendTo || document.getElementById('cardGrid');
    if (!appendTo) {
      // clear loading state
      grid.innerHTML = '';
    }
    if (!items.length && !appendTo) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>Δεν βρέθηκαν αποτελέσματα</h3>
          <p>Δοκίμασε διαφορετικά φίλτρα ή αναζήτηση.</p>
        </div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    items.forEach(item => frag.appendChild(buildCard(item)));
    grid.appendChild(frag);
  }

  function showGridLoading() {
    const grid = document.getElementById('cardGrid');
    grid.innerHTML = `<div class="loading-state" id="loadingState">
      <div class="spinner"></div><p>Φόρτωση…</p>
    </div>`;
  }

  function setResultCount(n) {
    const el = document.getElementById('resultCount');
    if (el) el.textContent = n ? `${n} αποτελέσματα` : '';
  }

  function setSectionTitle(title) {
    const el = document.getElementById('sectionTitle');
    if (el) el.textContent = title;
  }

  // ── HERO ──────────────────────────────────────────
  let heroItems = [];
  let heroIndex = 0;
  let heroTimer = null;

  function buildHero(items) {
    heroItems = items.slice(0, 6).filter(i => i.backdrop);
    if (!heroItems.length) {
      document.getElementById('heroStrip').style.display = 'none';
      return;
    }
    renderHeroSlide(0);
    buildHeroDots();
    startHeroTimer();
  }

  function renderHeroSlide(idx) {
    heroIndex = idx;
    const item = heroItems[idx];
    const bg   = document.getElementById('heroBg');
    const info = document.getElementById('heroInfo');
    const dots = document.getElementById('heroDots');

    bg.style.backgroundImage = `url('${item.backdrop}')`;

    const watched = Storage.isWatched(item.type, item.id);
    const inList  = Storage.isInWatchlist(item.type, item.id);

    info.innerHTML = `
      <div class="hero-eyebrow">${item.type === 'movie' ? '🎬 Ταινία' : '📺 Σειρά'} · Trending</div>
      <h1 class="hero-title">${esc(item.title)}</h1>
      <div class="hero-meta">
        ${item.year ? `<span>${item.year}</span>` : ''}
        ${item.rating ? `<span>★ ${item.rating}</span>` : ''}
      </div>
      ${item.overview ? `<p class="hero-overview">${esc(item.overview.slice(0, 200))}…</p>` : ''}
      <div class="hero-actions">
        <button class="btn btn-primary hero-info-btn" data-id="${item.id}" data-type="${item.type}">
          Περισσότερα
        </button>
        <button class="btn btn-ghost hero-list-btn" data-id="${item.id}" data-type="${item.type}">
          ${inList ? '✓ Στη λίστα' : '+ Watchlist'}
        </button>
        ${watched ? '<span class="btn btn-ghost" style="cursor:default">✓ Είδες αυτό</span>' : ''}
      </div>
    `;

    info.querySelector('.hero-info-btn').addEventListener('click', () => {
      Modal.open(item.type, item.id);
    });
    info.querySelector('.hero-list-btn').addEventListener('click', (e) => {
      const added = Storage.toggleWatchlist(item.type, item.id);
      e.currentTarget.textContent = added ? '✓ Στη λίστα' : '+ Watchlist';
      toast(added
        ? `"${item.title}" προστέθηκε στο Watchlist`
        : `"${item.title}" αφαιρέθηκε από το Watchlist`,
        added ? 'info' : 'remove');
    });

    // update dot active state
    dots.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
  }

  function buildHeroDots() {
    const dots = document.getElementById('heroDots');
    dots.innerHTML = heroItems.map((_, i) =>
      `<button class="hero-dot${i === 0 ? ' active' : ''}" data-i="${i}"></button>`
    ).join('');
    dots.addEventListener('click', (e) => {
      const dot = e.target.closest('.hero-dot');
      if (!dot) return;
      stopHeroTimer();
      renderHeroSlide(+dot.dataset.i);
      startHeroTimer();
    });
  }

  function startHeroTimer() {
    stopHeroTimer();
    heroTimer = setInterval(() => {
      renderHeroSlide((heroIndex + 1) % heroItems.length);
    }, CONFIG.HERO_INTERVAL);
  }
  function stopHeroTimer() { clearInterval(heroTimer); }

  // ── GENRES PILLS ─────────────────────────────────
  function buildGenrePills(genreMap) {
    const container = document.getElementById('genreFilter');
    // keep the "Όλα" pill
    const allPill = container.querySelector('[data-genre="all"]');
    container.innerHTML = '';
    container.appendChild(allPill);
    Object.entries(genreMap).sort((a,b) => a[1].localeCompare(b[1])).forEach(([id, name]) => {
      const btn = document.createElement('button');
      btn.className = 'pill';
      btn.dataset.genre = id;
      btn.textContent = name;
      container.appendChild(btn);
    });
  }

  // ── API KEY MISSING BANNER ────────────────────────
  function showApiKeyBanner() {
    const grid = document.getElementById('cardGrid');
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>⚙️ Προσθήκη TMDB API Key</h3>
        <p style="margin-top:8px;max-width:440px;margin-left:auto;margin-right:auto;line-height:1.7">
          Άνοιξε το αρχείο <code>js/config.js</code> και πρόσθεσε το API key σου
          από το <a href="https://www.themoviedb.org/settings/api" target="_blank"
          style="color:var(--accent)">themoviedb.org → Settings → API</a>.
          Είναι δωρεάν!
        </p>
      </div>`;
    document.getElementById('heroStrip').style.display = 'none';
  }

  // ── Utilities ─────────────────────────────────────
  function esc(str = '') {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return {
    toast, buildCard, renderGrid, showGridLoading,
    setResultCount, setSectionTitle,
    buildHero, buildGenrePills, showApiKeyBanner, esc,
  };

})();