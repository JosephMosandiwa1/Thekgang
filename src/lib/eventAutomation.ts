/**
 * Event automation — task checklists, budget templates, speaker pipeline,
 * email scheduling per event type.
 *
 * Called when an event is created (from admin events page or openNew).
 * Generates type-specific tasks + budget line items.
 */

// ── Task checklist templates per event type ─────────────────────

interface TaskTemplate {
  title: string;
  category: 'planning' | 'speakers' | 'marketing' | 'logistics' | 'day_of' | 'post_event';
  weeksBefore?: number;
}

const SHARED_TASKS: TaskTemplate[] = [
  { title: 'Confirm venue and date', category: 'planning', weeksBefore: 12 },
  { title: 'Create event branding (cover image, accent colour)', category: 'planning', weeksBefore: 10 },
  { title: 'Write event description', category: 'planning', weeksBefore: 8 },
  { title: 'Open registration', category: 'planning', weeksBefore: 6 },
  { title: 'Send save-the-date email', category: 'marketing', weeksBefore: 8 },
  { title: 'Send invitation email with details', category: 'marketing', weeksBefore: 4 },
  { title: 'Send reminder email', category: 'marketing', weeksBefore: 1 },
  { title: 'Send day-before logistics email', category: 'logistics' },
  { title: 'Print badges and attendance register', category: 'logistics', weeksBefore: 1 },
  { title: 'Confirm AV setup', category: 'logistics', weeksBefore: 1 },
  { title: 'Day-of: check-in, photography', category: 'day_of' },
  { title: 'Upload recording', category: 'post_event' },
  { title: 'Publish photo gallery', category: 'post_event' },
  { title: 'Send thank-you email', category: 'post_event' },
  { title: 'Send certificates to attendees', category: 'post_event' },
  { title: 'File DSAC quarterly report', category: 'post_event' },
];

