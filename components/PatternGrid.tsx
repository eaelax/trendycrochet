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
    <div id="patterns" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-0 pb-6">
      {/* If Search is Active */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
          <span className="text-xs text-stone-500 font-medium">
            Search results for &ldquo;{searchQuery}&rdquo; ({filteredPatterns.length})
          </span>
          {onResetSearch && (
            <button
              onClick={onResetSearch}
              className="text-xs text-stone-700 underline hover:text-[#E65F43]"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Grid of all crochet patterns directly */}
      {filteredPatterns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
          {filteredPatterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-stone-500">
          <p className="font-serif text-lg mb-2">No patterns found matching &ldquo;{searchQuery}&rdquo;.</p>
          {onResetSearch && (
            <button
              onClick={onResetSearch}
              className="text-xs font-semibold uppercase tracking-wider text-stone-900 underline hover:text-[#E65F43]"
            >
              View all patterns
            </button>
          )}
        </div>
      )}
    </div>
  );
}
