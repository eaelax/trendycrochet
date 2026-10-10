'use client';

import { useState } from 'react';
import { Pattern } from '@/lib/types';
import HeroBanner from './HeroBanner';
import PatternGrid from './PatternGrid';
import DownloadSteps from './DownloadSteps';

interface HomeClientProps {
  initialPatterns: Pattern[];
}

export default function HomeClient({ initialPatterns }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patterns] = useState<Pattern[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    return initialPatterns;
  });

  return (
    <>
      <HeroBanner
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <PatternGrid
        patterns={patterns}
        searchQuery={searchQuery}
        onResetSearch={() => setSearchQuery('')}
      />

      {/* 3-Step Guide Section on Home Page */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <DownloadSteps />
      </div>
    </>
  );
}
