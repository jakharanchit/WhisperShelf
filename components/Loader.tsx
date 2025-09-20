import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-16 h-16 border-4 border-[#A686EC] border-t-[#8382EB] rounded-full animate-spin"></div>
    </div>
  );
};