const TYPE_TASKS: Record<string, TaskTemplate[]> = {
  symposium: [
    { title: 'Define symposium theme and sub-themes', category: 'planning', weeksBefore: 12 },
    { title: 'Identify and invite speakers (target: 12-20)', category: 'speakers', weeksBefore: 10 },
    { title: 'Open call for papers/abstracts', category: 'speakers', weeksBefore: 10 },
    { title: 'Design programme (4-6 sessions with facilitators)', category: 'planning', weeksBefore: 6 },
    { title: 'Upload programme PDF', category: 'planning', weeksBefore: 4 },
    { title: 'Send speaker announcement email', category: 'marketing', weeksBefore: 3 },
    { title: 'Publish proceedings document', category: 'post_event' },
  ],
  book_fair: [
    { title: 'Open exhibitor applications', category: 'planning', weeksBefore: 12 },
    { title: 'Design floor plan', category: 'logistics', weeksBefore: 8 },
    { title: 'Review and approve exhibitor applications', category: 'planning', weeksBefore: 6 },
    { title: 'Assign booth numbers', category: 'logistics', weeksBefore: 4 },
    { title: 'Send exhibitor setup instructions', category: 'logistics', weeksBefore: 1 },
    { title: 'Curate featured books showcase', category: 'planning', weeksBefore: 2 },
    { title: 'Create visitor guide', category: 'marketing', weeksBefore: 2 },
    { title: 'Send exhibitor satisfaction survey', category: 'post_event' },
  ],
  workshop: [
    { title: 'Confirm facilitator and agree on curriculum', category: 'speakers', weeksBefore: 8 },
    { title: 'Define learning objectives', category: 'planning', weeksBefore: 6 },
    { title: 'Prepare materials and handouts', category: 'logistics', weeksBefore: 4 },
    { title: 'Open applications (selection-based)', category: 'planning', weeksBefore: 6 },
    { title: 'Review applications and send acceptance/rejection', category: 'planning', weeksBefore: 3 },
    { title: 'Send pre-workshop materials to accepted participants', category: 'logistics', weeksBefore: 1 },
    { title: 'Send post-workshop assessment', category: 'post_event' },
    { title: 'Generate completion certificates', category: 'post_event' },
  ],
  imbizo: [
    { title: 'Define discussion topics (2-3 key questions)', category: 'planning', weeksBefore: 8 },
    { title: 'Prepare discussion guide document', category: 'planning', weeksBefore: 4 },
    { title: 'Province-targeted outreach for representation', category: 'marketing', weeksBefore: 4 },
    { title: 'Plan breakout groups', category: 'planning', weeksBefore: 2 },
    { title: 'Draft and publish resolutions document', category: 'post_event' },
    { title: 'Assign action items to stakeholders', category: 'post_event' },
  ],
  book_launch: [
    { title: 'Receive book details from author/publisher', category: 'planning', weeksBefore: 6 },
    { title: 'Prepare press kit (cover, headshot, synopsis)', category: 'marketing', weeksBefore: 4 },
    { title: 'Invite media / reviewers', category: 'marketing', weeksBefore: 3 },
    { title: 'Confirm reading extract with author', category: 'speakers', weeksBefore: 2 },
    { title: 'Set up purchase links', category: 'planning', weeksBefore: 1 },
    { title: 'Send "book is now available" email', category: 'post_event' },
    { title: 'Compile press coverage links', category: 'post_event' },
  ],
  webinar: [
    { title: 'Set up Zoom/Teams meeting', category: 'logistics', weeksBefore: 4 },
    { title: 'Confirm speakers and topics', category: 'speakers', weeksBefore: 3 },
    { title: 'Test platform with speakers', category: 'logistics', weeksBefore: 1 },
    { title: 'Publish recording same day', category: 'post_event' },
    { title: 'Upload slide deck', category: 'post_event' },
  ],
  conference: [
    { title: 'Design conference branding/logo', category: 'planning', weeksBefore: 16 },
    { title: 'Identify keynote speakers (2-4)', category: 'speakers', weeksBefore: 16 },
    { title: 'Call for papers/session proposals', category: 'speakers', weeksBefore: 14 },
    { title: 'Design multi-track programme', category: 'planning', weeksBefore: 8 },
    { title: 'Negotiate accommodation partner rates', category: 'logistics', weeksBefore: 8 },
    { title: 'Open early bird tickets', category: 'planning', weeksBefore: 10 },
    { title: 'Close early bird, open standard tickets', category: 'planning', weeksBefore: 4 },
    { title: 'Publish per-day recording archive', category: 'post_event' },
    { title: 'Generate impact report', category: 'post_event' },
  ],
  reading: [
    { title: 'Confirm readers and featured works', category: 'speakers', weeksBefore: 4 },
    { title: 'Confirm venue and atmosphere setup', category: 'logistics', weeksBefore: 2 },
    { title: 'Upload audio recordings of readings', category: 'post_event' },
  ],
  awards: [
    { title: 'Define award categories and eligibility', category: 'planning', weeksBefore: 16 },
    { title: 'Open nominations', category: 'planning', weeksBefore: 14 },
    { title: 'Close nominations and compile shortlist', category: 'planning', weeksBefore: 8 },
    { title: 'Confirm judging panel', category: 'speakers', weeksBefore: 10 },
    { title: 'Announce nominees', category: 'marketing', weeksBefore: 6 },
    { title: 'Select winners (judging complete)', category: 'planning', weeksBefore: 2 },
    { title: 'Confirm gala dinner: menu, entertainment, seating', category: 'logistics', weeksBefore: 2 },
    { title: 'Reveal winners on mini-site', category: 'post_event' },
    { title: 'Send press release with winner profiles', category: 'post_event' },
  ],
  training: [
    { title: 'Confirm trainers and accreditation details', category: 'speakers', weeksBefore: 8 },
    { title: 'Design curriculum (module breakdown)', category: 'planning', weeksBefore: 6 },
    { title: 'Open applications', category: 'planning', weeksBefore: 8 },
    { title: 'Review applications (selection panel)', category: 'planning', weeksBefore: 4 },
    { title: 'Prepare training materials', category: 'logistics', weeksBefore: 2 },
    { title: 'Daily attendance tracking', category: 'day_of' },
    { title: 'Send assessment form', category: 'post_event' },
    { title: 'Generate SETA-compliant certificates', category: 'post_event' },
    { title: 'Send 3-month impact survey', category: 'post_event' },
  ],
  agm: [
    { title: 'Prepare annual report', category: 'planning', weeksBefore: 6 },
    { title: 'Prepare financial statements', category: 'planning', weeksBefore: 6 },
    { title: 'Send 21-day notice of meeting', category: 'marketing', weeksBefore: 3 },
    { title: 'Open nominations for board positions', category: 'planning', weeksBefore: 4 },
    { title: 'Prepare proxy forms', category: 'logistics', weeksBefore: 3 },
    { title: 'Verify quorum', category: 'day_of' },
    { title: 'Publish minutes', category: 'post_event' },
    { title: 'Record resolutions', category: 'post_event' },
  ],
  festival: [
    { title: 'Design festival branding/identity', category: 'planning', weeksBefore: 20 },
    { title: 'Confirm venues (multiple)', category: 'logistics', weeksBefore: 16 },
    { title: 'Open call for participation', category: 'speakers', weeksBefore: 16 },
    { title: 'Open exhibitor applications', category: 'planning', weeksBefore: 14 },
    { title: 'Curate programme across venues', category: 'planning', weeksBefore: 8 },
    { title: 'Plan children\'s programme', category: 'planning', weeksBefore: 6 },
    { title: 'Open festival pass sales', category: 'planning', weeksBefore: 10 },
    { title: 'Create venue map and transport guide', category: 'logistics', weeksBefore: 4 },
    { title: 'Recruit volunteers per venue', category: 'logistics', weeksBefore: 4 },
    { title: 'Publish highlight reel', category: 'post_event' },
    { title: 'Generate economic impact assessment', category: 'post_event' },
  ],
};

