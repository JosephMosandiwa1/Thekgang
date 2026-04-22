/**
 * The Press · block registry types.
 *
 * A Voice is a block stream. Each block has:
 *   - `type`       — the registered block type key
 *   - `key`        — a unique id within this Voice (for comments + reorder)
 *   - `props`      — type-specific props; bilingual where applicable
 *
 * Blocks render to three targets: web, print (booklet PDF), email (when
 * used as a Message body). Not every block renders to every target — the
 * registry declares which surfaces a block supports.
 */

export type BlockTarget = 'web' | 'print' | 'email';

export interface BlockBase {
  key: string;
  type: string;
}

/* ── Block prop types (one per registered block) ───────────── */

export interface StandfirstProps { eyebrow_en?: string; eyebrow_xh?: string; lead_en: string; lead_xh?: string; }
export interface ProseProps { html_en: string; html_xh?: string; }
export interface PullProps { quote_en: string; quote_xh?: string; attribution?: string; }
export interface StatProps { value: string; label_en: string; label_xh?: string; }
export interface FigureProps { asset_id?: string; src?: string; alt_en?: string; alt_xh?: string; caption_en?: string; caption_xh?: string; credit?: string; }
export interface MediaProps { asset_id?: string; src?: string; kind: 'audio' | 'video'; transcript_en?: string; transcript_xh?: string; }
export interface RosterProps { filter: { discipline_slug?: string; pillar_slug?: string; province?: string }; limit?: number; }
export interface ProgrammeCardProps { programme_id: string; }
export interface CampaignCardProps { campaign_id: string; }
export interface ImbizoOutcomesProps { event_id: string; show_resolutions?: boolean; show_action_items?: boolean; }
export interface AssetPackProps { pack_id: string; label_en?: string; label_xh?: string; }
export interface FormEmbedProps { form_key: string; }
export interface AddToCalendarProps { event_id: string; label_en?: string; label_xh?: string; }
export interface IndicatorChartProps { indicator_slug: string; window_months?: number; }
export interface ChipProps { kind: 'discipline' | 'pillar'; slug: string; label_en?: string; label_xh?: string; }
export interface BookletBreakProps { /* no props */ }
export interface BookletHeaderProps { title_en: string; title_xh?: string; subtitle_en?: string; subtitle_xh?: string; cover_asset_id?: string; }
export interface BookletColophonProps { body_en: string; body_xh?: string; }

/* ── Tagged union of all blocks ─────────────────────────────── */

export type Block =
  | (BlockBase & { type: 'standfirst'; props: StandfirstProps })
  | (BlockBase & { type: 'prose'; props: ProseProps })
  | (BlockBase & { type: 'pull'; props: PullProps })
  | (BlockBase & { type: 'stat'; props: StatProps })
  | (BlockBase & { type: 'figure'; props: FigureProps })
  | (BlockBase & { type: 'media'; props: MediaProps })
  | (BlockBase & { type: 'roster'; props: RosterProps })
  | (BlockBase & { type: 'programme_card'; props: ProgrammeCardProps })
  | (BlockBase & { type: 'campaign_card'; props: CampaignCardProps })
  | (BlockBase & { type: 'imbizo_outcomes'; props: ImbizoOutcomesProps })
  | (BlockBase & { type: 'asset_pack'; props: AssetPackProps })
  | (BlockBase & { type: 'form_embed'; props: FormEmbedProps })
  | (BlockBase & { type: 'add_to_calendar'; props: AddToCalendarProps })
  | (BlockBase & { type: 'indicator_chart'; props: IndicatorChartProps })
  | (BlockBase & { type: 'chip'; props: ChipProps })
  | (BlockBase & { type: 'booklet_break'; props: BookletBreakProps })
  | (BlockBase & { type: 'booklet_header'; props: BookletHeaderProps })
  | (BlockBase & { type: 'booklet_colophon'; props: BookletColophonProps });

export type BlockType = Block['type'];

/* ── Block registry entry ───────────────────────────────────── */

export interface BlockRegistryEntry {
  type: BlockType;
  label: string;
  caption: string;
  targets: BlockTarget[];
  /** Does this block depend on a primitive that lands in a later phase? */
  pendingPhase?: string;
  /** Seed props for a new instance. */
  defaultProps: () => Record<string, unknown>;
}

