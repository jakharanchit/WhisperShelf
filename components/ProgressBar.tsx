import React, { useRef } from 'react';

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, duration, onSeek }) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    onSeek(duration * percentage);
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const remainingTime = duration - progress;

  return (
    <div className="w-full px-1">
        <div
            ref={progressBarRef}
            className="w-full h-1.5 bg-[#E0E7FF] rounded-full cursor-pointer group"
            onClick={handleSeek}
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