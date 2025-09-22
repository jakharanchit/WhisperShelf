import React, { useState, useEffect } from 'react';
import { Toast as ToastType } from '../types';
import { XIcon } from './Icons';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      const remove = setTimeout(() => onDismiss(toast.id), 300);
      return () => clearTimeout(remove);
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300); // Wait for animation to finish
  };

  const isSuccess = toast.type === 'success';
  const bgColor = isSuccess ? 'bg-[#77DAE6]' : 'bg-red-500';
  const textColor = isSuccess ? 'text-[#004D40]' : 'text-white';


  return (
    <div
      className={`relative flex items-center justify-between w-full p-4 rounded-lg shadow-lg ${bgColor} ${textColor} ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="font-semibold">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="p-1 -mr-2 rounded-full hover:bg-black/10 transition-colors"
        aria-label="Dismiss"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
};