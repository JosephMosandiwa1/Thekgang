'use client';

/**
 * SectionRegistry — maps section keys to React components.
 *
 * Every section a mini-site can render is registered here. The
 * EventMiniSite layout reads the event's `event_sections` rows
 * (ordered by sort_order, filtered by visible=true) and renders
 * the matching component for each.
 *
 * Section components receive a standard props shape:
 *   { event, theme, sectionConfig }
 *
 * New sections are added by:
 *   1. Creating the component in this directory
 *   2. Adding it to SECTION_MAP below
 *   3. It becomes available in the admin section builder
 */

import { lazy, Suspense, type ComponentType } from 'react';

// ── Section props interface (all sections receive this) ─────────
export interface SectionProps {
  event: any;
  theme: {
    accentColor: string;
    accentColor2?: string;
    darkMode: boolean;
    fontHeading: string;
    fontBody: string;
  };
  sectionConfig?: {
    label?: string;
    contentOverride?: any;
  };
}

// ── Lazy-loaded section components ──────────────────────────────
const HeroSection = lazy(() => import('./sections/HeroSection'));
const AboutSection = lazy(() => import('./sections/AboutSection'));
const ProgrammeSection = lazy(() => import('./sections/ProgrammeSection'));
const SpeakersSection = lazy(() => import('./sections/SpeakersSection'));
const KeynoteSpeakersSection = lazy(() => import('./sections/KeynoteSpeakersSection'));
const RegistrationSection = lazy(() => import('./sections/RegistrationSection'));
const PartnersSection = lazy(() => import('./sections/PartnersSection'));
const VenueSection = lazy(() => import('./sections/VenueSection'));
const FAQSection = lazy(() => import('./sections/FAQSection'));
const DocumentsSection = lazy(() => import('./sections/DocumentsSection'));
const GallerySection = lazy(() => import('./sections/GallerySection'));
const ReadingListSection = lazy(() => import('./sections/ReadingListSection'));
const RecordingSection = lazy(() => import('./sections/RecordingSection'));
const FeedbackSection = lazy(() => import('./sections/FeedbackSection'));
const ExhibitorSection = lazy(() => import('./sections/ExhibitorSection'));
const FloorPlanSection = lazy(() => import('./sections/FloorPlanSection'));
const FeaturedBooksSection = lazy(() => import('./sections/FeaturedBooksSection'));
const VisitorGuideSection = lazy(() => import('./sections/VisitorGuideSection'));
const CurriculumSection = lazy(() => import('./sections/CurriculumSection'));
const LearningObjectivesSection = lazy(() => import('./sections/LearningObjectivesSection'));
const FacilitatorSection = lazy(() => import('./sections/FacilitatorSection'));
const MaterialsSection = lazy(() => import('./sections/MaterialsSection'));
const DiscussionTopicsSection = lazy(() => import('./sections/DiscussionTopicsSection'));
const BookDetailsSection = lazy(() => import('./sections/BookDetailsSection'));
const AuthorSection = lazy(() => import('./sections/AuthorSection'));
const PressKitSection = lazy(() => import('./sections/PressKitSection'));
const PurchaseLinksSection = lazy(() => import('./sections/PurchaseLinksSection'));
const CountdownSection = lazy(() => import('./sections/CountdownSection'));
const CategoriesSection = lazy(() => import('./sections/CategoriesSection'));
const NomineesSection = lazy(() => import('./sections/NomineesSection'));
const JudgingPanelSection = lazy(() => import('./sections/JudgingPanelSection'));
const GalaProgrammeSection = lazy(() => import('./sections/GalaProgrammeSection'));
const NominationFormSection = lazy(() => import('./sections/NominationFormSection'));
const PastWinnersSection = lazy(() => import('./sections/PastWinnersSection'));
const AccreditationSection = lazy(() => import('./sections/AccreditationSection'));
const ApplicationFormSection = lazy(() => import('./sections/ApplicationFormSection'));
const AgendaSection = lazy(() => import('./sections/AgendaSection'));
const BoardMembersSection = lazy(() => import('./sections/BoardMembersSection'));
const ResolutionsSection = lazy(() => import('./sections/ResolutionsSection'));
const SubEventsSection = lazy(() => import('./sections/SubEventsSection'));
const HighlightsSection = lazy(() => import('./sections/HighlightsSection'));
const ChildrensProgrammeSection = lazy(() => import('./sections/ChildrensProgrammeSection'));
const TicketsSection = lazy(() => import('./sections/TicketsSection'));
const ShareBarSection = lazy(() => import('./sections/ShareBarSection'));
const AnnouncementBar = lazy(() => import('./sections/AnnouncementBar'));