export function generateTaskChecklist(eventType: string, eventDate: string): Array<Omit<TaskTemplate, 'weeksBefore'> & { due_date: string | null; sort_order: number }> {
  const tasks = [...SHARED_TASKS, ...(TYPE_TASKS[eventType] || [])];
  const date = new Date(eventDate);

  return tasks
    .sort((a, b) => (b.weeksBefore ?? 0) - (a.weeksBefore ?? 0))
    .map((t, i) => ({
      title: t.title,
      category: t.category,
      due_date: t.weeksBefore
        ? new Date(date.getTime() - t.weeksBefore * 7 * 86_400_000).toISOString().split('T')[0]
        : t.category === 'day_of' ? eventDate
        : t.category === 'post_event' ? new Date(date.getTime() + 7 * 86_400_000).toISOString().split('T')[0]
        : null,
      sort_order: i,
    }));
}

// ── Budget template per event type ──────────────────────────────

interface BudgetTemplate { category: string; description: string }

const SHARED_BUDGET: BudgetTemplate[] = [
  { category: 'venue_hire', description: 'Venue rental and deposit' },
  { category: 'catering', description: 'Refreshments, lunch, tea' },
  { category: 'marketing', description: 'Flyers, banners, digital ads, programme printing' },
  { category: 'av_technical', description: 'Sound, projectors, recording, streaming' },
  { category: 'stationery', description: 'Name badges, pens, folders, printed materials' },
  { category: 'staff', description: 'Coordinator, support staff, security' },
  { category: 'insurance', description: 'Event insurance, compliance' },
  { category: 'contingency', description: 'Contingency (10%)' },
];

const TYPE_BUDGET: Record<string, BudgetTemplate[]> = {
  symposium: [
    { category: 'speaker_travel', description: 'Speaker flights, accommodation, transfers' },
    { category: 'speaker_fees', description: 'Speaker honoraria' },
  ],
  book_fair: [
    { category: 'exhibitor_infra', description: 'Tables, booths, signage, power' },
  ],
  awards: [
    { category: 'prizes', description: 'Trophies, prize money, certificates' },
    { category: 'entertainment', description: 'MC, musician, photographer' },
    { category: 'gala_dinner', description: 'Formal dinner, decor, table settings' },
  ],
  conference: [
    { category: 'speaker_travel', description: 'Speaker flights, accommodation, transfers' },
    { category: 'speaker_fees', description: 'Keynote speaker fees' },
    { category: 'accommodation', description: 'Delegate accommodation partner costs' },
  ],
  festival: [
    { category: 'multi_venue', description: 'Multiple venue hire and setup' },
    { category: 'volunteers', description: 'Volunteer coordination, meals, transport' },
    { category: 'entertainment', description: 'Performances, children\'s activities' },
  ],
  training: [
    { category: 'trainer_fees', description: 'Trainer/facilitator fees' },
    { category: 'materials', description: 'Training materials, workbooks' },
    { category: 'accreditation', description: 'SETA accreditation fees' },
  ],
};

export function generateBudgetTemplate(eventType: string): Array<BudgetTemplate & { sort_order: number }> {
  const items = [...SHARED_BUDGET, ...(TYPE_BUDGET[eventType] || [])];
  return items.map((item, i) => ({ ...item, sort_order: i }));
}

// ── Default sections seed per event type ─────────────────────────

export { DEFAULT_SECTIONS } from '@/components/event-minisite/SectionRegistry';
