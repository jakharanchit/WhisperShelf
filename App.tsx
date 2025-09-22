import React, { useEffect, useRef, useCallback, useReducer } from 'react';
import { Book, Chapter, CurrentTrack, Bookmark, Toast } from './types';
import { BookCarousel } from './components/BookCarousel';
import { BookView } from './components/BookView';
import { Toast as ToastComponent } from './components/Toast';
import { Search } from './components/Search';
import { Loader } from './components/Loader';
import { asset } from '@/utils/asset';
import { appReducer, initialState } from './state/player';

const PLAYER_STATE_KEY = 'audiobookPlayerState';
const BOOKMARKS_KEY = 'audiobookPlayerBookmarks';

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { filteredBooks, selectedBook, currentTrack, isPlaying, progress, duration, playbackRate, volume, isChapterListVisible, bookmarks, sleepTimerType, toasts, isLoading, searchQuery } = state;

  const audioRef = useRef<HTMLAudioElement>(null);
  const initialSeekTime = useRef<number | null>(null);
  const sleepTimerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefetchedNextSrcRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchAndRestoreState = async () => {
      try {
        const response = await fetch(asset('manifest.json'));
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
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Failed to load library manifest. Please check your connection and try again.', type: 'error' } });
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

  // Persist player state on tab hide/visibility change to avoid losing progress on abrupt closes
  useEffect(() => {
    const persist = () => {
      if (currentTrack) {
        const stateToSave = {
          bookId: currentTrack.book.id,
          chapterNum: currentTrack.chapter.num,
          progress,
          playbackRate,
          volume,
        };
        try {
          localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(stateToSave));
        } catch (_err) {
          // noop: best-effort persistence
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') persist();
    };

    const onPageHide = () => persist();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [currentTrack, progress, playbackRate, volume]);

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
          } catch (err) {
            if (!(err instanceof DOMException && err.name === 'AbortError')) {
              console.error("Audio play failed:", err);
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

  // Prefetch next chapter metadata when track changes (low overhead improvement)
  useEffect(() => {
    if (!state.currentTrack) return;
    const { book, chapter } = state.currentTrack;
    const currentIndex = book.chapters.findIndex((c) => c.num === chapter.num);
    if (currentIndex === -1) return;
    const next = book.chapters[currentIndex + 1];
    if (!next) return;
    if (prefetchedNextSrcRef.current === next.url) return;
    try {
      const a = new Audio();
      a.preload = 'metadata';
      a.src = next.url;
      a.load();
      prefetchedNextSrcRef.current = next.url;
    } catch (_) {
      // Best-effort prefetch, ignore errors
    }
  }, [state.currentTrack]);

  // Warm up the exact audio host with a preconnect link for the current track
  useEffect(() => {
    if (!state.currentTrack) return;
    try {
      const origin = new URL(state.currentTrack.chapter.url).origin;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    } catch (_) {
      // ignore
    }
  }, [state.currentTrack]);

  // Issue a tiny range request to warm DNS/TLS and caches for current track
  useEffect(() => {
    if (!state.currentTrack) return;
    const controller = new AbortController();
    const url = state.currentTrack.chapter.url;
    (async () => {
      try {
        await fetch(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          mode: 'cors',
          signal: controller.signal,
        });
      } catch (_) {
        // best-effort; ignore errors
      }
    })();
    return () => controller.abort();
  }, [state.currentTrack]);

  // Keyboard shortcuts for playback and navigation
  useEffect(() => {
    const isEditable = (el: Element | null) => {
      if (!el) return false;
      const node = el as HTMLElement;
      const tag = node.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      return !!node.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(document.activeElement)) return;
      if (!currentTrack) return;

      switch (e.key) {
        case ' ': // Space
        case 'k':
          e.preventDefault();
          dispatch({ type: 'SET_PLAYING', payload: !isPlaying });
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          if (audioRef.current) {
            const t = Math.max(0, audioRef.current.currentTime - 10);
            audioRef.current.currentTime = t;
            dispatch({ type: 'SET_PROGRESS', payload: t });
          }
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          if (audioRef.current) {
            const dur = duration || audioRef.current.duration || Number.POSITIVE_INFINITY;
            const t = Math.min(dur, audioRef.current.currentTime + 10);
            audioRef.current.currentTime = t;
            dispatch({ type: 'SET_PROGRESS', payload: t });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          dispatch({ type: 'SET_VOLUME', payload: Math.min(1, volume + 0.05) });
          break;
        case 'ArrowDown':
          e.preventDefault();
          dispatch({ type: 'SET_VOLUME', payload: Math.max(0, volume - 0.05) });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentTrack, isPlaying, volume, duration]);

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

       {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
       <audio ref={audioRef} preload={selectedBook && currentTrack ? 'auto' : 'metadata'} />
       
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
          isLoadingMetadata={duration === 0}
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
          style={{ backgroundImage: `url(${asset('img/hp-bg.jpg')})` }}
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
                        <p className="text-white">No books found for &quot;{searchQuery}&quot;.</p>
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
