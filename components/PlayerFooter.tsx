import React from 'react';
import { CurrentTrack } from '../types';
import { PlayIcon, PauseIcon, NextIcon, PreviousIcon } from './Icons';
import { ProgressBar } from './ProgressBar';
import { asset } from '@/utils/asset';

interface PlayerFooterProps {
  currentTrack: CurrentTrack;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playbackRate: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onPlaybackRateChange: () => void;
}

export const PlayerFooter: React.FC<PlayerFooterProps> = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  playbackRate,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onPlaybackRateChange,
}) => {
  const { book, chapter } = currentTrack;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-800/80 backdrop-blur-md border-t border-gray-700 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-24">
          <div className="flex items-center gap-4 w-1/4">
            <img src={asset(book.cover)} alt={book.title} className="w-16 h-16 rounded-md shadow-lg" />
            <div>
              <p className="font-bold text-white truncate">{chapter.title}</p>
              <p className="text-sm text-gray-400 truncate">{book.title}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 w-1/2">
            <div className="flex items-center gap-6">
              <button onClick={onPrev} className="text-gray-300 hover:text-white transition-colors" aria-label="Previous chapter"><PreviousIcon className="w-7 h-7" /></button>
              <button onClick={onPlayPause} className="w-14 h-14 flex items-center justify-center bg-indigo-500 rounded-full text-white hover:bg-indigo-400 transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
              </button>
              <button onClick={onNext} className="text-gray-300 hover:text-white transition-colors" aria-label="Next chapter"><NextIcon className="w-7 h-7" /></button>
            </div>
            <ProgressBar progress={progress} duration={duration} onSeek={onSeek} />
          </div>
          <div className="w-1/4 flex items-center justify-end">
            <button
                onClick={onPlaybackRateChange}
                className="text-sm font-semibold text-gray-300 bg-gray-700/50 hover:bg-gray-700 w-16 h-9 rounded-md transition-colors"
                aria-label={`Change playback speed. Current speed: ${playbackRate}x`}
             >
                {playbackRate}x
             </button>
          </div>
        </div>
      </div>
    </footer>
  );
};