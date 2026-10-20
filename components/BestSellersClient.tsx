'use client';

import { useState, useEffect } from 'react';
import { Pattern } from '@/lib/types';
import PatternCard from '@/components/PatternCard';
import Link from 'next/link';

interface BestSellersClientProps {
  initialPatterns: Pattern[];
}

export default function BestSellersClient({ initialPatterns }: BestSellersClientProps) {
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

  const bestSellers = patterns.filter((p) => p.is_best_seller);

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 w-full">
      <div className="mb-8 text-center">
        <span className="text-xs uppercase tracking-widest text-[#E65F43] font-bold block mb-2">
          Curated Collection
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 mb-3">
          Best Sellers
        </h1>
        <p className="text-xs sm:text-sm text-stone-700 max-w-lg mx-auto font-medium">
          Explore our community-favorite crochet patterns with top-rated printable PDF guides.
        </p>
      </div>

      {bestSellers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
          {bestSellers.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-stone-500">
          <p className="font-serif text-lg font-bold mb-2">No best sellers designated yet.</p>
          <p className="text-xs text-stone-600 font-bold mb-4">Mark patterns as Best Sellers in the Admin Dashboard settings.</p>
          <Link
            href="/trendycrochetpatternsadmin"
            className="inline-block px-5 py-2.5 bg-[#E65F43] text-white text-xs font-extrabold rounded-xl shadow-xs"
          >
            Open Admin Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}
