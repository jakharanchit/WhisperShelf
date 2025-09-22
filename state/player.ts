import { Book, Chapter, CurrentTrack, Bookmark, Toast } from '../types';

export type State = {
  books: Book[];
  filteredBooks: Book[];
  isLoading: boolean;
  searchQuery: string;
  selectedBook: Book | null;
  currentTrack: CurrentTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isChapterListVisible: boolean;
  bookmarks: Bookmark[];
  sleepTimerType: 'eoc' | number | null;
  toasts: Toast[];
};

export type Action =
  | { type: 'SET_BOOKS'; payload: Book[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_BOOK'; payload: Book | null }
  | { type: 'SET_CURRENT_TRACK'; payload: CurrentTrack }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_CHAPTER_LIST' }
  | { type: 'SET_BOOKMARKS'; payload: Bookmark[] }
  | { type: 'ADD_BOOKMARK' }
  | { type: 'DELETE_BOOKMARK'; payload: string }
  | { type: 'SET_SLEEP_TIMER'; payload: 'eoc' | number | null }
  | { type: 'ADD_TOAST'; payload: Omit<Toast, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string };

export const initialState: State = {
  books: [],
  filteredBooks: [],
  isLoading: true,
  searchQuery: '',
  selectedBook: null,
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  playbackRate: 1,
  volume: 1,
  isChapterListVisible: false,
  bookmarks: [],
  sleepTimerType: null,
  toasts: [],
};

export const appReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_BOOKS':
      return { ...state, books: action.payload, filteredBooks: action.payload, isLoading: false };
    case 'SET_SEARCH_QUERY': {
      const query = action.payload.toLowerCase();
      const filtered = state.books.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
      return { ...state, searchQuery: action.payload, filteredBooks: filtered };
    }
    case 'SET_SELECTED_BOOK':
      return { ...state, selectedBook: action.payload };
    case 'SET_CURRENT_TRACK':
      return { ...state, currentTrack: action.payload, progress: 0 };
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_PLAYBACK_RATE':
      return { ...state, playbackRate: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'TOGGLE_CHAPTER_LIST':
      return { ...state, isChapterListVisible: !state.isChapterListVisible };
    case 'SET_BOOKMARKS':
      return { ...state, bookmarks: action.payload };
    case 'ADD_BOOKMARK': {
      if (!state.currentTrack) return state;
      const { book, chapter } = state.currentTrack;

      // Dedupe: if the most recent bookmark is for the same book/chapter and within ±1s, ignore
      const last = state.bookmarks[0];
      if (
        last &&
        last.bookId === book.id &&
        last.chapterNum === chapter.num &&
        Math.abs(last.progress - state.progress) <= 1
      ) {
        return state; // ignore near-duplicate
      }

      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        bookId: book.id,
        bookTitle: book.title,
        chapterNum: chapter.num,
        chapterTitle: chapter.title,
        progress: state.progress,
        createdAt: Date.now(),
      };
      const newBookmarks = [newBookmark, ...state.bookmarks].sort((a, b) => b.createdAt - a.createdAt);
      return { ...state, bookmarks: newBookmarks };
    }
    case 'DELETE_BOOKMARK':
      return { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== action.payload) };
    case 'SET_SLEEP_TIMER':
      return { ...state, sleepTimerType: action.payload };
    case 'ADD_TOAST': {
      const newToast = { ...action.payload, id: Date.now().toString() };
      return { ...state, toasts: [...state.toasts, newToast] };
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    default:
      return state;
  }
};