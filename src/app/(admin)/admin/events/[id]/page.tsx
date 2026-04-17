'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import ImageUploader from '@/components/ImageUploader';
import { exportToCSV, AttendanceRegisterPrint, DSACReportTemplate } from '@/components/EventFeatures';

/* ============================================================
   Event Detail — Admin Manage View
   Tabs: Overview | Registrations | Campaigns | Post-Event
   ============================================================ */

interface EventFull { id: number; title: string; slug: string; event_date: string; event_time: string; venue: string; venue_address: string; capacity: number; status: string; event_type: string; format: string; tagline: string; description: string; is_dedicated: boolean; programme_schedule: any[]; speakers: any[]; sponsors: any[]; recording_url: string; gallery_urls: string[]; feedback_enabled: boolean; registration_required: boolean; documents: any[]; virtual_link: string; reminder_days: number[] }
interface Registration { id: string; name: string; email: string; phone: string; organisation: string; province: string; checked_in: boolean; checked_in_at: string; created_at: string; waitlisted: boolean }
interface Campaign { id: number; campaign_type: string; subject: string; body: string; status: string; recipient_list: string; scheduled_at: string; sent_at: string; recipient_count: number }
interface Feedback { id: string; name: string; rating: number; highlights: string; improvements: string; would_recommend: boolean; created_at: string }

