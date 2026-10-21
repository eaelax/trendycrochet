'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="w-full bg-white sticky top-0 z-40 border-b border-stone-100">
      {/* Top Announcement Bar: Added a few pixels of height */}
      <div className="w-full bg-[#EBE7DF] text-stone-800 py-2 sm:py-2.5 px-3 text-center text-[10px] sm:text-[11px] font-medium tracking-wide flex items-center justify-center min-h-[34px]">
        <span>100% Free Instant Downloads · Verified Printable PDF Guides</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Mobile View: Website title in one line and under it the 4 navbar buttons (No Admin button) */}
        <div className="flex flex-col items-center py-2.5 sm:hidden">
          <Link
            href="/"
            className="text-base font-extrabold tracking-[0.18em] uppercase text-stone-900 font-sans whitespace-nowrap select-none text-center"
          >
            TRENDY CROCHET
          </Link>

          {/* Under the title: the 4 navbar buttons */}
          <nav className="flex items-center justify-center gap-4 pt-2 text-[11px] text-stone-900 font-medium tracking-normal w-full">
            <Link
              href="/#patterns"
              className="text-stone-900 font-normal whitespace-nowrap"
            >
              Pattern
            </Link>
            <Link
              href="/best-sellers"
              className="text-stone-900 font-normal whitespace-nowrap"
            >
              Best sellers
            </Link>
            <Link
              href="/#patterns"
              className="text-stone-900 font-normal whitespace-nowrap"
            >
              Latest arrivals
            </Link>
            <Link
              href="/#steps"
              className="text-stone-900 font-normal whitespace-nowrap"
            >
              How it works
            </Link>
          </nav>
        </div>

        {/* Desktop View (sm and up): Standard 3-column layout (No Admin button) */}
        <div className="hidden sm:grid sm:grid-cols-3 items-center h-20">
          {/* Left Side: Pattern, Best sellers */}
          <nav className="flex items-center gap-6 text-xs text-stone-900 font-medium tracking-normal">
            <Link href="/#patterns" className="text-stone-900 font-normal">
              Pattern
            </Link>
            <Link href="/best-sellers" className="text-stone-900 font-normal">
              Best sellers
            </Link>
          </nav>

          {/* Middle: Site Name (Bold) */}
          <div className="text-center">
            <Link
              href="/"
              className="text-xl md:text-2xl font-extrabold tracking-[0.2em] uppercase text-stone-900 font-sans select-none whitespace-nowrap"
            >
              TRENDY CROCHET
            </Link>
          </div>

          {/* Right Side: Latest arrivals, How it works */}
          <nav className="flex items-center justify-end gap-6 text-xs text-stone-900 font-medium tracking-normal">
            <Link href="/#patterns" className="text-stone-900 font-normal">
              Latest arrivals
            </Link>
            <Link href="/#steps" className="text-stone-900 font-normal">
              How it works
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
