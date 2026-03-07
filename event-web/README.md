# Event0 Web – Mobile & Desktop

Uses **Tailwind CSS** and **Redux** (same pattern as admin panel). API and env are centralized under `src/config`.

- **Mobile (photo jaisa):** Narrow app-style layout, bottom nav, 2-column event grids, banner.
- **Desktop (website):** Full-width layout, top nav in header, no bottom nav, 4-column grids (max-width 1200px).

Breakpoint: **769px** (`md:`). Run `npm run dev` and resize to see both layouts.

## Folder structure

```
src/
  config/          # env.js, axiosInstance.js – API base URL, timeouts, feature flags
  constants/       # actionTypes.js – Redux action type constants
  store/           # Redux: store.js, reducer.js, reducer/*.js, actions/*.js
  services/        # API helpers (eventService, bannerService) using config axios
  components/      # Header, BottomNav, Banner, EventCard
  pages/           # Home, Rewards, ScanQR, Gallery, Profile, EventDetail
  assets/          # Static assets
  utils/            # Shared utilities
  App.jsx, main.jsx, index.css
```

## Run

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173` (Vite). Copy `.env.example` to `.env` and set:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_UPLOADS_URL=http://localhost:5000
VITE_API_NODE_ENV=development
VITE_API_TIMEOUT=15000
```

## Build

```bash
npm run build
```

## Features

- **Header**: Search, EVENTIAL logo, Favorites, Cart (with badge)
- **Banner**: From API `GET /api/banner-events` (carousel with optional hyperlinks)
- **My Registered Event / Featured / Upcoming**: Data from Redux (`event.list`, `event.upcoming`) via `GET /api/events/public/mobile-list`
- **Bottom nav**: Home, Rewards, Scan QR, Gallery, Profile (active state in green)
