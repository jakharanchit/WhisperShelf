
# WhisperShelf Audiobook Player

**WhisperShelf** is a modern, clean, and responsive web-based audiobook player. It provides a beautiful interface to browse your personal library, listen to your favorite books, and seamlessly track your progress.

---

## ✨ Features

WhisperShelf is packed with features designed for an optimal listening experience:

- **Elegant Library View**: Browse your audiobooks with a visually stunning and interactive 3D carousel.
- **Powerful Search**: Quickly find books by title or author with a responsive search bar.
- **Full-Featured Player**: A dedicated player view for an immersive listening session.
- **Advanced Playback Controls**:
    - Play, Pause, Next & Previous Chapter.
    - Interactive seek bar with time display.
    - 30-second rewind and fast-forward buttons.
    - Variable playback speed (1x, 1.25x, 1.5x, 2x).
- **Volume Control**: Adjust the volume with an intuitive pop-up slider.
- **Bookmarking**: Save your favorite moments. Add, view, select, and delete bookmarks with ease.
- **Sleep Timer**: Set a timer to automatically pause playback at the end of the current chapter or after 15, 30, or 60 minutes.
- **State Persistence**: The app remembers your last played track, progress, volume, and playback speed, so you can pick up right where you left off.
- **Responsive Design**: Enjoy a seamless experience across desktops, tablets, and mobile devices.
- **User Feedback**: Non-intrusive toast notifications confirm actions like adding a bookmark.
- **Accessibility**: Modals and interactive elements are designed with keyboard navigation and ARIA attributes in mind.

---

## 💻 Tech Stack

This project is built with modern frontend technologies, prioritizing a clean, performant, and maintainable codebase.

- **Framework**: [React](https://reactjs.org/) (v19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks (`useReducer`, `useRef`, `useCallback`)
- **Module System**: ES Modules with Import Maps (no build step required for modern browsers).

---

## 📂 Project Structure

The project is organized into a clear and logical file structure:

```
.
├── covers/                 # Directory for audiobook cover images
├── img/                    # Directory for background images and assets
├── components/             # Reusable React components
│   ├── BookCarousel.tsx    # Interactive carousel for the library view
│   ├── BookView.tsx        # The main player interface for a selected book
│   ├── ChapterList.tsx     # Lists all chapters for a book
│   ├── Icons.tsx           # SVG icon components
│   ├── Loader.tsx          # Loading spinner component
│   ├── PlayerFooter.tsx    # (Deprecated) Old footer, functionality merged into BookView
│   ├── ProgressBar.tsx     # Seekable progress bar component
│   ├── Search.tsx          # Search input component
│   └── Toast.tsx           # Notification component
├── index.html              # Main HTML entry point
├── index.tsx               # Root React component renderer
├── App.tsx                 # Main application component, state management, and logic
├── manifest.json           # Data source for all audiobooks and chapters
├── metadata.json           # Application metadata
├── readme.md               # You are here!
└── types.ts                # TypeScript type definitions
```

---

## 🧠 Core Logic & How It Works

### State Management

The application's state is managed centrally in `App.tsx` using the `useReducer` hook. This approach provides a robust and predictable way to handle state transitions.

- **`initialState`**: Defines the default state of the application, including the book list, current track, player status, bookmarks, etc.
- **`appReducer`**: A pure function that takes the current state and an action, and returns the new state. Actions are dispatched from various components to update the UI (e.g., `SET_PLAYING`, `ADD_BOOKMARK`).

### Audio Playback

- The core audio functionality is handled by a single `<audio>` element in `App.tsx`.
- `useRef` is used to maintain a persistent reference to this element.
- `useEffect` hooks listen for changes in `currentTrack`, `isPlaying`, `playbackRate`, and `volume`. When these state variables change, the `useEffect` hook imperatively updates the audio element (e.g., `audioRef.current.play()`, `audioRef.current.pause()`, `audioRef.current.src = ...`).
- Event listeners (`timeupdate`, `loadedmetadata`, `ended`) are attached to the audio element to update the application state, such as progress and duration, or to automatically play the next chapter.

### Data Flow

1.  **Fetching Data**: On initial load, the `App` component fetches the audiobook library data from `/manifest.json`.
2.  **Component Props**: The state is passed down as props from `App.tsx` to child components (`BookCarousel`, `BookView`, etc.).
3.  **Callback Handlers**: Child components communicate back up to the `App` component via callback functions passed as props (e.g., `onSelectBook`, `onPlayPause`). These callbacks dispatch actions to the reducer, which updates the state and triggers a re-render of the application.

### Persistence

To enhance the user experience, WhisperShelf persists key data to the browser's `localStorage`:

- **Player State (`PLAYER_STATE_KEY`)**: The current book ID, chapter number, playback progress, volume, and speed are saved automatically. This allows users to close the app and resume their listening session later.
- **Bookmarks (`BOOKMARKS_KEY`)**: All user-created bookmarks are saved, ensuring they are not lost between sessions.

---

## 🚀 Getting Started

This project is set up to run in a modern browser without a complex build process, thanks to ES Modules and import maps.

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge).
- A local web server to serve the files. The [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension for VS Code is a great option.

### Running the Application

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jakharanchit/whispershelf.git
    cd whispershelf
    ```

2.  **Serve the files:**
    - Open the project folder in VS Code.
    - If you have the Live Server extension, right-click `index.html` and select "Open with Live Server".

3.  **Open in browser:**
    - The application should now be running and accessible at the local server address (e.g., `http://127.0.0.1:5500`).

---

## 🔮 Future Improvements

- **Dark Mode**: Implement a theme switcher for a comfortable viewing experience in low-light environments.
- **PWA Functionality**: Add a service worker to enable offline access to audiobooks.
- **Custom Library**: Allow users to upload their own audiobook files.
- **Testing**: Introduce unit and integration tests using a framework like Jest and React Testing Library.
- **Animations**: Add more subtle animations and transitions to further enhance the user experience.
