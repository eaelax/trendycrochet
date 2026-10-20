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
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = initialPatterns.map(init => {
              const found = parsed.find((p: Pattern) => p.id === init.id);
              return found ? { ...init, ...found } : init;
            });
            const custom = parsed.filter((p: Pattern) => !initialPatterns.some(init => init.id === p.id));
            return [...merged, ...custom];
          }
        }
      } catch {
        // fallback
      }
    }
    return initialPatterns;
  });

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const merged = initialPatterns.map(init => {
              const found = parsed.find((p: Pattern) => p.id === init.id);
              return found ? { ...init, ...found } : init;
            });
            const custom = parsed.filter((p: Pattern) => !initialPatterns.some(init => init.id === p.id));
            setPatterns([...merged, ...custom]);
          }
        }
      } catch {
        // ignore
      }
    };

    syncFromStorage();

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('crochet_patterns_updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('crochet_patterns_updated', syncFromStorage);
    };
  }, [initialPatterns]);

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
