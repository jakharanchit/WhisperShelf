# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Stack: React 19 + TypeScript + Vite
- Styling: Tailwind via CDN (no Tailwind config/build step)
- Hosting: Static SPA; deploy to GitHub Pages via gh-pages
- Data: public/manifest.json provides the audiobook catalog; images under covers/, background images under img/

Commands
- Install dependencies (package-lock.json present):
```powershell path=null start=null
npm ci
```
- Start dev server (Vite):
```powershell path=null start=null
npm run dev
```
- Build production bundle (outputs dist/):
```powershell path=null start=null
npm run build
```
- Preview the production build locally:
```powershell path=null start=null
npm run preview
```
- Deploy to GitHub Pages (publishes dist/):
```powershell path=null start=null
npm run deploy
```
Notes on linting and tests
- Linting: No linter configuration or scripts detected.
- Tests: No test framework or scripts detected; running a single test is not applicable in the current setup.

High-level architecture
- Entry and bootstrap
  - index.html: Loads Tailwind via CDN and sets up an import map for React in the browser. Vite serves/rewrites assets during dev/build. It mounts a root div with id="root" and imports index.tsx as an ES module.
  - index.tsx: Creates the React root and renders <App/> inside React.StrictMode.

- Application core (App.tsx)
  - State model is centralized with useReducer. Key domains: library (books, filteredBooks), playback (currentTrack, isPlaying, progress, duration, playbackRate, volume), UI (isChapterListVisible, toasts), user data (bookmarks, sleepTimerType).
  - Lifecycle and persistence:
    - On load, fetches the audiobook catalog from import.meta.env.BASE_URL + 'manifest.json' (important for correct paths when deployed under a subpath on GitHub Pages).
    - Restores player state and bookmarks from localStorage (keys: 'audiobookPlayerState', 'audiobookPlayerBookmarks').
    - Periodically persists player state while playing; bookmarks persist on change.
  - Audio pipeline: A single <audio> element is controlled imperatively via refs and effects (setting src, play/pause, playbackRate, volume). Progress, duration, and track-end events update reducer state. Next/prev chapter logic advances within the selected book.
  - Search: Dispatches SET_SEARCH_QUERY to filter books by title/author; results drive the carousel.
  - Sleep timer: Supports 'end of chapter' and minute-based timers, managed via timeouts and reducer state.

- Components (key responsibilities)
  - components/BookCarousel.tsx: 3D-like carousel that displays up to a window of nearby books; clicking the focused item selects a book.
  - components/BookView.tsx: Full-screen player for the selected book; renders artwork, metadata, transport controls, sleep timer modal, bookmarks, and a modal chapter list.
  - components/ChapterList.tsx: List and selection of chapters for the current book (rendered within BookView).
  - components/ProgressBar.tsx: Click-to-seek progress bar; shows elapsed and remaining time.
  - components/Search.tsx: Search field with clear action; updates reducer via callback.
  - components/Toast.tsx and components/Loader.tsx: Notifications and loading indicator.
  - components/Icons.tsx: SVG icon set used across controls.

- Types and data
  - types.ts: Book, Chapter, CurrentTrack, Bookmark, Toast type definitions used across components.
  - public/manifest.json: Structured list of books and chapters with external audio URLs; covers referenced by relative paths under covers/.
  - metadata.json: App metadata.

Operational notes
- Asset/base paths: All runtime fetches and image URLs that use import.meta.env.BASE_URL are base-path aware, which is required for GitHub Pages (subdirectory) deployments.
- No backend: The app is a static SPA; audio files are streamed from external URLs defined in public/manifest.json.

Derived from repository files
- README.md (features, getting started, tech stack)
- package.json (scripts: dev, build, preview, deploy)
- tsconfig.json (bundler resolution, JSX react-jsx)
- index.html, index.tsx, App.tsx, components/*, types.ts, public/manifest.json, metadata.json
