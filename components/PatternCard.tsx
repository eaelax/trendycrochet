'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Pattern } from '@/lib/types';

interface PatternCardProps {
  pattern: Pattern;
}

export default function PatternCard({ pattern }: PatternCardProps) {
  const [imageError, setImageError] = useState(false);

  const displayImage = imageError
    ? '/images/hero-crochet.jpg'
    : (pattern.image_url || '/images/hero-crochet.jpg');

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl p-4 border border-stone-200">
      {/* Square image with rounded-xl corners */}
      <Link
        href={`/pattern/${pattern.slug}`}
        className="block relative aspect-square w-full overflow-hidden rounded-xl bg-[#FAF5EC] mb-3 group"
      >
        <Image
          src={displayImage}
          alt={pattern.title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </Link>

      {/* Uniform Title clamped to 2 lines with fixed height */}
      <Link href={`/pattern/${pattern.slug}`} className="block">
        <h3 className="font-bold text-[#2D1C17] text-base leading-snug line-clamp-2 h-11 mb-3 font-sans hover:text-[#E65F43] transition-colors">
          {pattern.title}
        </h3>
      </Link>

      {/* Bottom Button aligned via mt-auto */}
      <div className="mt-auto pt-2">
        <Link
          href={`/pattern/${pattern.slug}`}
          className="w-full bg-[#E65F43] hover:bg-[#d45035] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>GET THE PATTERN →</span>
        </Link>
      </div>
    </div>
  );
}
