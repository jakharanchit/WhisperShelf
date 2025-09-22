import React from 'react';
import { Book, Chapter, CurrentTrack } from '../types';
import { PlayIcon, PauseIcon } from './Icons';

interface ChapterListProps {
  book: Book;
  currentTrack: CurrentTrack | null;
  isPlaying: boolean;
  onSelectChapter: (book: Book, chapter: Chapter) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({ book, currentTrack, isPlaying, onSelectChapter }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-[#2D3748] mb-4 pb-2">Chapters</h2>
      <ul className="space-y-2">
        {book.chapters.map((chapter) => {
          const isCurrentChapter = currentTrack?.chapter.num === chapter.num && currentTrack?.book.id === book.id;
          const isCurrentlyPlaying = isCurrentChapter && isPlaying;
          
          return (
            <li key={chapter.num} className="">
              <button 
                type="button"
                onClick={() => onSelectChapter(book, chapter)}
                className="w-full flex items-center p-3 bg-white rounded-lg hover:bg-[#F0F5FF] transition-colors group"
                aria-current={isCurrentChapter ? 'true' : undefined}
              >
                <span className="flex-shrink-0 w-10 h-10 bg-[#E0E7FF] rounded-full flex items-center justify-center mr-4">
                  {isCurrentlyPlaying ? (
                     <PauseIcon className="w-5 h-5 text-[#A686EC]" />
                  ) : isCurrentChapter ? (
                     <PlayIcon className="w-5 h-5 text-[#A686EC]" />
                  ): (
                     <span className="text-[#718096] group-hover:text-[#2D3748]">{chapter.num}</span>
                  )}
                </span>
                <span className="flex-grow text-left">
                  <span className={`font-semibold ${isCurrentChapter ? 'text-[#A686EC]' : 'text-[#4A5568]'}`}>{chapter.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};