const CAMPAIGN_TYPES = ['save_the_date', 'invitation', 'reminder', 'last_call', 'post_event', 'custom'];

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<EventFull | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'programme' | 'speakers' | 'sponsors' | 'tickets' | 'registrations' | 'campaigns' | 'post-event'>('overview');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ campaign_type: 'invitation', subject: '', body: '', recipient_list: 'registrants' });
  const [postForm, setPostForm] = useState({ recording_url: '' });

  useEffect(() => { load(); }, [params.id]);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [evRes, regRes, camRes, fbRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', params.id).single(),
      supabase.from('event_registrations').select('*').eq('event_id', params.id).order('created_at', { ascending: false }),
      supabase.from('event_campaigns').select('*').eq('event_id', params.id).order('created_at', { ascending: false }),
      supabase.from('event_feedback').select('*').eq('event_id', params.id).order('created_at', { ascending: false }),
    ]);
    setEvent(evRes.data as EventFull);
    setRegistrations((regRes.data || []) as Registration[]);
    setCampaigns((camRes.data || []) as Campaign[]);
    setFeedback((fbRes.data || []) as Feedback[]);
    if (evRes.data) setPostForm({ recording_url: (evRes.data as any).recording_url || '' });
    setLoading(false);
  }

  async function toggleCheckIn(reg: Registration) {
    if (!supabase) return;
    await supabase.from('event_registrations').update({ checked_in: !reg.checked_in, checked_in_at: !reg.checked_in ? new Date().toISOString() : null }).eq('id', reg.id);
    load();
  }

  async function createCampaign() {
    if (!supabase || !campaignForm.subject) return;
    await supabase.from('event_campaigns').insert({ event_id: parseInt(params.id), ...campaignForm, status: 'draft', recipient_count: registrations.length });
    setShowCampaignForm(false);
    setCampaignForm({ campaign_type: 'invitation', subject: '', body: '', recipient_list: 'registrants' });
    load();
  }

  async function markCampaignSent(cam: Campaign) {
    if (!supabase) return;
    await supabase.from('event_campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), recipient_count: registrations.length }).eq('id', cam.id);
    load();
  }

  async function saveRecordingUrl() {
    if (!supabase || !event) return;
    await supabase.from('events').update({ recording_url: postForm.recording_url || null }).eq('id', event.id);
    load();
  }

  if (loading) return <div className="py-20 text-center text-gray-400 text-sm">Loading...</div>;
  if (!event) return <div className="py-20 text-center"><p className="text-gray-500">Event not found.</p><Link href="/admin/events" className="text-xs text-black mt-2 inline-block">&larr; Back</Link></div>;

  const checkedIn = registrations.filter(r => r.checked_in).length;
  const provinces = Array.from(new Set(registrations.map(r => r.province).filter(Boolean)));
  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : '—';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/events" className="text-xs text-gray-500 hover:text-black transition-colors">&larr; All Events</Link>
        <div className="flex items-start justify-between mt-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-gray-200 text-gray-500 rounded">{event.event_type}</span>
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-gray-200 text-gray-500 rounded">{event.format}</span>
              {event.is_dedicated && <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Dedicated Page</span>}
            </div>
            <h1 className="text-2xl font-display font-bold text-black">{event.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{event.event_date} &middot; {event.venue || 'TBC'}</p>
          </div>
          <div className="flex items-center gap-2">
            {event.is_dedicated && event.slug && (
              <a href={`/events/${event.slug}`} target="_blank" rel="noopener" className="text-[10px] uppercase tracking-wider px-4 py-2 border border-gray-200 text-gray-500 rounded hover:text-black hover:border-black transition-colors">View Public Page →</a>
            )}
            <button
              onClick={async () => {
                if (!supabase || !confirm('Clone this event as a new draft?')) return;
                const { data: cloned } = await supabase.from('events').insert({
                  title: `${event.title} (Copy)`, slug: `${event.slug || event.id}-copy-${Date.now().toString(36)}`,
                  event_type: event.event_type, format: event.format, status: 'draft',
                  description: event.description, tagline: event.tagline, is_dedicated: event.is_dedicated,
                  programme_schedule: event.programme_schedule, speakers: event.speakers, sponsors: event.sponsors,
                  venue: event.venue, venue_address: event.venue_address, capacity: event.capacity,
                  registration_required: event.registration_required, event_date: event.event_date, event_time: event.event_time,
                }).select('id').single();
                if (cloned) window.location.href = `/admin/events/${cloned.id}`;
              }}
              className="text-[10px] uppercase tracking-wider px-4 py-2 border border-gray-200 text-gray-500 rounded hover:text-black hover:border-black transition-colors"
            >
              Clone Event
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="border border-gray-200/60 rounded p-3 text-center"><p className="text-xl font-bold text-black">{registrations.length}</p><p className="text-[9px] text-gray-500 uppercase">Registered</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-3 text-center"><p className="text-xl font-bold text-green-700">{checkedIn}</p><p className="text-[9px] text-gray-500 uppercase">Checked In</p></div>
        <div className="border border-gray-200/60 rounded p-3 text-center"><p className="text-xl font-bold text-black">{provinces.length}</p><p className="text-[9px] text-gray-500 uppercase">Provinces</p></div>
        <div className="border border-gray-200/60 rounded p-3 text-center"><p className="text-xl font-bold text-black">{campaigns.length}</p><p className="text-[9px] text-gray-500 uppercase">Campaigns</p></div>
        <div className="border border-amber-500/30 bg-amber-500/5 rounded p-3 text-center"><p className="text-xl font-bold text-amber-700">{avgRating}</p><p className="text-[9px] text-gray-500 uppercase">Avg Rating</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {(['overview', 'speakers', 'programme', 'sponsors', 'tickets', 'registrations', 'campaigns', 'post-event'] as const).map(t => {
          const labels: Record<string, string> = { 'post-event': 'Post-Event', programme: `Programme (${(event.programme_schedule || []).length})`, speakers: `Speakers (${(event.speakers || []).length})`, sponsors: `Sponsors (${(event.sponsors || []).length})`, registrations: `Registrations (${registrations.length})`, campaigns: `Campaigns (${campaigns.length})` };
          return (
            <button key={t} onClick={() => setTab(t)} className={`text-[10px] uppercase tracking-wider px-4 py-2 rounded transition-colors ${tab === t ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}>
              {labels[t] || t}
            </button>
          );
        })}
      </div>

      {/* TAB: Overview (editable) */}
      {tab === 'overview' && <OverviewEditor event={event} onSave={load} />}

      {/* TAB: Programme Builder */}
      {tab === 'programme' && <ProgrammeBuilder event={event} onSave={load} eventSpeakers={Array.isArray(event.speakers) ? event.speakers : []} />}

      {/* TAB: Speakers */}
      {tab === 'speakers' && <SpeakersBuilder event={event} onSave={load} />}

      {/* TAB: Sponsors */}
      {tab === 'sponsors' && <SponsorsBuilder event={event} onSave={load} />}

      {/* TAB: Tickets */}
      {tab === 'tickets' as any && <TicketsManager eventId={event.id} />}

      {/* TAB: Registrations */}
      {tab === 'registrations' && (
        <div>
          <div className="flex justify-end gap-2 mb-4 no-print">
            <button
              onClick={() => exportToCSV(registrations.map(r => ({ Name: r.name, Email: r.email, Phone: r.phone || '', Organisation: r.organisation || '', Province: r.province || '', 'Checked In': r.checked_in ? 'Yes' : 'No', 'Registered At': r.created_at, Waitlisted: r.waitlisted ? 'Yes' : 'No' })), `${event.slug || event.id}-registrations`)}
              className="text-[10px] uppercase tracking-wider px-4 py-2 border border-gray-200 text-gray-500 rounded hover:text-black hover:border-black transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="text-[10px] uppercase tracking-wider px-4 py-2 border border-gray-200 text-gray-500 rounded hover:text-black hover:border-black transition-colors"
            >
              Print Attendance Register
            </button>
          </div>
          <AttendanceRegisterPrint
            eventTitle={event.title}
            eventDate={new Date(event.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            venue={event.venue}
            registrations={registrations.map(r => ({ name: r.name, organisation: r.organisation, province: r.province }))}
          />
        <div className="border border-gray-200/60 rounded no-print">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500">
            <span className="col-span-3">Name</span><span className="col-span-3">Email</span><span className="col-span-2">Organisation</span><span className="col-span-2">Province</span><span className="col-span-2">Check-in</span>
          </div>
          {registrations.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No registrations yet</div>
          ) : registrations.map(r => (
            <div key={r.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm">
              <span className="col-span-3 text-black font-medium">{r.name}</span>
              <span className="col-span-3 text-gray-500 text-xs">{r.email}</span>
              <span className="col-span-2 text-gray-500 text-xs">{r.organisation || '—'}</span>
              <span className="col-span-2 text-gray-500 text-xs">{r.province || '—'}</span>
              <span className="col-span-2">
                <button onClick={() => toggleCheckIn(r)} className={`text-[9px] uppercase tracking-wider px-2 py-1 border rounded transition-colors ${r.checked_in ? 'border-green-500/30 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {r.checked_in ? '✓ Checked In' : 'Check In'}
                </button>
              </span>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* TAB: Campaigns */}
      {tab === 'campaigns' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowCampaignForm(true)} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2 uppercase rounded hover:bg-gray-800">+ New Campaign</button>
          </div>
          <div className="border border-gray-200/60 rounded">
            {campaigns.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">No campaigns yet — create your first for this event</div>
            ) : campaigns.map(c => (
              <div key={c.id} className="px-6 py-4 border-b border-gray-200/30 last:border-0 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">{c.subject}</p>
                  <p className="text-xs text-gray-500 capitalize">{c.campaign_type.replace(/_/g, ' ')} &middot; {c.recipient_list} &middot; {c.recipient_count} recipients</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded ${c.status === 'sent' ? 'border-green-500/30 text-green-700' : 'border-gray-200 text-gray-500'}`}>{c.status}</span>
                  {c.status === 'draft' && <button onClick={() => markCampaignSent(c)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-green-500/30 text-green-700 rounded hover:bg-green-50 transition-colors">Mark Sent</button>}
                </div>
              </div>
            ))}
          </div>

          {showCampaignForm && (
            <>
              <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowCampaignForm(false)} />
              <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
                <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
                  <h3 className="text-base font-display font-bold text-black mb-4">New Campaign</h3>
                  <div className="space-y-3">
                    <select value={campaignForm.campaign_type} onChange={e => setCampaignForm(f => ({ ...f, campaign_type: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded">
                      {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                    <input value={campaignForm.subject} onChange={e => setCampaignForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject line" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                    <textarea value={campaignForm.body} onChange={e => setCampaignForm(f => ({ ...f, body: e.target.value }))} placeholder="Campaign body (markdown)" rows={6} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y font-mono" />
                    <select value={campaignForm.recipient_list} onChange={e => setCampaignForm(f => ({ ...f, recipient_list: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded">
                      <option value="registrants">All Registrants ({registrations.length})</option>
                      <option value="constituency">Full Constituency</option>
                      <option value="waitlisted">Waitlisted Only</option>
                    </select>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowCampaignForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                    <button onClick={createCampaign} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Create Draft</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: Post-Event */}
      {tab === 'post-event' && (
        <div className="space-y-6">
          {/* DSAC Report */}
          <DSACReportTemplate
            event={{ title: event.title, event_date: event.event_date, venue: event.venue, event_type: event.event_type, budget_allocated: (event as any).budget_allocated, budget_spent: (event as any).budget_spent }}
            registrations={registrations.map(r => ({ checked_in: r.checked_in, province: r.province }))}
            feedback={feedback.map(f => ({ rating: f.rating }))}
            provinces={provinces}
          />

          {/* Recording */}
          <div className="border border-gray-200/60 rounded p-6">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Recording</p>
            <div className="flex gap-3">
              <input value={postForm.recording_url} onChange={e => setPostForm(f => ({ ...f, recording_url: e.target.value }))} placeholder="YouTube or Vimeo URL" className="flex-1 border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
              <button onClick={saveRecordingUrl} className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2 uppercase rounded hover:bg-gray-800">Save</button>
            </div>
          </div>

          {/* Impact Summary */}
          <div className="border border-gray-200/60 rounded p-6">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Impact Summary (for DSAC reporting)</p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-bold text-black">{registrations.length}</p><p className="text-[9px] text-gray-500 uppercase">Registered</p></div>
              <div><p className="text-2xl font-bold text-green-700">{checkedIn}</p><p className="text-[9px] text-gray-500 uppercase">Attended</p></div>
              <div><p className="text-2xl font-bold text-black">{provinces.length}</p><p className="text-[9px] text-gray-500 uppercase">Provinces</p></div>
              <div><p className="text-2xl font-bold text-amber-700">{checkedIn > 0 && registrations.length > 0 ? Math.round((checkedIn / registrations.length) * 100) : 0}%</p><p className="text-[9px] text-gray-500 uppercase">Attendance Rate</p></div>
            </div>
            {provinces.length > 0 && <p className="text-xs text-gray-500 mt-4">Provinces: {provinces.join(', ')}</p>}
          </div>

          {/* Feedback */}
          <div className="border border-gray-200/60 rounded p-6">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Feedback ({feedback.length} responses)</p>
            {feedback.length === 0 ? (
              <p className="text-sm text-gray-400">{event.feedback_enabled ? 'No feedback received yet' : 'Feedback not enabled for this event'}</p>
            ) : (
              <div className="space-y-3">
                {feedback.map(f => (
                  <div key={f.id} className="border border-gray-100 rounded p-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-black">{f.name || 'Anonymous'}</p>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= f.rating ? 'text-gray-500' : 'text-gray-200'}`}>★</span>)}</div>
                    </div>
                    {f.highlights && <p className="text-xs text-gray-600"><strong>Highlights:</strong> {f.highlights}</p>}
                    {f.improvements && <p className="text-xs text-gray-600"><strong>Improvements:</strong> {f.improvements}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW EDITOR (replaces read-only overview with full edit form)
// ═══════════════════════════════════════════════════════════════

const EVENT_TYPES = ['event', 'symposium', 'workshop', 'imbizo', 'launch', 'webinar', 'conference'];
const FORMATS = ['in-person', 'virtual', 'hybrid'];
const STATUSES = ['draft', 'published', 'registration_open', 'full', 'completed', 'cancelled'];

function OverviewEditor({ event, onSave }: { event: EventFull; onSave: () => void }) {
  const [form, setForm] = useState({
    title: event.title || '', slug: event.slug || '', tagline: event.tagline || '',
    description: event.description || '', event_date: event.event_date?.split('T')[0] || '',
    event_time: event.event_time?.slice(0, 5) || '', end_date: (event as any).end_date?.split('T')[0] || '',
    venue: event.venue || '', venue_address: event.venue_address || '',
    capacity: String(event.capacity || ''), event_type: event.event_type || 'event',
    format: event.format || 'in-person', status: event.status || 'draft',
    cover_image_url: (event as any).cover_image_url || '',
    registration_required: event.registration_required !== false,
    is_dedicated: event.is_dedicated || false,
    virtual_link: (event as any).virtual_link || '',
    budget_allocated: String((event as any).budget_allocated || ''),
    budget_spent: String((event as any).budget_spent || ''),
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!supabase) return;
    setSaving(true);
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const update: Record<string, any> = {
      title: form.title, slug, tagline: form.tagline || null,
      description: form.description || null,
      event_date: form.event_date, event_time: form.event_time || null,
      end_date: form.end_date || null, venue: form.venue || null,
      venue_address: form.venue_address || null,
      capacity: parseInt(form.capacity) || null,
      event_type: form.event_type, format: form.format, status: form.status,
      cover_image_url: form.cover_image_url || null,
      registration_required: form.registration_required,
      is_dedicated: form.is_dedicated,
    };
    if (form.virtual_link) update.virtual_link = form.virtual_link;
    if (form.budget_allocated) update.budget_allocated = parseFloat(form.budget_allocated);
    if (form.budget_spent) update.budget_spent = parseFloat(form.budget_spent);
    const { error } = await supabase.from('events').update(update).eq('id', event.id);
    if (error) console.error('Save failed:', error.message);
    setSaving(false);
    onSave();
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="bg-black text-white text-[10px] uppercase tracking-wider px-6 py-2.5 rounded hover:bg-black/90 disabled:opacity-50 font-semibold">{saving ? 'Saving…' : 'Save Changes'}</button>
      </div>

      <div className="border border-gray-200/60 rounded p-6 space-y-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Event Details</p>
        <Field label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} required placeholder="Power of the Pen 2026" />
        <Field label="Tagline" value={form.tagline} onChange={v => setForm({ ...form, tagline: v })} placeholder="One sentence that captures what this event is" />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Type</label>
            <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black">{EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Format</label>
            <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black">{FORMATS.map(f => <option key={f} value={f}>{f}</option>)}</select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black">{STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Date" value={form.event_date} onChange={v => setForm({ ...form, event_date: v })} type="date" required />
          <Field label="Time" value={form.event_time} onChange={v => setForm({ ...form, event_time: v })} type="time" />
          <Field label="End date" value={form.end_date} onChange={v => setForm({ ...form, end_date: v })} type="date" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Venue" value={form.venue} onChange={v => setForm({ ...form, venue: v })} placeholder="Durban ICC, Hall A" />
          <Field label="Full venue address" value={form.venue_address} onChange={v => setForm({ ...form, venue_address: v })} placeholder="Street, city, postal code" />
        </div>

        <Field label="Capacity" value={form.capacity} onChange={v => setForm({ ...form, capacity: v })} type="number" placeholder="150" />
        <Field label="URL slug" value={form.slug} onChange={v => setForm({ ...form, slug: v })} placeholder="auto-generated from title" />
      </div>

      <div className="border border-gray-200/60 rounded p-6 space-y-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Description & Cover</p>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Cover Image</label>
          <ImageUploader value={form.cover_image_url} onChange={(url: string) => setForm({ ...form, cover_image_url: url })} folder="events" label="" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={6} placeholder="Describe the event — who it's for, what it covers, what to expect…" className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black resize-y" />
        </div>
      </div>

      <div className="border border-gray-200/60 rounded p-6 space-y-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Settings</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Virtual link (Zoom / Teams)" value={form.virtual_link} onChange={v => setForm({ ...form, virtual_link: v })} placeholder="https://zoom.us/j/..." />
          <div />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget allocated (ZAR)" value={form.budget_allocated} onChange={v => setForm({ ...form, budget_allocated: v })} type="number" placeholder="0" />
          <Field label="Budget spent (ZAR)" value={form.budget_spent} onChange={v => setForm({ ...form, budget_spent: v })} type="number" placeholder="0" />
        </div>
        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.registration_required} onChange={e => setForm({ ...form, registration_required: e.target.checked })} className="w-4 h-4 accent-black" />
            <span className="text-xs text-black">Registration required</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_dedicated} onChange={e => setForm({ ...form, is_dedicated: e.target.checked })} className="w-4 h-4 accent-black" />
            <span className="text-xs text-black">Dedicated event page (mini-site at /events/{form.slug || '[slug]'})</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="bg-black text-white text-[10px] uppercase tracking-wider px-6 py-2.5 rounded hover:bg-black/90 disabled:opacity-50 font-semibold">{saving ? 'Saving…' : 'Save Changes'}</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROGRAMME BUILDER
// ═══════════════════════════════════════════════════════════════

const SESSION_TYPES = ['opening', 'session', 'panel', 'workshop', 'break', 'closing', 'keynote'];

function ProgrammeBuilder({ event, onSave, eventSpeakers }: { event: EventFull; onSave: () => void; eventSpeakers: any[] }) {
  const [items, setItems] = useState<any[]>(Array.isArray(event.programme_schedule) ? event.programme_schedule : []);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ time: '', title: '', description: '', type: 'session', facilitator: '', speakers: '', notes: '' });
  const [saving, setSaving] = useState(false);

  function openNew() { setEditing(-1); setForm({ time: '', title: '', description: '', type: 'session', facilitator: '', speakers: '', notes: '' }); }
  function openEdit(i: number) { setEditing(i); const it = items[i]; setForm({ time: it.time || '', title: it.title || '', description: it.description || '', type: it.type || 'session', facilitator: it.facilitator || '', speakers: it.speakers || '', notes: it.notes || '' }); }
  function saveItem() {
    const entry = { ...form };
    if (editing === -1) setItems([...items, entry]);
    else { const copy = [...items]; copy[editing!] = entry; setItems(copy); }
    setEditing(null);
  }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function moveItem(i: number, dir: -1 | 1) { if ((dir === -1 && i === 0) || (dir === 1 && i === items.length - 1)) return; const copy = [...items]; [copy[i], copy[i + dir]] = [copy[i + dir], copy[i]]; setItems(copy); }

  async function persist() {
    if (!supabase) return;
    setSaving(true);
    await supabase.from('events').update({ programme_schedule: items }).eq('id', event.id);
    setSaving(false);
    onSave();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Programme Schedule · {items.length} items</p>
        <div className="flex gap-2">
          <button onClick={openNew} className="bg-black text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-black/90">+ Add Session</button>
          <button onClick={persist} disabled={saving} className="bg-black text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-black/90 disabled:opacity-50">{saving ? 'Saving…' : 'Save Programme'}</button>
        </div>
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded border ${item.type === 'break' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200/60'}`}>
            <span className="text-xs font-mono text-gray-500/70 w-14 flex-shrink-0">{item.time || '—'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-200 text-gray-400 rounded">{item.type}</span>
                <p className="text-sm font-medium text-black truncate">{item.title}</p>
              </div>
              {item.facilitator && <p className="text-[11px] text-gray-500 mt-0.5">Facilitator: {item.facilitator}</p>}
              {item.speakers && <p className="text-[11px] text-gray-500 mt-0.5">{item.speakers}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => moveItem(i, -1)} className="text-gray-300 hover:text-gray-600 text-xs px-1" title="Move up">↑</button>
              <button onClick={() => moveItem(i, 1)} className="text-gray-300 hover:text-gray-600 text-xs px-1" title="Move down">↓</button>
              <button onClick={() => openEdit(i)} className="text-[10px] text-gray-400 hover:text-black px-2">Edit</button>
              <button onClick={() => removeItem(i)} className="text-[10px] text-red-400 hover:text-red-600 px-2">×</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No programme items yet. Add your first session.</p>}
      </div>
      {editing !== null && (
        <Modal title={editing === -1 ? 'Add Session' : 'Edit Session'} onClose={() => setEditing(null)} onSave={saveItem}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time" value={form.time} onChange={v => setForm({ ...form, time: v })} placeholder="09:00" />
            <div><label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black">{SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          <Field label="Session Title" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="Authors as Healers and Transformers" />
          <Field label="Subtitle / Description" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Reinventing Authorship in the Era of…" multiline />
          <Field label="Facilitator" value={form.facilitator} onChange={v => setForm({ ...form, facilitator: v })} placeholder="Sihle Khumalo" />
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Speakers</label>
            {eventSpeakers.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No speakers added yet. Go to the Speakers tab first to add speakers, then assign them to sessions here.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {eventSpeakers.map((sp: any, si: number) => {
                  const selected = (form.speakers || '').split(',').map((s: string) => s.trim()).includes(sp.name);
                  return (
                    <button
                      key={si}
                      type="button"
                      onClick={() => {
                        const current = (form.speakers || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                        const next = selected ? current.filter(n => n !== sp.name) : [...current, sp.name];
                        setForm({ ...form, speakers: next.join(', ') });
                      }}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${selected ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-gray-200 hover:border-black'}`}
                    >
                      {sp.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Field label="Notes" value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Internal notes (not shown publicly)" />
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPEAKERS BUILDER
// ═══════════════════════════════════════════════════════════════

const SPEAKER_TYPES = ['keynote', 'speaker', 'facilitator', 'panelist', 'moderator'];

function SpeakersBuilder({ event, onSave }: { event: EventFull; onSave: () => void }) {
  const [speakers, setSpeakers] = useState<any[]>(Array.isArray(event.speakers) ? event.speakers : []);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', title: '', organisation: '', bio: '', photo_url: '', session: '', type: 'speaker', website: '' });
  const [saving, setSaving] = useState(false);

  function openNew() { setEditing(-1); setForm({ name: '', title: '', organisation: '', bio: '', photo_url: '', session: '', type: 'speaker', website: '' }); }
  function openEdit(i: number) { setEditing(i); const sp = speakers[i]; setForm({ name: sp.name || '', title: sp.title || '', organisation: sp.organisation || '', bio: sp.bio || '', photo_url: sp.photo_url || '', session: sp.session || '', type: sp.type || 'speaker', website: sp.website || '' }); }
  function saveItem() {
    const entry = { ...form };
    if (editing === -1) setSpeakers([...speakers, entry]);
    else { const copy = [...speakers]; copy[editing!] = entry; setSpeakers(copy); }
    setEditing(null);
  }
  function removeItem(i: number) { setSpeakers(speakers.filter((_, idx) => idx !== i)); }

  async function persist() {
    if (!supabase) return;
    setSaving(true);
    await supabase.from('events').update({ speakers }).eq('id', event.id);
    setSaving(false);
    onSave();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Speakers · {speakers.length}</p>
        <div className="flex gap-2">
          <button onClick={openNew} className="bg-black text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-black/90">+ Add Speaker</button>
          <button onClick={persist} disabled={saving} className="bg-black text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-black/90 disabled:opacity-50">{saving ? 'Saving…' : 'Save Speakers'}</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {speakers.map((sp, i) => (
          <div key={i} className="border border-gray-200/60 rounded p-4 bg-white group">
            {sp.photo_url && <img src={sp.photo_url} alt={sp.name} className="w-14 h-14 rounded-full object-cover mb-3 grayscale group-hover:grayscale-0 transition-all" />}
            <p className="text-sm font-medium text-black">{sp.name}</p>
            <p className="text-[11px] text-gray-500">{sp.title}{sp.organisation ? ` — ${sp.organisation}` : ''}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-gray-200 text-gray-400 rounded">{sp.type}</span>
              {sp.session && <span className="text-[9px] text-gray-400 truncate">{sp.session}</span>}
            </div>
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(i)} className="text-[10px] text-gray-400 hover:text-black">Edit</button>
              <button onClick={() => removeItem(i)} className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
            </div>
          </div>
        ))}
        {speakers.length === 0 && <p className="text-sm text-gray-400 py-8 text-center col-span-full">No speakers yet. Add your first speaker.</p>}
      </div>
      {editing !== null && (
        <Modal title={editing === -1 ? 'Add Speaker' : 'Edit Speaker'} onClose={() => setEditing(null)} onSave={saveItem}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="Prof Sihawukele Ngubane" />
            <div><label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black">{SPEAKER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          </div>
          <Field label="Title / Role" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="Professor of isiZulu Literature" />
          <Field label="Organisation" value={form.organisation} onChange={v => setForm({ ...form, organisation: v })} placeholder="University of KwaZulu-Natal" />
          <Field label="Session" value={form.session} onChange={v => setForm({ ...form, session: v })} placeholder="Authors as Healers and Transformers" />
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Photo</label>
            <ImageUploader value={form.photo_url} onChange={(url: string) => setForm({ ...form, photo_url: url })} folder="speakers" label="" />
          </div>
          <Field label="Bio" value={form.bio} onChange={v => setForm({ ...form, bio: v })} multiline placeholder="Prof Ngubane is an academic and astute professional…" />
          <Field label="Website / Social" value={form.website} onChange={v => setForm({ ...form, website: v })} placeholder="https://…" />
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPONSORS BUILDER
// ═══════════════════════════════════════════════════════════════

const SPONSOR_TYPES = ['partner', 'sponsor', 'supporter', 'media_partner'];

function SponsorsBuilder({ event, onSave }: { event: EventFull; onSave: () => void }) {
  const [sponsors, setSponsors] = useState<any[]>(Array.isArray(event.sponsors) ? event.sponsors : []);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', type: 'partner', logo_url: '', website: '' });
  const [saving, setSaving] = useState(false);

  function openNew() { setEditing(-1); setForm({ name: '', type: 'partner', logo_url: '', website: '' }); }
  function openEdit(i: number) { setEditing(i); const sp = sponsors[i]; setForm({ name: sp.name || '', type: sp.type || 'partner', logo_url: sp.logo_url || '', website: sp.website || '' }); }
  function saveItem() {
    const entry = { ...form };
    if (editing === -1) setSponsors([...sponsors, entry]);
    else { const copy = [...sponsors]; copy[editing!] = entry; setSponsors(copy); }
    setEditing(null);
  }
  function removeItem(i: number) { setSponsors(sponsors.filter((_, idx) => idx !== i)); }

  async function persist() {
    if (!supabase) return;
    setSaving(true);
    await supabase.from('events').update({ sponsors }).eq('id', event.id);
    setSaving(false);
    onSave();
  }

  const grouped = SPONSOR_TYPES.map(type => ({ type, items: sponsors.map((s, i) => ({ ...s, _idx: i })).filter(s => s.type === type) })).filter(g => g.items.length > 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Sponsors & Partners · {sponsors.length}</p>
        <div className="flex gap-2">
          <button onClick={openNew} className="bg-black text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-black/90">+ Add</button>
          <button onClick={persist} disabled={saving} className="bg-black text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-black/90 disabled:opacity-50">{saving ? 'Saving…' : 'Save Sponsors'}</button>
        </div>
      </div>
      {grouped.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No sponsors yet. Add your first partner or sponsor.</p>}
      {grouped.map(g => (
        <div key={g.type} className="mb-6">
          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-3 capitalize">{g.type.replace('_', ' ')}s</p>
          <div className="flex flex-wrap gap-4">
            {g.items.map(sp => (
              <div key={sp._idx} className="border border-gray-200/60 rounded p-4 bg-white flex items-center gap-3 group min-w-[200px]">
                {sp.logo_url ? <img src={sp.logo_url} alt={sp.name} className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-400 font-bold">{(sp.name || '?')[0]}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{sp.name}</p>
                  {sp.website && <p className="text-[10px] text-gray-400 truncate">{sp.website}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(sp._idx)} className="text-[10px] text-gray-400 hover:text-black">Edit</button>
                  <button onClick={() => removeItem(sp._idx)} className="text-[10px] text-red-400 hover:text-red-600">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {editing !== null && (
        <Modal title={editing === -1 ? 'Add Sponsor' : 'Edit Sponsor'} onClose={() => setEditing(null)} onSave={saveItem}>
          <Field label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="International Authors Forum" />
          <div><label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Tier</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black">{SPONSOR_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">Logo</label>
            <ImageUploader value={form.logo_url} onChange={(url: string) => setForm({ ...form, logo_url: url })} folder="sponsors" label="" />
          </div>
          <Field label="Website" value={form.website} onChange={v => setForm({ ...form, website: v })} placeholder="https://internationalauthors.org" />
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-16 p-6">
        <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-display font-bold text-black">{title}</h3>
          </div>
          <div className="px-6 py-5 space-y-4">{children}</div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="text-xs text-black/50 hover:text-black px-4 py-2">Cancel</button>
            <button onClick={onSave} className="bg-black text-white text-xs uppercase tracking-[0.15em] font-semibold px-6 py-2.5 rounded hover:bg-black/90">Save</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// TICKETS MANAGER
// ═══════════════════════════════════════════════════════════════

interface TicketType { id: string; name: string; description: string | null; price_zar: number; quantity: number | null; sold: number; sort_order: number; is_active: boolean; sale_start: string | null; sale_end: string | null }

function TicketsManager({ eventId }: { eventId: number }) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TicketType | null | 'new'>(null);
  const [form, setForm] = useState({ name: '', description: '', price_zar: '', quantity: '', sale_start: '', sale_end: '' });

  useEffect(() => { load(); }, [eventId]);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('event_ticket_types').select('*').eq('event_id', eventId).order('sort_order');
    setTickets((data || []) as TicketType[]);
    setLoading(false);
  }

  function openNew() { setEditing('new'); setForm({ name: '', description: '', price_zar: '0', quantity: '', sale_start: '', sale_end: '' }); }
  function openEdit(t: TicketType) { setEditing(t); setForm({ name: t.name, description: t.description || '', price_zar: String(t.price_zar), quantity: t.quantity != null ? String(t.quantity) : '', sale_start: t.sale_start?.slice(0, 16) || '', sale_end: t.sale_end?.slice(0, 16) || '' }); }

  async function saveTicket() {
    if (!supabase || !form.name) return;
    const payload = {
      event_id: eventId,
      name: form.name,
      description: form.description || null,
      price_zar: parseFloat(form.price_zar) || 0,
      quantity: form.quantity ? parseInt(form.quantity) : null,
      sale_start: form.sale_start || null,
      sale_end: form.sale_end || null,
      sort_order: editing === 'new' ? tickets.length : (editing as TicketType).sort_order,
    };
    if (editing === 'new') {
      await supabase.from('event_ticket_types').insert(payload);
    } else {
      await supabase.from('event_ticket_types').update(payload).eq('id', (editing as TicketType).id);
    }
    setEditing(null);
    load();
  }

  async function toggleActive(t: TicketType) {
    if (!supabase) return;
    await supabase.from('event_ticket_types').update({ is_active: !t.is_active }).eq('id', t.id);
    load();
  }

  async function deleteTicket(id: string) {
    if (!supabase || !confirm('Delete this ticket type?')) return;
    await supabase.from('event_ticket_types').delete().eq('id', id);
    load();
  }

  if (loading) return <p className="text-xs text-gray-400 py-8 text-center">Loading tickets…</p>;

  const totalSold = tickets.reduce((s, t) => s + t.sold, 0);
  const totalRevenue = tickets.reduce((s, t) => s + (t.sold * t.price_zar), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Ticket Types · {tickets.length}</p>
        <button onClick={openNew} className="bg-black text-white text-[10px] uppercase tracking-wider px-4 py-2 rounded hover:bg-black/90">+ Add Ticket Type</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-gray-200/60 rounded p-3 text-center"><p className="text-xl font-bold text-black">{tickets.length}</p><p className="text-[9px] text-gray-500 uppercase">Types</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-3 text-center"><p className="text-xl font-bold text-green-700">{totalSold}</p><p className="text-[9px] text-gray-500 uppercase">Sold</p></div>
        <div className="border border-black/30 bg-black/5 rounded p-3 text-center"><p className="text-xl font-bold text-gray-500">R{totalRevenue.toLocaleString('en-ZA')}</p><p className="text-[9px] text-gray-500 uppercase">Revenue</p></div>
      </div>

      {tickets.length === 0 ? (
        <div className="border border-gray-200 rounded p-12 text-center bg-white">
          <p className="text-gray-500 mb-3">No ticket types yet.</p>
          <p className="text-xs text-gray-400">Add ticket types like &ldquo;General Admission&rdquo;, &ldquo;VIP&rdquo;, &ldquo;Student&rdquo;, &ldquo;Early Bird&rdquo;. Set price to R0 for free events.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => (
            <div key={t.id} className={`flex items-center gap-4 px-4 py-3 rounded border ${t.is_active ? 'bg-white border-gray-200/60' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-black">{t.name}</p>
                  {!t.is_active && <span className="text-[9px] uppercase text-red-400">Inactive</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.price_zar > 0 ? `R${t.price_zar.toLocaleString('en-ZA')}` : 'Free'}
                  {t.quantity != null ? ` · ${t.sold}/${t.quantity} sold` : ` · ${t.sold} sold`}
                  {t.description && ` · ${t.description}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(t)} className={`text-[9px] uppercase tracking-wider px-2 py-1 border rounded ${t.is_active ? 'border-green-500/30 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                  {t.is_active ? 'Active' : 'Activate'}
                </button>
                <button onClick={() => openEdit(t)} className="text-[10px] text-gray-400 hover:text-black">Edit</button>
                <button onClick={() => deleteTicket(t.id)} className="text-[10px] text-red-400 hover:text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing === 'new' ? 'Add Ticket Type' : 'Edit Ticket Type'} onClose={() => setEditing(null)} onSave={saveTicket}>
          <Field label="Ticket Name" value={form.name} onChange={v => setForm({ ...form, name: v })} required placeholder="General Admission" />
          <Field label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Includes access to all sessions + refreshments" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (ZAR)" value={form.price_zar} onChange={v => setForm({ ...form, price_zar: v })} type="number" placeholder="0" />
            <Field label="Quantity (blank = unlimited)" value={form.quantity} onChange={v => setForm({ ...form, quantity: v })} type="number" placeholder="100" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sale starts" value={form.sale_start} onChange={v => setForm({ ...form, sale_start: v })} type="datetime-local" />
            <Field label="Sale ends" value={form.sale_end} onChange={v => setForm({ ...form, sale_end: v })} type="datetime-local" />
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, multiline, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; multiline?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.15em] text-black/50 font-semibold mb-1">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black resize-y" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black" />
      )}
    </div>
  );
}
