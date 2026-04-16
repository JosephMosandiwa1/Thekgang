'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

/* ============================================================
   Event Detail — Admin Manage View
   Tabs: Overview | Registrations | Campaigns | Post-Event
   ============================================================ */

interface EventFull { id: number; title: string; slug: string; event_date: string; event_time: string; venue: string; venue_address: string; capacity: number; status: string; event_type: string; format: string; tagline: string; description: string; is_dedicated: boolean; programme_schedule: any[]; speakers: any[]; sponsors: any[]; recording_url: string; gallery_urls: string[]; feedback_enabled: boolean; registration_required: boolean }
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
  const [tab, setTab] = useState<'overview' | 'registrations' | 'campaigns' | 'post-event'>('overview');
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
          {event.is_dedicated && event.slug && (
            <a href={`/events/${event.slug}`} target="_blank" rel="noopener" className="text-[10px] uppercase tracking-wider px-4 py-2 border border-gray-200 text-gray-500 rounded hover:text-black hover:border-black transition-colors">View Public Page &rarr;</a>
          )}
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
      <div className="flex gap-1 mb-6">
        {(['overview', 'registrations', 'campaigns', 'post-event'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`text-[10px] uppercase tracking-wider px-4 py-2 rounded transition-colors ${tab === t ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}>
            {t === 'post-event' ? 'Post-Event' : t}{t === 'registrations' ? ` (${registrations.length})` : t === 'campaigns' ? ` (${campaigns.length})` : ''}
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {event.description && <div className="border border-gray-200/60 rounded p-6"><p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Description</p><p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{event.description}</p></div>}
          {event.programme_schedule && event.programme_schedule.length > 0 && (
            <div className="border border-gray-200/60 rounded p-6">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Programme ({event.programme_schedule.length} items)</p>
              {event.programme_schedule.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 py-2 border-b border-gray-100 last:border-0"><span className="text-xs text-gray-500 w-14 flex-shrink-0 font-mono">{item.time}</span><div><p className="text-sm font-medium text-black">{item.title}</p>{item.speaker && <p className="text-xs text-gray-500">{item.speaker}</p>}</div></div>
              ))}
            </div>
          )}
          {event.speakers && event.speakers.length > 0 && (
            <div className="border border-gray-200/60 rounded p-6">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Speakers ({event.speakers.length})</p>
              <div className="grid grid-cols-2 gap-4">{event.speakers.map((sp: any, i: number) => (<div key={i} className="border border-gray-100 rounded p-3"><p className="text-sm font-medium text-black">{sp.name}</p><p className="text-xs text-gray-500">{sp.title}{sp.organisation ? ` — ${sp.organisation}` : ''}</p></div>))}</div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Registrations */}
      {tab === 'registrations' && (
        <div className="border border-gray-200/60 rounded">
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
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <span key={s} className={`text-xs ${s <= f.rating ? 'text-gold' : 'text-gray-200'}`}>★</span>)}</div>
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
