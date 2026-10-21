'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Star, FileText } from 'lucide-react';
import { Pattern } from '@/lib/types';

interface PatternCardProps {
  pattern: Pattern;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80';

function cleanImageUrl(url?: string): string {
  if (!url) return FALLBACK_IMAGE;
  let clean = url.trim();
  clean = clean.replace(/\[img\]/gi, '').replace(/\[\/img\]/gi, '').trim();
  return clean || FALLBACK_IMAGE;
}

export default function PatternCard({ pattern }: PatternCardProps) {
  const [imageError, setImageError] = useState(false);

  const rawUrl = cleanImageUrl(pattern.image_url);
  const displayImage = imageError ? FALLBACK_IMAGE : rawUrl;
  const reviewCount = pattern.reviews_count ?? 128;

  return (
    <div className="flex flex-col h-full bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200/70 shadow-xs relative hover:border-stone-400 transition-all">
      {/* 1. Square pattern image covering the whole image container */}
      <Link
        href={`/${pattern.slug}`}
        className="block relative w-full aspect-square rounded-xl overflow-hidden bg-stone-100"
      >
        <Image
          src={displayImage}
          alt={pattern.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {pattern.is_best_seller && (
          <span className="absolute top-2.5 left-2.5 bg-[#E65F43] text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm z-10">
            Best Seller
          </span>
        )}
      </Link>

      {/* 2. Metadata beneath the image */}
      <div className="pt-3 flex flex-col flex-1 justify-between">
        <div>
          {/* Row 1: Title */}
          <Link href={`/${pattern.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-semibold text-stone-900 line-clamp-1 hover:text-[#E65F43] transition-colors">
              {pattern.title}
            </h3>
          </Link>

          {/* Row 2: Centered and highly visible FREE & old price */}
          <div className="text-sm sm:text-base font-normal text-stone-900 mt-2 mb-1 flex items-center justify-center gap-2">
            <span className="text-[#E65F43] bg-[#E65F43]/10 px-2 py-0.5 rounded text-xs sm:text-sm font-bold uppercase tracking-wide">FREE</span>
            <span className="line-through text-stone-400 text-xs sm:text-sm font-normal">$2.00</span>
          </div>

          {/* Row 3: Rating (Amber), Size (Indigo), and Downloads (Emerald) */}
          {(() => {
            let hash = 0;
            for (let i = 0; i < pattern.id.length; i++) {
              hash = (hash << 5) - hash + pattern.id.charCodeAt(i);
              hash |= 0;
            }
            const downloadsCount = 20 + Math.abs(hash) % 81;
            return (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-900 font-normal mt-1 flex-wrap">
                {/* Rating with Amber Star */}
                <span className="flex items-center gap-0.5 text-stone-800">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{pattern.rating ?? 5}</span>
                  <span className="text-stone-400 text-[10px]">({reviewCount})</span>
                </span>
                <span className="text-stone-300">·</span>
                {/* Size with Indigo FileText */}
                <span className="flex items-center gap-0.5 text-stone-700">
                  <FileText className="w-3 h-3 text-indigo-600" />
                  <span>{pattern.pdf_size || '3.5 MB'}</span>
                </span>
                <span className="text-stone-300">·</span>
                {/* Downloads with Emerald Download */}
                <span className="flex items-center gap-0.5 text-emerald-700 font-normal">
                  <Download className="w-3 h-3 text-emerald-600" />
                  <span>{downloadsCount} downloads</span>
                </span>
              </div>
            );
          })()}
        </div>

        {/* Row 4: Dedicated DOWNLOAD Button */}
        <div className="pt-3 mt-1">
          <Link
            href={`/${pattern.slug}`}
            className="w-full py-3 px-3 bg-[#E65F43] hover:bg-[#d04e33] text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>GET PATTERN NOW</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
