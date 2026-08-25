# WatchVault 🎬

Offline-capable web app για να παρακολουθείς ταινίες & σειρές.  
Δεδομένα από **TMDB API** (δωρεάν). Χωρίς backend — όλα στο browser.


---

## 📁 File Structure

```
watchlist/
├── index.html              # Entry point
├── css/
│   ├── reset.css           # CSS reset
│   ├── tokens.css          # Design tokens (χρώματα, spacing, fonts)
│   ├── layout.css          # Header, grid, hero layout
│   ├── components.css      # Cards, buttons, toast, badges
│   └── modal.css           # Modal overlay, episodes, cast
├── js/
│   ├── config.js           # ← API key + σταθερές (εδώ βάζεις το key)
│   ├── storage.js          # localStorage: watched, watchlist, episodes
│   ├── api.js              # Όλα τα TMDB API calls
│   ├── ui.js               # Rendering: cards, hero, grid
│   ├── modal.js            # Detail modal + episodes
│   └── app.js              # Main controller (navigation, filters)
└── README.md
```

---

## ✨ Features

| Feature | Περιγραφή |
|---|---|
| 🔥 Trending | Αυτόματο hero με τα trending της εβδομάδας |
| 🔍 Αναζήτηση | Real-time search με debounce |
| 🎭 Φίλτρα | Τύπος (ταινία/σειρά), είδος, ταξινόμηση |
| ✓ Watched | Σημείωσε ταινίες ως "Είδα" |
| + Watchlist | Λίστα για να δεις αργότερα |
| 📺 Episodes | Επίπεδο επεισοδίου ανά σεζόν για σειρές |
| 🌐 Ελληνικά | UI labels + TMDB ελληνικές μεταφράσεις |
| 💾 Offline data | Παραμένουν στο localStorage μεταξύ sessions |
| 📱 Responsive | Mobile-friendly |

---

## 🔧 Μελλοντικές Επεκτάσεις

- [ ] `js/export.js` — Export/Import λίστας σε JSON
- [ ] `js/stats.js` — Στατιστικά (ώρες παρακολούθησης, top genres)
- [ ] `css/themes.css` — Light mode / custom themes
- [ ] IndexedDB αντί localStorage (για μεγάλες λίστες)
- [ ] PWA manifest για installation

---

## ⚠️ Σημείωση

Μην ανεβάζεις το `js/config.js` με το API key σε δημόσιο repo.  
Πρόσθεσέ το στο `.gitignore` ή χρησιμοποίησε environment variables αν το μετατρέψεις σε server app.
