import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { asset } from '@/utils/asset';

interface BookCarouselProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export const BookCarousel: React.FC<BookCarouselProps> = ({ books, onSelectBook }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // When the list of books changes (e.g., from search), ensure the index is not out of bounds.
    if (currentIndex >= books.length && books.length > 0) {
      setCurrentIndex(books.length - 1);
    }
  }, [books, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? books.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === books.length - 1 ? 0 : prevIndex + 1));
  };
  
  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  }

  return (
    <div className="relative w-full flex flex-col items-center justify-center py-4">
        <div className="relative w-full h-[50vh] max-h-[450px] flex items-center justify-center overflow-hidden">
            {/* Carousel Items */}
            <div className="relative w-full h-full">
                {books.map((book, index) => {
                    const offset = index - currentIndex;
                    const distance = Math.abs(offset);
                    const isVisible = distance <= 2;
                    const isCurrent = offset === 0;

                    if (!isVisible) return null; // render window only

                    const scale = 1 - distance * 0.15;
                    const opacity = 1 - distance * 0.3;
                    const zIndex = books.length - distance;
                    const translateX = offset * 35; // %

                    return (
                        <div
                            key={book.id}
                            role={!isCurrent ? 'button' : undefined}
                            tabIndex={!isCurrent ? 0 : -1}
                            aria-label={!isCurrent ? `Focus ${book.title}` : undefined}
                            className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-out flex justify-center items-center ${!isCurrent ? 'cursor-pointer' : ''}`}
                            style={{
                                transform: `translateX(${translateX}%) scale(${scale})`,
                                opacity: opacity,
                                zIndex: zIndex,
                            }}
                            onClick={() => {
                                if (!isCurrent) {
                                    setCurrentIndex(index);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (!isCurrent && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    setCurrentIndex(index);
                                }
                            }}
                        >
                            <div 
                                role={isCurrent ? 'button' : undefined}
                                tabIndex={isCurrent ? 0 : -1}
                                aria-label={isCurrent ? `Open ${book.title}` : undefined}
                                className={`relative aspect-[2/3] h-full max-h-full transition-shadow duration-500 ${isCurrent ? 'cursor-pointer shadow-2xl' : 'shadow-lg'}`}
                                onClick={() => { if(isCurrent) onSelectBook(book) }}
                                onKeyDown={(e) => { if (isCurrent && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectBook(book); } }}
                            >
                                <img
                                    src={asset(book.cover)}
                                    alt={book.title}
                                    loading="lazy"
                                    className="w-full h-full object-cover rounded-2xl"
                                />
                                <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${isCurrent ? 'bg-black/10' : 'bg-black/50'}`}></div>
                                <div className={`absolute bottom-0 left-0 right-0 p-6 text-white transition-opacity duration-500 ${isCurrent ? 'opacity-100' : 'opacity-0'}`}>
                                    <h3 className="text-2xl font-bold truncate">{book.title}</h3>
                                    <p className="text-md">{book.author}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Navigation Arrows */}
        <button
            onClick={handlePrev}
            className="absolute left-0 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 bg-white/60 hover:bg-white rounded-full p-2.5 shadow-md transition-all duration-300"
            aria-label="Previous book"
        >
            <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
        </button>
        <button
            onClick={handleNext}
            className="absolute right-0 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 bg-white/60 hover:bg-white rounded-full p-2.5 shadow-md transition-all duration-300"
            aria-label="Next book"
        >
            <ChevronRightIcon className="w-6 h-6 text-gray-800" />
        </button>

        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
            {books.map((_, index) => (
                <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'w-5 bg-[#A686EC]' : 'bg-gray-300 hover:bg-gray-400'}`}
                    aria-label={`Go to book ${index + 1}`}
                />
            ))}
        </div>
    </div>
  );
};