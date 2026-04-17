'use client';

import type { SectionProps } from '../SectionRegistry';

export default function AccreditationSection({ event }: SectionProps) {
  const acc = event.accreditation;
  if (!acc) return null;

  return (
    <section id="accreditation" className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-4">Accreditation</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold text-black tracking-tight mb-10 type-grow">Accreditation</h2>

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {acc.seta && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-1">SETA</p>
                <p className="text-base font-medium text-black">{acc.seta}</p>
              </div>
            )}
            {acc.nqf_level && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-1">NQF Level</p>
                <p className="text-base font-medium text-black">Level {acc.nqf_level}</p>
              </div>
            )}
            {acc.credits && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-1">Credits</p>
                <p className="text-base font-medium text-black">{acc.credits} credits</p>
              </div>
            )}
            {acc.reference_number && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/30 mb-1">Reference</p>
                <p className="text-base font-mono text-black">{acc.reference_number}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
