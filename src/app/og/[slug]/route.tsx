/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const SIZE = { width: 1200, height: 630 };

const TITLES: Record<string, { eyebrow: string; title: string }> = {
  home: { eyebrow: 'Books & Publishing', title: 'Building the South African content sector, together' },
  about: { eyebrow: 'About CDCC', title: 'Who we are, what we coordinate' },
  'the-plan': { eyebrow: 'The Plan', title: 'A three-year sector strategy' },
  advocacy: { eyebrow: 'Advocacy', title: 'Speaking for the writers, editors, publishers, designers' },
  ecosystem: { eyebrow: 'Ecosystem', title: 'How CDCC fits into the SA cultural cluster' },
  stakeholders: { eyebrow: 'For Stakeholders', title: 'Partner with the Council' },
  programmes: { eyebrow: 'Programmes', title: 'Skills, networks, sector enablement' },
  press: { eyebrow: 'The Press', title: 'CDCC voices and council coverage' },
  podcast: { eyebrow: 'Podcast', title: 'Conversations across the value chain' },
  books: { eyebrow: 'Books', title: 'The South African catalogue' },
  awards: { eyebrow: 'Awards', title: 'Honouring excellence in publishing' },
  jobs: { eyebrow: 'Jobs', title: 'Opportunities across the sector' },
  consultations: { eyebrow: 'Consultations', title: 'Have your say on policy' },
  events: { eyebrow: 'Events', title: 'Convenings, launches, workshops' },
  news: { eyebrow: 'News & Stories', title: 'Sector updates from CDCC' },
  contact: { eyebrow: 'Contact', title: 'Reach the CDCC secretariat' },
  join: { eyebrow: 'Join the Registry', title: 'Be part of the story' },
  'reading-challenge': { eyebrow: 'Reading Challenge', title: 'Read more South African writing' },
  'book-clubs': { eyebrow: 'Book Clubs', title: 'Find or start a book club' },
  'banned-books': { eyebrow: 'Banned Books', title: 'Histories of literary censorship' },
  grants: { eyebrow: 'Grants', title: 'Funding for projects in the sector' },
  volunteer: { eyebrow: 'Volunteer', title: 'Lend your skills to the council' },
  directory: { eyebrow: 'Directory', title: 'Members of the council' },
  organisations: { eyebrow: 'Organisations', title: 'Partner orgs across the sector' },
  'sector-report': { eyebrow: 'Sector Report', title: 'The state of South African publishing' },
};

const FALLBACK = {
  eyebrow: 'Books & Publishing',
  title: 'CDCC — South African Content Developers and Creators Council',
};

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = (params.slug || 'home').toLowerCase();
  const meta = TITLES[slug] ?? FALLBACK;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#2B2B2B',
          color: '#F5F1E6',
          fontFamily: 'serif',
        }}
      >
        {/* Top · wordmark + accent stripe */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '0.05em', color: '#F5F1E6' }}>
            CDCC
          </div>
          <div style={{ width: 96, height: 6, backgroundColor: '#C5A15A' }} />
        </div>

        {/* Centre · eyebrow + title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#C5A15A',
              fontWeight: 700,
            }}
          >
            {meta.eyebrow}
          </div>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              fontWeight: 700,
              color: '#F5F1E6',
              maxWidth: '90%',
            }}
          >
            {meta.title}
          </div>
        </div>

        {/* Bottom · institutional footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 16,
            color: '#9A9485',
            letterSpacing: '0.05em',
          }}
        >
          <div>cdcc.org.za</div>
          <div>Books &amp; Publishing · DSAC CCI Cluster</div>
        </div>
      </div>
    ),
    SIZE,
  );
}
