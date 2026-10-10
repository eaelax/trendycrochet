'use client';

import { useMemo } from 'react';
import { Pattern } from '@/lib/types';
import PatternCard from './PatternCard';

interface PatternGridProps {
  patterns: Pattern[];
  searchQuery: string;
  onResetSearch?: () => void;
}

export default function PatternGrid({
  patterns,
  searchQuery,
  onResetSearch,
}: PatternGridProps) {
  const filteredPatterns = useMemo(() => {
    if (!searchQuery.trim()) return patterns;
    const query = searchQuery.toLowerCase();
    return patterns.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.difficulty_tag?.toLowerCase().includes(query) ||
        p.pdf_size?.toLowerCase().includes(query)
    );
  }, [patterns, searchQuery]);

  return (
    <section className="max-w-6xl mx-auto px-4 pb-12">
      {filteredPatterns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPatterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center max-w-sm mx-auto">
          <p className="text-stone-500 text-sm mb-3">
            No patterns found matching &ldquo;{searchQuery}&rdquo;.
          </p>
          {onResetSearch && (
            <button
              onClick={onResetSearch}
              className="text-xs font-semibold text-[#E65F43] hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      )}
    </section>
  );
}
