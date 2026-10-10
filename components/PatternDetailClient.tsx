'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { Pattern } from '@/lib/types';
import DownloadSteps from './DownloadSteps';

interface PatternDetailClientProps {
  pattern: Pattern;
}

export default function PatternDetailClient({ pattern }: PatternDetailClientProps) {
  const [imageError, setImageError] = useState(false);

  const displayImage = imageError
    ? '/images/hero-crochet.jpg'
    : (pattern.image_url || '/images/hero-crochet.jpg');

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      {/* Back navigation */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#2D1C17] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to patterns</span>
        </Link>
      </div>

      {/* 2-Column Container: items-stretch forces both columns to equal height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        {/* LEFT COLUMN: Matches right column's height exactly */}
        <div className="relative w-full min-h-[350px] md:min-h-0 rounded-2xl overflow-hidden border border-stone-200 bg-[#FAF5EC]">
          <Image
            src={displayImage}
            alt={pattern.title}
            fill
            priority
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* RIGHT COLUMN: Natural content flow with flex column */}
        <div className="flex flex-col justify-between py-1">
          <div>
            {/* 1. Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-[#E65F43]/15 text-[#D1462A] text-xs font-bold px-2.5 py-0.5 rounded-md">
                FREE
              </span>
              <span className="bg-[#BF8CE3]/20 text-[#7D3EAB] text-xs font-bold px-2.5 py-0.5 rounded-md">
                {pattern.difficulty_tag || 'Beginner Friendly'}
              </span>
              <span className="bg-[#49B8BE]/15 text-[#1F7E84] text-xs font-bold px-2.5 py-0.5 rounded-md">
                PDF
              </span>
              <span className="bg-[#E5A834]/20 text-[#9E6C0A] text-xs font-bold px-2.5 py-0.5 rounded-md">
                VERIFIED
              </span>
            </div>

            {/* 2. Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1C17] leading-tight mb-4 font-sans">
              {pattern.title}
            </h1>

            {/* 3. Specs Box */}
            <div className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm text-stone-600 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Format</span>
                <span className="font-semibold text-[#2D1C17]">📄 Printable PDF Guide</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-100 pt-2">
                <span className="text-stone-400">File Size</span>
                <span className="font-semibold text-[#2D1C17] font-mono">{pattern.pdf_size}</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-100 pt-2">
                <span className="text-stone-400">Access</span>
                <span className="font-semibold text-[#1F7E84]">✓ Instant Download</span>
              </div>
            </div>

            {/* 4. Description */}
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed mb-6">
              {pattern.description ||
                'Download the full printable PDF pattern with stitch count and step-by-step instructions.'}
            </p>
          </div>

          {/* 5. CTAs pinned to the bottom */}
          <div className="space-y-3 pt-2">
            <div>
              <a
                href={pattern.cpa_locker_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#E65F43] hover:bg-[#d85237] text-white font-bold py-3.5 px-4 rounded-xl text-center block text-sm tracking-wide transition-colors"
              >
                FREE DOWNLOAD
              </a>
              <p className="text-[11px] text-stone-500 text-center mt-1">
                Unlock free by completing a quick sponsor offer
              </p>
            </div>

            {pattern.gumroad_url && (
              <div>
                <a
                  href={pattern.gumroad_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#49B8BE] hover:bg-[#3ea6ac] text-white font-bold py-3 px-4 rounded-xl text-center block text-sm tracking-wide transition-colors shadow-none"
                >
                  BUY IT NOW
                </a>
                <p className="text-[11px] text-stone-400 text-center mt-1">
                  Instant direct download — Skip offers
                </p>
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
