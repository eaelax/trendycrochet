'use client';

import { Sparkles } from 'lucide-react';

export default function DownloadSteps() {
  return (
    <section className="w-full max-w-4xl mx-auto my-12 px-4">
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-none">
        <div className="text-center max-w-lg mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1F7E84] bg-[#49B8BE]/15 px-3.5 py-1.5 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>3-Step Instant Access</span>
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2D1C17] tracking-tight">
            How to Get Your Free PDF Pattern
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-[#FAF5EC] rounded-2xl p-6 border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#49B8BE] text-white font-black text-base flex items-center justify-center mb-4">
                01
              </div>
              <h4 className="font-bold text-[#2D1C17] text-base mb-1.5">Click &quot;Get The Pattern&quot;</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Tap the download button on any pattern card to open the secure verification locker.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#FAF5EC] rounded-2xl p-6 border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E5A834] text-white font-black text-base flex items-center justify-center mb-4">
                02
              </div>
              <h4 className="font-bold text-[#2D1C17] text-base mb-1.5">Complete 1 Quick Task</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Finish a short 30-second sponsor survey or prompt to instantly verify your free access.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#FAF5EC] rounded-2xl p-6 border border-stone-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#E65F43] text-white font-black text-base flex items-center justify-center mb-4">
                03
              </div>
              <h4 className="font-bold text-[#2D1C17] text-base mb-1.5">Instant PDF Download</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Your full printable crochet guide unlocks immediately and saves directly to your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
