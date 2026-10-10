'use client';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-[#FAF5EC] text-stone-500 text-xs py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-[#2D1C17]/70">
          © {new Date().getFullYear()} Trendy Crochet Patterns. All rights reserved. Free instant PDF guides.
        </p>
      </div>
    </footer>
  );
}
