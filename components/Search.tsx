import React from 'react';
import { XIcon } from './Icons';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const Search: React.FC<SearchProps> = ({ value, onChange }) => {
  return (
    <div className="relative">
      <input
        type="search"
        placeholder="Search by title or author..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-4 pr-10 py-3 text-[#2D3748] bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#A686EC]"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#A0AEC0] hover:text-[#4A5568]"
          aria-label="Clear search"
        >
          <XIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};