// ── The registry ────────────────────────────────────────────────
export const SECTION_MAP: Record<string, ComponentType<SectionProps>> = {
  hero: HeroSection,
  about: AboutSection,
  programme: ProgrammeSection,
  speakers: SpeakersSection,
  keynote_speakers: KeynoteSpeakersSection,
  registration: RegistrationSection,
  partners: PartnersSection,
  venue: VenueSection,
  faq: FAQSection,
  documents: DocumentsSection,
  gallery: GallerySection,
  reading_list: ReadingListSection,
  recording: RecordingSection,
  feedback: FeedbackSection,
  exhibitors: ExhibitorSection,
  floor_plan: FloorPlanSection,
  featured_books: FeaturedBooksSection,
  visitor_guide: VisitorGuideSection,
  curriculum: CurriculumSection,
  learning_objectives: LearningObjectivesSection,
  facilitator: FacilitatorSection,
  materials: MaterialsSection,
  discussion_topics: DiscussionTopicsSection,
  book_details: BookDetailsSection,
  author: AuthorSection,
  press_kit: PressKitSection,
  purchase_links: PurchaseLinksSection,
  countdown: CountdownSection,
  categories: CategoriesSection,
  nominees: NomineesSection,
  judging_panel: JudgingPanelSection,
  gala_programme: GalaProgrammeSection,
  nomination_form: NominationFormSection,
  past_winners: PastWinnersSection,
  accreditation: AccreditationSection,
  application_form: ApplicationFormSection,
  agenda: AgendaSection,
  board_members: BoardMembersSection,
  resolutions: ResolutionsSection,
  sub_events: SubEventsSection,
  highlights: HighlightsSection,
  childrens_programme: ChildrensProgrammeSection,
  tickets: TicketsSection,
  share_bar: ShareBarSection,
  announcement_bar: AnnouncementBar,
};

// ── Section labels (default, can be overridden per-event) ───────
export const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero',
  about: 'About',
  programme: 'Programme',
  speakers: 'Speakers',
  keynote_speakers: 'Keynote Speakers',
  registration: 'Register',
  partners: 'Partners',
  venue: 'Venue & Logistics',
  faq: 'FAQ',
  documents: 'Documents',
  gallery: 'Gallery',
  reading_list: 'Reading List',
  recording: 'Recording',
  feedback: 'Feedback',
  exhibitors: 'Exhibitors',
  floor_plan: 'Floor Plan',
  featured_books: 'Featured Books',
  visitor_guide: 'Visitor Guide',
  curriculum: 'Curriculum',
  learning_objectives: 'What You\'ll Learn',
  facilitator: 'Facilitator',
  materials: 'Materials',
  discussion_topics: 'The Discussion',
  book_details: 'About the Book',
  author: 'About the Author',
  press_kit: 'Press Kit',
  purchase_links: 'Purchase',
  countdown: 'Countdown',
  categories: 'Award Categories',
  nominees: 'Nominees',
  judging_panel: 'Judging Panel',
  gala_programme: 'The Evening',
  nomination_form: 'Nominate',
  past_winners: 'Past Winners',
  accreditation: 'Accreditation',
  application_form: 'Apply',
  agenda: 'Agenda',
  board_members: 'Board Members',
  resolutions: 'Resolutions',
  sub_events: 'What\'s On',
  highlights: 'Highlights',
  childrens_programme: 'Children\'s Programme',
  tickets: 'Tickets',
  share_bar: 'Share',
  announcement_bar: 'Announcements',
};

// ── Default sections per event type ─────────────────────────────
export const DEFAULT_SECTIONS: Record<string, string[]> = {
  symposium: ['hero', 'about', 'keynote_speakers', 'programme', 'speakers', 'documents', 'registration', 'venue', 'faq', 'partners', 'recording', 'feedback', 'gallery'],
  book_fair: ['hero', 'about', 'exhibitors', 'floor_plan', 'programme', 'featured_books', 'visitor_guide', 'tickets', 'partners', 'gallery'],
  workshop: ['hero', 'learning_objectives', 'facilitator', 'curriculum', 'materials', 'application_form', 'venue', 'feedback', 'gallery'],
  imbizo: ['hero', 'discussion_topics', 'about', 'venue', 'registration', 'resolutions', 'gallery'],
  book_launch: ['hero', 'book_details', 'author', 'programme', 'press_kit', 'registration', 'purchase_links', 'gallery'],
  webinar: ['hero', 'about', 'speakers', 'countdown', 'registration', 'recording', 'feedback'],
  conference: ['hero', 'about', 'keynote_speakers', 'programme', 'speakers', 'exhibitors', 'venue', 'tickets', 'faq', 'partners', 'recording', 'feedback', 'gallery'],
  reading: ['hero', 'featured_books', 'speakers', 'about', 'venue', 'registration', 'recording', 'gallery'],
  awards: ['hero', 'about', 'categories', 'nominees', 'judging_panel', 'gala_programme', 'nomination_form', 'tickets', 'past_winners', 'partners', 'gallery'],
  training: ['hero', 'about', 'learning_objectives', 'curriculum', 'facilitator', 'accreditation', 'application_form', 'venue', 'faq', 'feedback'],
  agm: ['hero', 'agenda', 'documents', 'board_members', 'registration', 'resolutions'],
  festival: ['hero', 'about', 'sub_events', 'highlights', 'speakers', 'childrens_programme', 'exhibitors', 'venue', 'tickets', 'partners', 'gallery'],
  event: ['hero', 'about', 'programme', 'speakers', 'registration', 'venue', 'partners', 'gallery'],
};

// ── Render a section by key ─────────────────────────────────────
export function RenderSection({ sectionKey, event, theme, config }: {
  sectionKey: string;
  event: any;
  theme: SectionProps['theme'];
  config?: SectionProps['sectionConfig'];
}) {
  const Component = SECTION_MAP[sectionKey];
  if (!Component) return null;

  return (
    <Suspense fallback={<div className="py-16 text-center text-gray-300 text-xs uppercase tracking-widest">Loading…</div>}>
      <Component event={event} theme={theme} sectionConfig={config} />
    </Suspense>
  );
}
