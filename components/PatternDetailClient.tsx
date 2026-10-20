'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Star } from 'lucide-react';
import { Pattern } from '@/lib/types';
import DownloadSteps from './DownloadSteps';

interface PatternDetailClientProps {
  pattern: Pattern;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80';

export default function PatternDetailClient({ pattern }: PatternDetailClientProps) {
  const [imageError, setImageError] = useState(false);

  const displayImage = imageError
    ? FALLBACK_IMAGE
    : (pattern.image_url || FALLBACK_IMAGE);

  const reviewCount = pattern.reviews_count ?? 128;

  return (
    <div className="px-4 py-4 sm:py-6 max-w-5xl mx-auto">
      {/* Back navigation */}
      <div className="mb-3 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to patterns</span>
        </Link>
      </div>

      {/* 2-Column Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
        {/* LEFT COLUMN: Shrunken height on mobile screens with zero hover effects */}
        <div className="relative w-full h-[220px] sm:h-auto sm:aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/60 shadow-sm">
          <Image
            src={displayImage}
            alt={pattern.title}
            fill
            priority
            className="object-cover pointer-events-none select-none"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* RIGHT COLUMN: Pattern details & download action */}
        <div className="flex flex-col h-full gap-5 sm:gap-6">
          <div>
            {/* 1. Category & Difficulty Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
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

            {/* 4. Centered FREE & old price banner */}
            <div className="bg-[#FAF6F0] border border-stone-200/70 rounded-2xl p-3 sm:p-3.5 mb-4 sm:mb-6 flex items-center justify-center text-center shadow-xs">
              <div className="flex items-center justify-center gap-2.5">
                <span className="text-xl sm:text-2xl font-extrabold text-[#E65F43] tracking-wide">FREE</span>
                <span className="line-through text-stone-400 text-sm sm:text-base font-normal">$2.00</span>
              </div>
            </div>

            {/* 5. Specs Box */}
            <div className="bg-[#F8F6F1] border border-stone-200/60 rounded-xl p-3.5 sm:p-4 space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-stone-700 font-normal mb-4 sm:mb-5">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Format</span>
                <span className="font-semibold text-stone-900">High-Res Printable PDF</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-200/50 pt-2">
                <span className="text-stone-600">File Size</span>
                <span className="font-semibold text-stone-900 font-mono">{pattern.pdf_size}</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-200/50 pt-2">
                <span className="text-stone-600">Instant Access</span>
                <span className="font-semibold text-[#E65F43]">✓ Free Instant Unlock</span>
              </div>
            </div>

            {/* 6. Description */}
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-5 sm:mb-6 font-normal">
              {pattern.description ||
                'Download the full printable PDF pattern with exact stitch counts, step-by-step instructions, and photo tutorial.'}
            </p>
          </div>

          {/* 7. CTAs without hover effects */}
          <div className="space-y-3 pt-1">
            <div>
              <a
                href={pattern.cpa_locker_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#222222] text-white font-medium py-3.5 px-6 rounded-full text-center block text-sm tracking-wide shadow-sm cursor-pointer"
              >
                FREE DOWNLOAD NOW
              </a>
              <p className="text-[11px] text-stone-600 text-center mt-1.5 font-normal">
                Instant access unlocked after completing a quick 30-sec verification
              </p>
            </div>

            {pattern.gumroad_url && (
              <div>
                <a
                  href={pattern.gumroad_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#E65F43] text-white font-bold py-3 px-6 rounded-full text-center block text-xs sm:text-sm tracking-wide cursor-pointer"
                >
                  BUY IT NOW $2.00
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-Step Guide Section directly below */}
      <div className="mt-8">
        <DownloadSteps />
      </div>
    </div>
  );
}
