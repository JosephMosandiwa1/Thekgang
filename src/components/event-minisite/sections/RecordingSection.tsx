'use client';

import type { SectionProps } from '../SectionRegistry';

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function RecordingSection({ event }: SectionProps) {
  if (!event._isPast || !event.recording_url) return null;

  const ytId = getYouTubeId(event.recording_url);

  return (
    <section id="recording" className="py-24 md:py-32 px-6 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Recording</p>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mb-10 type-grow">Watch the Recording</h2>

        {ytId ? (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Event recording" />
          </div>
        ) : (
          <a href={event.recording_url} target="_blank" rel="noopener" className="btn-ink-white text-xs tracking-[0.15em] uppercase px-8 py-3.5 inline-block">
            Watch Recording
          </a>
        )}
      </div>
    </section>
  );
}
