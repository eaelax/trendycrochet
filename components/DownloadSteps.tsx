'use client';

export default function DownloadSteps() {
  return (
    <section id="steps" className="w-full max-w-7xl mx-auto my-12 px-4 sm:px-6 md:px-8">
      <div className="bg-[#F8F6F1] border border-stone-200/60 rounded-2xl sm:rounded-3xl p-8 sm:p-12">
        <div className="text-center max-w-lg mx-auto mb-10">
          <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">
            Free Printable Guides
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-tight">
            How to get your free patterns
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-2 font-normal leading-relaxed">
            Every pattern in our gallery is 100% free with complete photo instructions and stitch counts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Step 1 */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-stone-200/60 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-2xl font-bold text-stone-900 block mb-2 font-serif">
                01
              </span>
              <h4 className="text-sm font-semibold text-stone-900 mb-1.5">
                Select Your Pattern
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Choose any framed design from our Best Sellers or Latest Arrivals and click &ldquo;Download Guide&rdquo;.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-stone-200/60 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-2xl font-bold text-stone-900 block mb-2 font-serif">
                02
              </span>
              <h4 className="text-sm font-semibold text-stone-900 mb-1.5">
                Quick 30-Sec Verification
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Complete a brief, free sponsor task to instantly unlock your secure PDF download access.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-stone-200/60 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-2xl font-bold text-stone-900 block mb-2 font-serif">
                03
              </span>
              <h4 className="text-sm font-semibold text-stone-900 mb-1.5">
                Instant PDF Download
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Your full pattern PDF guide downloads directly to your device ready to print or view on your phone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
