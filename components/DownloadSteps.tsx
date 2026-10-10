'use client';

import { ShieldCheck, ArrowRight, Download, CheckCircle } from 'lucide-react';

export default function DownloadSteps() {
  return (
    <section className="w-full max-w-4xl mx-auto my-12 px-4">
      <div className="bg-[#2D1C17] text-white rounded-3xl p-6 sm:p-10 shadow-none border border-stone-800">
        <div className="text-center max-w-lg mx-auto mb-8">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#E5A834] bg-[#E5A834]/15 px-3.5 py-1.5 rounded-full mb-3">
            ⚡ 3-Step Instant Access
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How to Get Your Free PDF Pattern
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#49B8BE] text-[#2D1C17] font-black text-sm flex items-center justify-center">
                  1
                </span>
                <Download className="w-4 h-4 text-[#49B8BE]" />
              </div>
              <h4 className="font-bold text-white text-base mb-1.5">Click &quot;Get The Pattern&quot;</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Tap the download button on any pattern card to open the verification secure locker.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#E5A834] text-[#2D1C17] font-black text-sm flex items-center justify-center">
                  2
                </span>
                <ShieldCheck className="w-4 h-4 text-[#E5A834]" />
              </div>
              <h4 className="font-bold text-white text-base mb-1.5">Complete 1 Quick Task</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Finish a short 30-second sponsor survey or prompt to instantly verify your free access.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#E65F43] text-white font-black text-sm flex items-center justify-center">
                  3
                </span>
                <CheckCircle className="w-4 h-4 text-[#E65F43]" />
              </div>
              <h4 className="font-bold text-white text-base mb-1.5">Instant PDF Download</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Your full printable crochet guide unlocks immediately and saves directly to your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
