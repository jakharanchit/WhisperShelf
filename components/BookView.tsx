import React, { useState, useEffect, useRef } from 'react';
import { Book, Chapter, CurrentTrack, Bookmark } from '../types';
import { ChapterList } from './ChapterList';
import { 
    ChevronDownIcon, 
    PlayIcon, 
    PauseIcon, 
    NextIcon, 
    PreviousIcon, 
    RewindIcon, 
    ForwardIcon, 
    ListIcon, 
    MoonIcon, 
    MoonIconSolid,
    BookmarkIcon,
    TrashIcon,
    VolumeUpIcon,
    VolumeDownIcon,
    VolumeOffIcon
} from './Icons';
import { ProgressBar } from './ProgressBar';
import { asset } from '@/utils/asset';
import { formatTime } from '@/utils/format';

interface BookViewProps {
  book: Book;
  bookmarks: Bookmark[];
  currentTrack: CurrentTrack;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isChapterListVisible: boolean;
  sleepTimerType: 'eoc' | number | null;
  isLoadingMetadata: boolean;
  onBack: () => void;
  onSelectChapter: (book: Book, chapter: Chapter) => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onRewind: () => void;
  onForward: () => void;
  onPlaybackRateChange: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleChapterList: () => void;
  onAddBookmark: () => void;
  onDeleteBookmark: (id: string) => void;
  onSelectBookmark: (bookmark: Bookmark) => void;
  onSetSleepTimer: (type: 'eoc' | number | null) => void;
}


const FooterButton: React.FC<{buttonRef?: React.RefObject<HTMLButtonElement>, onClick?: () => void; children: React.ReactNode; label: string; active?: boolean}> = ({ buttonRef, onClick, children, label, active }) => (
    <button ref={buttonRef} onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-[#A686EC]' : 'text-[#718096] hover:text-[#8382EB]'}`}>
        {children}
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const VolumeControl: React.FC<{ volume: number; onVolumeChange: (volume: number) => void }> = ({ volume, onVolumeChange }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
  
    const VolumeIcon = volume === 0 ? VolumeOffIcon : volume < 0.5 ? VolumeDownIcon : VolumeUpIcon;
  
    // Close popover on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
          setIsPopoverOpen(false);
        }
      };
  
      if (isPopoverOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isPopoverOpen]);
  
    return (
      <div className="relative" ref={popoverRef}>
        {isPopoverOpen && (
          <div className="absolute bottom-full mb-4 w-32 bg-white p-2 rounded-lg shadow-lg left-1/2 -translate-x-1/2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#E0E7FF] rounded-lg appearance-none cursor-pointer accent-[#A686EC]"
            />
          </div>
        )}
        <FooterButton onClick={() => setIsPopoverOpen(p => !p)} label="Volume" active={isPopoverOpen}>
          <VolumeIcon className="w-6 h-6"/>
        </FooterButton>
      </div>
    );
};

const SleepTimerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSetTimer: (type: 'eoc' | number | null) => void;
  activeTimerType: 'eoc' | number | null;
  triggerRef: React.RefObject<HTMLButtonElement>;
}> = ({ isOpen, onClose, onSetTimer, activeTimerType, triggerRef }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modalNode = modalRef.current;
    if (!modalNode) return;
    const triggerEl = triggerRef.current;

    const focusableElements = modalNode.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerEl?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const options: {label: string; value: 'eoc' | number}[] = [
    { label: 'End of chapter', value: 'eoc' },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '60 minutes', value: 60 },
  ];

  return (
    <div className="absolute inset-0 bg-black/40 z-20 flex justify-center items-end animate-fade-in" role="button" aria-label="Close" tabIndex={0} onClick={(e) => { if (e.currentTarget === e.target) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onClose(); }}>
      <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="sleep-title" className="bg-white w-full max-w-md rounded-t-2xl p-4 shadow-2xl">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <h3 id="sleep-title" className="text-lg font-bold text-center text-[#2D3748] mb-4">Sleep Timer</h3>
        <ul className="space-y-2">
          {options.map(opt => (
            <li key={opt.value}>
              <button 
                onClick={() => { onSetTimer(opt.value); onClose(); }} 
                className={`w-full text-left p-3 rounded-lg font-semibold ${activeTimerType === opt.value ? 'bg-[#E0E7FF] text-[#A686EC]' : 'hover:bg-[#F0F5FF] text-[#4A5568]'}`}
              >
                {opt.label}
              </button>
            </li>
          ))}
          {activeTimerType && (
            <li>
              <button 
                onClick={() => { onSetTimer(null); onClose(); }} 
                className="w-full text-left p-3 mt-2 rounded-lg font-semibold text-red-600 hover:bg-red-50"
              >
                Turn off timer
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};


export const BookView: React.FC<BookViewProps> = ({ 
    book, 
    bookmarks,
    currentTrack, 
    isPlaying,
    progress,
    duration,
    playbackRate,
    volume,
    isChapterListVisible,
    sleepTimerType,
    isLoadingMetadata,
    onBack, 
    onSelectChapter,
    onPlayPause,
    onNext,
    onPrev,
    onSeek,
    onRewind,
    onForward,
    onPlaybackRateChange,
    onVolumeChange,
    onToggleChapterList,
    onAddBookmark,
    onDeleteBookmark,
    onSelectBookmark,
    onSetSleepTimer,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'bookmarks'>('chapters');
  const [isSleepModalVisible, setIsSleepModalVisible] = useState(false);

  const chapterListButtonRef = useRef<HTMLButtonElement>(null);
  const sleepButtonRef = useRef<HTMLButtonElement>(null);
  const chapterListModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isChapterListVisible) return;

    const modalNode = chapterListModalRef.current;
    if (!modalNode) return;
    const triggerEl = chapterListButtonRef.current;

    const focusableElements = modalNode.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onToggleChapterList();
      }
      if (e.key === 'Tab') {
        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerEl?.focus();
    };
  }, [isChapterListVisible, onToggleChapterList]);
  
  return (
    <div className="h-screen w-screen bg-white flex flex-col font-sans animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col flex-grow">

            {/* Header */}
            <header className="flex-shrink-0 flex justify-between items-center py-4">
                <button onClick={onBack} className="p-2 -ml-2 text-[#718096] hover:text-[#2D3748]" aria-label="Back to bookshelf">
                    <ChevronDownIcon className="w-7 h-7" />
                </button>
                <div className="text-center">
                    <p className="text-sm text-[#718096]">Playing from</p>
                    <p className="font-bold text-[#2D3748]">{book.title}</p>
                </div>
                <div className="w-11 h-11" aria-hidden="true"></div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-around gap-4">
                <div className="flex-shrink-0 w-full max-w-sm">
                    <img
                        src={asset(book.cover)}
                        alt={book.title}
                        className="w-full rounded-lg shadow-2xl aspect-square object-cover"
                    />
                </div>
                
                <div className="text-center w-full px-4">
                    <h1 className="text-2xl lg:text-3xl font-bold text-[#2D3748] truncate">{currentTrack.chapter.title}</h1>
                    <p className="text-lg text-[#718096] mt-1">{book.author}</p>
                </div>

                <div className="w-full max-w-sm">
                    <ProgressBar progress={progress} duration={duration} onSeek={onSeek} />
                    {isLoadingMetadata && (
                      <div className="mt-2 flex items-center justify-center gap-2" role="status" aria-live="polite">
                        <span className="inline-block w-4 h-4 border-2 border-[#A686EC] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-[#718096]">Loading audio…</span>
                      </div>
                    )}
                </div>
                
                {/* Main Controls */}
                <div className="flex items-center justify-center gap-4 w-full">
                    <button onClick={onPrev} className="text-[#4A5568] hover:text-[#2D3748] transition-colors" aria-label="Previous chapter"><PreviousIcon className="w-9 h-9" /></button>
                    <button onClick={onRewind} className="relative text-[#4A5568] hover:text-[#2D3748] transition-colors" aria-label="Rewind 30 seconds">
                        <RewindIcon className="w-11 h-11"/>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#4A5568]" style={{fontSize: '10px'}}>30</span>
                    </button>
                    <button onClick={onPlayPause} className="w-20 h-20 flex items-center justify-center bg-[#A686EC] rounded-full text-white hover:bg-[#8382EB] transition-colors shadow-lg" aria-label={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
                    </button>
                    <button onClick={onForward} className="relative text-[#4A5568] hover:text-[#2D3748] transition-colors" aria-label="Forward 30 seconds">
                        <ForwardIcon className="w-11 h-11"/>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#4A5568]" style={{fontSize: '10px'}}>30</span>
                    </button>
                    <button onClick={onNext} className="text-[#4A5568] hover:text-[#2D3748] transition-colors" aria-label="Next chapter"><NextIcon className="w-9 h-9" /></button>
                </div>
            </main>

            {/* Footer Controls */}
            <footer className="flex-shrink-0 flex justify-around items-center pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-gray-200">
                <FooterButton onClick={onPlaybackRateChange} label="Speed">
                    <span className="text-sm font-bold tracking-tighter w-6 h-6 flex items-center justify-center">{playbackRate}x</span>
                </FooterButton>
                <FooterButton buttonRef={chapterListButtonRef} onClick={onToggleChapterList} label="Chapters">
                    <ListIcon className="w-6 h-6"/>
                </FooterButton>
                <VolumeControl volume={volume} onVolumeChange={onVolumeChange} />
                 <FooterButton buttonRef={sleepButtonRef} onClick={() => setIsSleepModalVisible(true)} label="Sleep" active={!!sleepTimerType}>
                    {sleepTimerType ? <MoonIconSolid className="w-6 h-6"/> : <MoonIcon className="w-6 h-6"/>}
                </FooterButton>
                <FooterButton onClick={onAddBookmark} label="Bookmark">
                    <BookmarkIcon className="w-6 h-6"/>
                </FooterButton>
            </footer>
        </div>

        {/* Chapter List Modal */}
        {isChapterListVisible && (
            <div 
                className="absolute inset-0 bg-black/40 z-10 animate-fade-in"
                role="button"
                aria-label="Close"
                tabIndex={0}
                onClick={(e) => { if (e.currentTarget === e.target) onToggleChapterList(); }}
                onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onToggleChapterList(); }}
            >
                <div 
                    ref={chapterListModalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="chapters-title"
                    className="absolute bottom-0 left-0 right-0 max-h-[80%] bg-white rounded-t-2xl p-4 overflow-y-auto shadow-2xl flex flex-col"
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 flex-shrink-0"></div>
                    <h2 id="chapters-title" className="sr-only">Chapters and Bookmarks</h2>
                    
                    <div className="border-b border-gray-200 mb-4 flex-shrink-0">
                        <nav className="-mb-px flex space-x-6">
                            <button
                                onClick={() => setActiveTab('chapters')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'chapters' ? 'border-[#A686EC] text-[#A686EC]' : 'border-transparent text-[#718096] hover:text-[#8382EB] hover:border-[#8382EB]'}`}
                            >
                                Chapters
                            </button>
                            <button
                                onClick={() => setActiveTab('bookmarks')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'bookmarks' ? 'border-[#A686EC] text-[#A686EC]' : 'border-transparent text-[#718096] hover:text-[#8382EB] hover:border-[#8382EB]'}`}
                            >
                                Bookmarks
                            </button>
                        </nav>
                    </div>

                    <div className="overflow-y-auto">
                        {activeTab === 'chapters' && (
                            <ChapterList 
                                book={book} 
                                currentTrack={currentTrack} 
                                isPlaying={isPlaying} 
                                onSelectChapter={onSelectChapter}
                            />
                        )}
                        {activeTab === 'bookmarks' && (
                             <div>
                                <h2 className="text-2xl font-bold text-[#2D3748] mb-4 pb-2">Bookmarks</h2>
                                {bookmarks.length > 0 ? (
                                    <ul className="space-y-2">
                                        {bookmarks.map(bookmark => (
                                            <li key={bookmark.id} className="flex items-center p-3 bg-white rounded-lg group">
                                                <button type="button" className="flex-grow text-left" onClick={() => onSelectBookmark(bookmark)}>
                                                    <p className="font-semibold text-[#4A5568]">{bookmark.chapterTitle}</p>
                                                    <p className="text-sm text-[#718096]">{bookmark.bookTitle} - at {formatTime(bookmark.progress)}</p>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDeleteBookmark(bookmark.id); }} 
                                                    className="p-2 -mr-2 text-[#A0AEC0] hover:text-red-500 transition-colors" 
                                                    aria-label="Delete bookmark"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-[#718096] text-center py-8">You haven&apos;t saved any bookmarks yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        <SleepTimerModal 
            isOpen={isSleepModalVisible} 
            onClose={() => setIsSleepModalVisible(false)} 
            onSetTimer={onSetSleepTimer}
            activeTimerType={sleepTimerType}
            triggerRef={sleepButtonRef}
        />
    </div>
  );
};