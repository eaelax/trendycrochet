'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, Heart, Sparkles, Printer, Search, X } from 'lucide-react';
import { Pattern } from '@/lib/types';

interface HeroBannerProps {
  featuredPattern?: Pattern;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1600&q=80';

export default function HeroBanner({
  searchQuery,
  onSearchChange,
}: HeroBannerProps) {
  const [imgSrc, setImgSrc] = useState(HERO_IMAGE_URL);

  return (
    <section className="w-full pt-2 sm:pt-4 pb-8 sm:pb-16 px-3 sm:px-6 md:px-8 bg-white">
      {/* 1. Main Hero Container with shrunken height on mobile */}
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden h-[160px] min-h-[160px] sm:h-auto sm:min-h-[300px] md:min-h-[350px] bg-stone-900">
          <Image
            src={imgSrc}
            alt="Crochet Art"
            fill
            priority
            onError={() => setImgSrc(HERO_IMAGE_URL)}
            className="object-cover opacity-90"
            referrerPolicy="no-referrer"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {/* Subtle gradient overlay to make text pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-900/30 to-transparent flex flex-col justify-end p-4 sm:p-10">
            <span className="text-amber-300 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-0.5 sm:mb-1">
              Handcrafted Collection
            </span>
            <h1 className="text-white text-base sm:text-3xl md:text-5xl font-extrabold max-w-2xl leading-tight drop-shadow-sm">
              Free Modern Printable Crochet Patterns
            </h1>
            <p className="text-stone-200 text-xs sm:text-sm max-w-xl mt-1 sm:mt-2 drop-shadow-sm hidden sm:block">
              Instantly download beautifully illustrated, beginner-to-intermediate stitch guides.
            </p>
          </div>
          {/* Scroll CTA with vibrant orange background */}
          <div className="absolute bottom-6 right-6 z-10 hidden sm:block">
            <a
              href="#patterns"
              className="text-white text-xs sm:text-sm font-bold bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-full shadow-lg border border-white/30 backdrop-blur-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Scroll to patterns</span>
              <span>↓</span>
            </a>
          </div>
        </div>

        {/* 2. Four Trust Badges below Hero: compact & same-line icon + text on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-8 pt-3 sm:pt-12 pb-2 sm:pb-4 px-1 sm:px-4">
          {/* Badge 1 */}
          <div className="flex items-center justify-center gap-1.5 sm:flex-col sm:items-center sm:gap-0 bg-stone-50/70 sm:bg-transparent py-1.5 px-2 rounded-lg sm:p-0">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-emerald-600 sm:mb-2 shrink-0" />
            <h4 className="text-[11px] sm:text-sm font-semibold text-stone-900 whitespace-nowrap">
              100% Free access
            </h4>
          </div>

          {/* Badge 2 */}
          <div className="flex items-center justify-center gap-1.5 sm:flex-col sm:items-center sm:gap-0 bg-stone-50/70 sm:bg-transparent py-1.5 px-2 rounded-lg sm:p-0">
            <Heart className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-rose-500 sm:mb-2 shrink-0" />
            <h4 className="text-[11px] sm:text-sm font-semibold text-stone-900 whitespace-nowrap">
              Beginner friendly
            </h4>
          </div>

          {/* Badge 3 */}
          <div className="flex items-center justify-center gap-1.5 sm:flex-col sm:items-center sm:gap-0 bg-stone-50/70 sm:bg-transparent py-1.5 px-2 rounded-lg sm:p-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-amber-500 sm:mb-2 shrink-0" />
            <h4 className="text-[11px] sm:text-sm font-semibold text-stone-900 whitespace-nowrap">
              Tested stitch quality
            </h4>
          </div>

          {/* Badge 4 */}
          <div className="flex items-center justify-center gap-1.5 sm:flex-col sm:items-center sm:gap-0 bg-stone-50/70 sm:bg-transparent py-1.5 px-2 rounded-lg sm:p-0">
            <Printer className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-sky-600 sm:mb-2 shrink-0" />
            <h4 className="text-[11px] sm:text-sm font-semibold text-stone-900 whitespace-nowrap">
              Printable PDF
            </h4>
          </div>
        </div>

        {/* 3. Search Bar for filtering */}
        <div id="search" className="pt-2 sm:pt-4 max-w-md mx-auto px-1 sm:px-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search patterns (cardigan, tote bag, floral, plushie)..."
              className="w-full pl-11 pr-10 py-2.5 sm:py-3 bg-white border-2 border-stone-300 rounded-full text-xs sm:text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-[#E65F43] shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
