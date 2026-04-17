'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from '../SectionRegistry';

function calcRemaining(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    done: diff <= 0,
  };
}

export default function CountdownSection({ event }: SectionProps) {
  const target = new Date(`${event.event_date}T${event.event_time || '00:00:00'}`);
  const [time, setTime] = useState(calcRemaining(target));

  useEffect(() => {
    const id = setInterval(() => setTime(calcRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target.getTime()]);

  if (time.done) return null;

  const blocks = [
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hours' },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ];

  return (
    <section id="countdown" className="py-24 md:py-32 px-6 bg-black text-white">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8">Countdown</p>

        <div className="flex justify-center gap-6 md:gap-10">
          {blocks.map(b => (
            <div key={b.label} className="text-center">
              <div className="font-display font-bold tracking-tight leading-none" style={{ fontSize: 'clamp(40px, 10vw, 96px)' }}>
                {String(b.value).padStart(2, '0')}
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-2">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
