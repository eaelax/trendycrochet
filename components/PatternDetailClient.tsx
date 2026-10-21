'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Star, ShoppingBag } from 'lucide-react';
import { Pattern } from '@/lib/types';
import DownloadSteps from './DownloadSteps';

interface PatternDetailClientProps {
  pattern: Pattern;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80';

function cleanImageUrl(url?: string): string {
  if (!url) return FALLBACK_IMAGE;
  let clean = url.trim();
  clean = clean.replace(/\[img\]/gi, '').replace(/\[\/img\]/gi, '').trim();
  return clean || FALLBACK_IMAGE;
}

export default function PatternDetailClient({ pattern }: PatternDetailClientProps) {
  const [imageError, setImageError] = useState(false);

  const rawUrl = cleanImageUrl(pattern.image_url);
  const displayImage = imageError ? FALLBACK_IMAGE : rawUrl;
  const reviewCount = pattern.reviews_count ?? 128;
  const gumroadLink = pattern.gumroad_url?.trim() || `https://gumroad.com/l/${pattern.slug}`;

  return (
    <div className="px-4 py-4 sm:py-6 max-w-5xl mx-auto">
      {/* Back navigation - Zero hover effect */}
      <div className="mb-3 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to patterns</span>
        </Link>
      </div>

      {/* 2-Column Container - items-stretch to align left and right column heights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-stretch max-w-5xl mx-auto">
        {/* LEFT COLUMN: Shrunken height to fit the exact height of the right data container */}
        <div className="relative w-full h-[220px] sm:h-[260px] md:h-full min-h-[220px] md:min-h-0 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/60 shadow-sm">
          <Image
            src={displayImage}
            alt={pattern.title}
            fill
            unoptimized
            priority
            className="object-cover pointer-events-none select-none"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* RIGHT COLUMN: Pattern details & download action */}
        <div className="flex flex-col justify-between gap-5 sm:gap-6 h-full">
          <div>
            {/* 1. Category & Difficulty Tags */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7D3EAB] bg-[#BF8CE3]/20 px-2.5 py-0.5 rounded-full">
                {pattern.difficulty_tag || 'Beginner Friendly'}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs font-normal text-stone-600">
                Printable PDF Guide
              </span>
            </div>

            {/* 2. Title */}
            <h1 className="font-serif text-2xl sm:text-4xl text-stone-900 leading-tight mb-2 sm:mb-3 font-bold">
              {pattern.title}
            </h1>

            {/* 3. Rating (Amber), Size (Indigo) & Downloads (Emerald) */}
            {(() => {
              let hash = 0;
              for (let i = 0; i < pattern.id.length; i++) {
                hash = (hash << 5) - hash + pattern.id.charCodeAt(i);
                hash |= 0;
              }
              const downloadsCount = 20 + Math.abs(hash) % 81;
              return (
                <div className="flex items-center gap-2 mb-3 sm:mb-4 text-xs font-normal text-stone-900 flex-wrap">
                  {/* Rating with Amber Star */}
                  <span className="flex items-center gap-1 text-stone-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-semibold">{pattern.rating ?? 5}</span>
                    <span className="text-stone-500">({reviewCount} reviews)</span>
                  </span>
                  <span className="text-stone-300">·</span>
                  {/* Size with Indigo FileText */}
                  <span className="flex items-center gap-1 text-stone-700">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{pattern.pdf_size || '3.5 MB'}</span>
                  </span>
                  <span className="text-stone-300">·</span>
                  {/* Downloads with Emerald Download */}
                  <span className="flex items-center gap-1 text-emerald-700 font-normal">
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{downloadsCount} downloads</span>
                  </span>
                </div>
              );
            })()}

            {/* 4. Description */}
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
              {pattern.description ||
                'Download the full printable PDF pattern with stitch counts, yarn recommendations, and high-resolution photo tutorials.'}
            </p>

            {/* 5. Highlight Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-[#FAF9F5] border border-stone-200/60 px-3 py-1.5 rounded-lg text-stone-700 font-medium">
                Instant PDF Delivery
              </span>
              <span className="bg-[#FAF9F5] border border-stone-200/60 px-3 py-1.5 rounded-lg text-stone-700 font-medium">
                Step-by-step instructions
              </span>
              <span className="bg-[#FAF9F5] border border-stone-200/60 px-3 py-1.5 rounded-lg text-stone-700 font-medium">
                Mobile &amp; Print Ready
              </span>
            </div>
          </div>

          {/* Action Buttons: Zero hover effects */}
          <div className="bg-[#FAF9F5] border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
            <a
              href={pattern.cpa_locker_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-[#E65F43] text-white text-xs sm:text-sm font-bold rounded-xl text-center flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[3]" />
              <span>DOWNLOAD PDF FREE</span>
            </a>

            <a
              href={gumroadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-stone-900 text-white text-xs sm:text-sm font-bold rounded-xl text-center flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>BUY PDF NOW $2.00</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3-Step Guide Section beneath pattern */}
      <div className="mt-12 sm:mt-16">
        <DownloadSteps />
      </div>
    </div>
  );
}
