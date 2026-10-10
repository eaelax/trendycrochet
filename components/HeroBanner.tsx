'use client';

import { Search, X } from 'lucide-react';

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function HeroBanner({ searchQuery, onSearchChange }: HeroBannerProps) {
  return (
    <section className="pt-8 sm:pt-12 pb-6 px-4 text-center max-w-3xl mx-auto">
      {/* 70s-style retro bubble headline without navbar or text content */}
      <h1 className="font-shrikhand font-['Shrikhand',cursive] text-4xl sm:text-5xl md:text-6xl text-[#2D1C17] text-center tracking-wide leading-tight mb-6">
        Trendy Crochet Patterns
      </h1>

      {/* Clean, Flat Minimal Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search patterns..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-[#2D1C17] placeholder:text-stone-400 focus:outline-none focus:border-[#49B8BE]"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 rounded"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
}