export const BLOCK_REGISTRY: BlockRegistryEntry[] = [
  { type: 'standfirst', label: 'Standfirst', caption: 'Eyebrow + lead sentence. Anchors the piece.', targets: ['web', 'print', 'email'], defaultProps: () => ({ eyebrow_en: '', lead_en: '' }) },
  { type: 'prose', label: 'Prose', caption: 'Rich text. Bilingual panes.', targets: ['web', 'print', 'email'], defaultProps: () => ({ html_en: '' }) },
  { type: 'pull', label: 'Pull quote', caption: 'Pulled quote, large gold serif.', targets: ['web', 'print'], defaultProps: () => ({ quote_en: '' }) },
  { type: 'stat', label: 'Stat', caption: 'Mono number with label.', targets: ['web', 'print', 'email'], defaultProps: () => ({ value: '', label_en: '' }) },
  { type: 'figure', label: 'Figure', caption: 'Asset with alt, caption, credit.', targets: ['web', 'print', 'email'], defaultProps: () => ({}) },
  { type: 'media', label: 'Media', caption: 'Audio or video with transcript.', targets: ['web'], defaultProps: () => ({ kind: 'audio' }) },
  { type: 'add_to_calendar', label: 'Add to calendar', caption: '.ics for Google + Outlook.', targets: ['web', 'email'], defaultProps: () => ({ event_id: '' }) },
  { type: 'chip', label: 'Discipline / Pillar chip', caption: 'Inline tappable taxonomy link.', targets: ['web', 'email'], defaultProps: () => ({ kind: 'discipline', slug: '' }) },
  { type: 'booklet_break', label: 'Booklet break', caption: 'Print-only page break.', targets: ['print'], defaultProps: () => ({}) },
  { type: 'booklet_header', label: 'Booklet header', caption: 'Print-only cover page.', targets: ['print'], defaultProps: () => ({ title_en: '' }) },
  { type: 'booklet_colophon', label: 'Booklet colophon', caption: 'Print-only back matter.', targets: ['print'], defaultProps: () => ({ body_en: '' }) },
  // Pending primitives (land in later phases but registered so the registry stays stable)
  { type: 'roster', label: 'Roster', caption: 'Live Council list filtered by discipline.', targets: ['web'], pendingPhase: 'B3', defaultProps: () => ({ filter: {} }) },
  { type: 'programme_card', label: 'Programme card', caption: 'Live programme with status.', targets: ['web', 'email'], pendingPhase: 'D7', defaultProps: () => ({ programme_id: '' }) },
  { type: 'campaign_card', label: 'Campaign card', caption: 'Live campaign with CTA.', targets: ['web', 'email'], pendingPhase: 'C6', defaultProps: () => ({ campaign_id: '' }) },
  { type: 'imbizo_outcomes', label: 'Imbizo outcomes', caption: 'Resolutions + Action Items.', targets: ['web', 'print'], pendingPhase: 'D8', defaultProps: () => ({ event_id: '' }) },
  { type: 'asset_pack', label: 'Asset pack', caption: 'Embedded downloadable pack.', targets: ['web'], pendingPhase: 'A2', defaultProps: () => ({ pack_id: '' }) },
  { type: 'form_embed', label: 'Form embed', caption: 'Inline form — register, RSVP, submit.', targets: ['web', 'email'], pendingPhase: 'B4', defaultProps: () => ({ form_key: '' }) },
  { type: 'indicator_chart', label: 'Indicator chart', caption: 'Live sector indicator over time.', targets: ['web'], pendingPhase: 'E10', defaultProps: () => ({ indicator_slug: '' }) },
];

export function blockEntry(type: BlockType): BlockRegistryEntry {
  const entry = BLOCK_REGISTRY.find((b) => b.type === type);
  if (!entry) throw new Error(`Unknown block type: ${type}`);
  return entry;
}

export function newBlock(type: BlockType): Block {
  const entry = blockEntry(type);
  const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { type, key, props: entry.defaultProps() } as Block;
}
