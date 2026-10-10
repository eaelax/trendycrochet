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

  return (
    <>
      <HeroBanner
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <PatternGrid
        patterns={initialPatterns}
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
