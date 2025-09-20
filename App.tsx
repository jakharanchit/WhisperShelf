import React, { useEffect, useRef, useCallback, useReducer } from 'react';
import { Book, Chapter, CurrentTrack, Bookmark, Toast } from './types';
import { BookCarousel } from './components/BookCarousel';
import { BookView } from './components/BookView';
import { Toast as ToastComponent } from './components/Toast';
import { Search } from './components/Search';
import { Loader } from './components/Loader';

const PLAYER_STATE_KEY = 'audiobookPlayerState';
const BOOKMARKS_KEY = 'audiobookPlayerBookmarks';

type State = {
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

type Action =
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


const initialState: State = {
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

const appReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_BOOKS':
      return { ...state, books: action.payload, filteredBooks: action.payload, isLoading: false };
    case 'SET_SEARCH_QUERY':
      const query = action.payload.toLowerCase();
      const filtered = state.books.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
      return { ...state, searchQuery: action.payload, filteredBooks: filtered };
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
    case 'ADD_BOOKMARK':
        if (!state.currentTrack) return state;
        const { book, chapter } = state.currentTrack;
        const newBookmark: Bookmark = {
            id: Date.now().toString(),
            bookId: book.id,
            bookTitle: book.title,
            chapterNum: chapter.num,
            chapterTitle: chapter.title,
            progress: state.progress,
            createdAt: Date.now(),
        };
        const newBookmarks = [newBookmark, ...state.bookmarks].sort((a,b) => b.createdAt - a.createdAt);
        return { ...state, bookmarks: newBookmarks };
    case 'DELETE_BOOKMARK':
        return { ...state, bookmarks: state.bookmarks.filter(b => b.id !== action.payload) };
    case 'SET_SLEEP_TIMER':
        return { ...state, sleepTimerType: action.payload };
    case 'ADD_TOAST':
        const newToast = { ...action.payload, id: Date.now().toString() };
        return { ...state, toasts: [...state.toasts, newToast] };
    case 'REMOVE_TOAST':
        return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { filteredBooks, selectedBook, currentTrack, isPlaying, progress, duration, playbackRate, volume, isChapterListVisible, bookmarks, sleepTimerType, toasts, isLoading, searchQuery } = state;

  const audioRef = useRef<HTMLAudioElement>(null);
  const initialSeekTime = useRef<number | null>(null);
  const sleepTimerIdRef = useRef<any>(null);

  useEffect(() => {
    const fetchAndRestoreState = async () => {
      try {
        const response = await fetch('/manifest.json');
        const manifest = await response.json();
        const allBooks = manifest.books as Book[];
        dispatch({ type: 'SET_BOOKS', payload: allBooks });

        const savedStateJSON = localStorage.getItem(PLAYER_STATE_KEY);
        if (savedStateJSON) {
          const savedState = JSON.parse(savedStateJSON);
          if (savedState.playbackRate) dispatch({ type: 'SET_PLAYBACK_RATE', payload: savedState.playbackRate });
          if (savedState.volume !== undefined) dispatch({ type: 'SET_VOLUME', payload: savedState.volume });
          if (savedState.bookId && savedState.chapterNum) {
            const book = allBooks.find((b: Book) => b.id === savedState.bookId);
            if (book) {
              const chapter = book.chapters.find((c: Chapter) => c.num === savedState.chapterNum);
              if (chapter) {
                dispatch({ type: 'SET_CURRENT_TRACK', payload: { book, chapter }});
                initialSeekTime.current = savedState.progress;
              }
            }
          }
        }
        
        const savedBookmarksJSON = localStorage.getItem(BOOKMARKS_KEY);
        if (savedBookmarksJSON) {
            dispatch({ type: 'SET_BOOKMARKS', payload: JSON.parse(savedBookmarksJSON) });
        }

      } catch (error) {
        console.error("Failed to fetch manifest or restore state:", error);
        dispatch({ type: 'SET_BOOKS', payload: [] });
      }
    };
    fetchAndRestoreState();
  }, []);

  useEffect(() => {
    const savePlayerState = () => {
      if (currentTrack) {
        const stateToSave = {
          bookId: currentTrack.book.id,
          chapterNum: currentTrack.chapter.num,
          progress: progress,
          playbackRate: playbackRate,
          volume: volume,
        };
        localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(stateToSave));
      }
    };

    if (isPlaying) {
      const intervalId = setInterval(savePlayerState, 3000);
      return () => clearInterval(intervalId);
    } else {
        savePlayerState();
    }
  }, [currentTrack, progress, isPlaying, playbackRate, volume]);

  useEffect(() => {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleSelectBook = useCallback((book: Book) => {
    dispatch({ type: 'SET_SELECTED_BOOK', payload: book });
    if (!currentTrack || currentTrack.book.id !== book.id) {
        const firstChapter = book.chapters[0];
        dispatch({ type: 'SET_CURRENT_TRACK', payload: { book, chapter: firstChapter } });
        dispatch({ type: 'SET_PLAYING', payload: false });
        initialSeekTime.current = 0;
    }
  }, [currentTrack]);
  
  const handleBackToGrid = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_BOOK', payload: null });
  }, []);

  const handleSelectChapter = useCallback((book: Book, chapter: Chapter) => {
    if (currentTrack?.chapter.url !== chapter.url) {
        dispatch({ type: 'SET_CURRENT_TRACK', payload: { book, chapter } });
        dispatch({ type: 'SET_PLAYING', payload: true });
    } else {
        dispatch({ type: 'SET_PLAYING', payload: !isPlaying });
    }
    dispatch({ type: 'TOGGLE_CHAPTER_LIST' });
  }, [currentTrack, isPlaying]);

  const handlePlayPause = useCallback(() => {
    if (!currentTrack) return;
    dispatch({ type: 'SET_PLAYING', payload: !isPlaying });
  }, [currentTrack, isPlaying]);

  const playNextChapter = useCallback(() => {
    if (sleepTimerType === 'eoc') {
        dispatch({ type: 'SET_PLAYING', payload: false });
        dispatch({ type: 'SET_SLEEP_TIMER', payload: null });
        return; 
    }
    if (!currentTrack) return;
    const { book, chapter } = currentTrack;
    const currentChapterIndex = book.chapters.findIndex(c => c.num === chapter.num);
    if (currentChapterIndex < book.chapters.length - 1) {
      const nextChapter = book.chapters[currentChapterIndex + 1];
      dispatch({ type: 'SET_CURRENT_TRACK', payload: { book, chapter: nextChapter } });
      dispatch({ type: 'SET_PLAYING', payload: true });
    } else {
      dispatch({ type: 'SET_PLAYING', payload: false });
    }
  }, [currentTrack, sleepTimerType]);

  const playPrevChapter = useCallback(() => {
    if (!currentTrack) return;
    const { book, chapter } = currentTrack;
    if (audioRef.current && audioRef.current.currentTime > 3) {
        audioRef.current.currentTime = 0;
        return;
    }
    const currentChapterIndex = book.chapters.findIndex(c => c.num === chapter.num);
    if (currentChapterIndex > 0) {
      const prevChapter = book.chapters[currentChapterIndex - 1];
      dispatch({ type: 'SET_CURRENT_TRACK', payload: { book, chapter: prevChapter } });
      dispatch({ type: 'SET_PLAYING', payload: true });
    }
  }, [currentTrack]);
  
  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        dispatch({ type: 'SET_PROGRESS', payload: time });
    }
  }, []);
  
  const handleRewind = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 30);
    }
  }, []);

  const handleForward = useCallback(() => {
    if (audioRef.current && duration) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 30);
    }
  }, [duration]);

  const handlePlaybackRateChange = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    dispatch({ type: 'SET_PLAYBACK_RATE', payload: speeds[nextIndex] });
  }, [playbackRate]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: newVolume });
  }, []);

  const handleToggleChapterList = useCallback(() => {
    dispatch({ type: 'TOGGLE_CHAPTER_LIST' });
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    dispatch({ type: 'ADD_TOAST', payload: toast });
  }, []);
  
  const handleAddBookmark = useCallback(() => {
    dispatch({ type: 'ADD_BOOKMARK' });
    addToast({ message: 'Bookmark added!', type: 'success' });
  }, [addToast]);

  const handleDeleteBookmark = useCallback((id: string) => {
    dispatch({ type: 'DELETE_BOOKMARK', payload: id });
  }, []);

  const handleSelectBookmark = useCallback((bookmark: Bookmark) => {
    const book = state.books.find(b => b.id === bookmark.bookId);
    if (book) {
      const chapter = book.chapters.find(c => c.num === bookmark.chapterNum);
      if (chapter) {
        dispatch({ type: 'SET_SELECTED_BOOK', payload: book });
        dispatch({ type: 'SET_CURRENT_TRACK', payload: { book, chapter } });
        initialSeekTime.current = bookmark.progress;
        dispatch({ type: 'SET_PLAYING', payload: true });
        if (state.isChapterListVisible) {
          dispatch({ type: 'TOGGLE_CHAPTER_LIST' });
        }
      }
    }
  }, [state.books, state.isChapterListVisible]);

  const handleSetSleepTimer = useCallback((type: 'eoc' | number | null) => {
    if (sleepTimerIdRef.current) {
      clearTimeout(sleepTimerIdRef.current);
      sleepTimerIdRef.current = null;
    }
    
    dispatch({ type: 'SET_SLEEP_TIMER', payload: type });

    if (typeof type === 'number') {
      const timeoutId = setTimeout(() => {
        dispatch({ type: 'SET_PLAYING', payload: false });
        dispatch({ type: 'SET_SLEEP_TIMER', payload: null });
      }, type * 60 * 1000);
      sleepTimerIdRef.current = timeoutId;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.playbackRate = playbackRate;
    audio.volume = volume;

    const controlAudio = async () => {
      if (currentTrack) {
        if (audio.src !== currentTrack.chapter.url) {
          audio.src = currentTrack.chapter.url;
        }
        if (isPlaying) {
          try {
            await audio.play();
          } catch (error: any) {
            if (error.name !== 'AbortError') {
              console.error("Audio play failed:", error);
              dispatch({ type: 'SET_PLAYING', payload: false });
            }
          }
        } else {
          audio.pause();
        }
      } else {
        audio.pause();
      }
    };
    controlAudio();
  }, [currentTrack, isPlaying, playbackRate, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => dispatch({ type: 'SET_PROGRESS', payload: audio.currentTime });
    const updateDurationAndSeek = () => {
        if (!isNaN(audio.duration)) dispatch({ type: 'SET_DURATION', payload: audio.duration });
        if (initialSeekTime.current !== null && !isNaN(audio.duration)) {
            audio.currentTime = initialSeekTime.current;
            dispatch({ type: 'SET_PROGRESS', payload: initialSeekTime.current });
            initialSeekTime.current = null;
        }
    };
    const onEnded = () => playNextChapter();
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDurationAndSeek);
    audio.addEventListener('ended', onEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDurationAndSeek);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playNextChapter]);

  const handleSearchChange = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);


  return (
    <main>
      <div className="fixed top-4 right-4 z-50 w-full max-w-xs space-y-2">
        {toasts.map(toast => (
          <ToastComponent key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>

       <audio ref={audioRef} />
       
      {selectedBook && currentTrack ? (
        <BookView 
          book={selectedBook}
          bookmarks={bookmarks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          playbackRate={playbackRate}
          volume={volume}
          isChapterListVisible={isChapterListVisible}
          sleepTimerType={sleepTimerType}
          onBack={handleBackToGrid} 
          onSelectChapter={handleSelectChapter} 
          onPlayPause={handlePlayPause}
          onNext={playNextChapter}
          onPrev={playPrevChapter}
          onSeek={handleSeek}
          onRewind={handleRewind}
          onForward={handleForward}
          onPlaybackRateChange={handlePlaybackRateChange}
  onVolumeChange={handleVolumeChange}
          onToggleChapterList={handleToggleChapterList}
          onAddBookmark={handleAddBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onSelectBookmark={handleSelectBookmark}
          onSetSleepTimer={handleSetSleepTimer}
        />
      ) : (
        <div 
          className="min-h-screen w-full bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/img/hp-bg.jpg')" }}
        >
          <div className="min-h-screen w-full flex flex-col animate-fade-in bg-black/50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white drop-shadow-md">WhisperShelf</h1>
                    <p className="text-lg text-gray-200 mt-2 drop-shadow-md">Your personal audiobook library</p>
                </div>
                
                <div className="max-w-md mx-auto mb-4">
                    <Search value={searchQuery} onChange={handleSearchChange} />
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center pb-8">
                {isLoading ? (
                    <Loader />
                ) : filteredBooks.length > 0 ? (
                    <BookCarousel
                        books={filteredBooks}
                        onSelectBook={handleSelectBook}
                    />
                ) : (
                    <div className="text-center py-16 bg-black/30 rounded-lg px-8">
                        <p className="text-white">No books found for "{searchQuery}".</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;
