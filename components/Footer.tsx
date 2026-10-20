'use client';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-100 bg-white text-stone-500 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-3">
        <p className="text-sm font-bold tracking-[0.2em] uppercase text-stone-900 font-sans">
          TRENDY CROCHET
        </p>
        <p className="text-stone-500 text-xs font-normal max-w-md mx-auto">
          Your source for wall-worthy, wearable crochet art patterns and instant printable PDF guides.
        </p>
        <p className="text-stone-400 text-[11px] font-normal pt-2">
          © {new Date().getFullYear()} Trendy Crochet. 100% Free Instant Downloads.
        </p>
      </div>
    </footer>
  );
}
