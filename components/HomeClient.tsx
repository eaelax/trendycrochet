'use client';

import { useState, useEffect } from 'react';
import { Pattern } from '@/lib/types';
import HeroBanner from './HeroBanner';
import PatternGrid from './PatternGrid';
import DownloadSteps from './DownloadSteps';

interface HomeClientProps {
  initialPatterns: Pattern[];
}

export default function HomeClient({ initialPatterns }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patterns, setPatterns] = useState<Pattern[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch {}
    }
    return initialPatterns;
  });

  useEffect(() => {
    // 1. Fetch live server data so other devices instantly see updates
    fetch('/api/patterns?t=' + Date.now())
      .then((res) => res.json())
      .then((data) => {
        if (data.patterns && Array.isArray(data.patterns)) {
          setPatterns(data.patterns);
          try {
            localStorage.setItem('trendy_crochet_patterns', JSON.stringify(data.patterns));
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Synchronize across local tabs/windows
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPatterns(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('crochet_patterns_updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('crochet_patterns_updated', syncFromStorage);
    };
  }, []);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-16">
        <DownloadSteps />
      </div>
    </>
  );
}
