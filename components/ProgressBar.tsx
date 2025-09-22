import React, { useRef } from 'react';
import { formatTime } from '@/utils/format';

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, duration, onSeek }) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleSeek = (clientX: number) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    onSeek(duration * percentage);
  };

  const onClickBar = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSeek(e.clientX);
  };

  const onKeyDownBar = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!duration) return;
    if (e.key === 'Home') {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSeek(duration);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSeek(Math.max(0, progress - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSeek(Math.min(duration, progress + 5));
    }
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const remainingTime = duration - progress;

  return (
    <div className="w-full px-1">
        <div
            ref={progressBarRef}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration) || 0}
            aria-valuenow={Math.floor(progress) || 0}
            aria-valuetext={`${formatTime(progress)} elapsed`}
            tabIndex={0}
            className="w-full h-1.5 bg-[#E0E7FF] rounded-full cursor-pointer group"
            onClick={onClickBar}
            onKeyDown={onKeyDownBar}
        >
            <div
            className="h-1.5 bg-[#A686EC] rounded-full relative"
            style={{ width: `${progressPercentage}%` }}
            >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-[#A686EC] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
        </div>
        <div className="flex justify-between mt-1.5">
            <span className="text-xs text-[#718096] font-mono">{formatTime(progress)}</span>
            <span className="text-xs text-[#718096] font-mono">-{formatTime(remainingTime)}</span>
        </div>
    </div>
  );
};