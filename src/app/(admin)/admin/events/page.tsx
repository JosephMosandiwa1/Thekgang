'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import ImageUploader from '@/components/ImageUploader';
import RichTextEditor from '@/components/RichTextEditor';

/* ============================================================
   Admin Events — WordPress-simple Quick Create
   ------------------------------------------------------------
   Two modes:
     1. Quick Create (default) — one screen, 5 required fields,
        optional details in a collapsible section. Create an
        event in 30 seconds.
     2. Advanced — open the per-event manage page at
        /admin/events/[id] for programme, speakers, sponsors,
        campaigns, registrations, feedback.
   ------------------------------------------------------------
   Smart defaults:
     status = 'published' (not 'draft')
     format = 'in-person'
     event_type = 'event'
     registration_required = true
     slug auto-generated from title
   ============================================================ */

const EVENT_TYPES = ['event', 'symposium', 'workshop', 'imbizo', 'launch', 'webinar', 'conference'] as const;
const FORMATS = ['in-person', 'virtual', 'hybrid'] as const;
const STATUSES = ['draft', 'published', 'registration_open', 'full', 'completed', 'cancelled'] as const;

const statusColors: Record<string, string> = {
  draft: 'text-gray-500 border-gray-200',
  published: 'text-blue-600 border-blue-500/30',
  registration_open: 'text-green-700 border-green-500/30',
  full: 'text-amber-700 border-amber-500/30',
  completed: 'text-black/60 border-gray-300',
  cancelled: 'text-red-600 border-red-500/30',
};

interface Event {
  id: number;
  title: string;
  slug: string;
  event_date: string;
  event_time: string;
  end_date: string;
  venue: string;
  venue_address: string;
  capacity: number;
  status: string;
  event_type: string;
  format: string;
  tagline: string;
  description: string;
  is_dedicated: boolean;
  registration_required: boolean;
  cover_image_url: string;
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  event_date: '',
  event_time: '',
  end_date: '',
  venue: '',
  venue_address: '',
  capacity: '',
  description: '',
  tagline: '',
  event_type: 'event' as (typeof EVENT_TYPES)[number],
  format: 'in-person' as (typeof FORMATS)[number],
  status: 'published' as (typeof STATUSES)[number],
  cover_image_url: '',
  registration_required: true,
  is_dedicated: true,
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    setEvents((data || []) as Event[]);
    setLoading(false);
  }

  async function openNew() {
    if (!supabase) return;
    const { data } = await supabase.from('events').insert({
      title: 'Untitled Event',
      event_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      event_type: 'event',
      format: 'in-person',
      is_dedicated: true,
      registration_required: true,
    }).select('id').single();
    if (data) router.push(`/admin/events/${data.id}`);
  }

  function openEdit(ev: Event) {
    setEditing(ev);
    setForm({
      title: ev.title || '',
      slug: ev.slug || '',
      event_date: ev.event_date?.split('T')[0] || '',
      event_time: ev.event_time?.slice(0, 5) || '',
      end_date: ev.end_date?.split('T')[0] || '',
      venue: ev.venue || '',
      venue_address: ev.venue_address || '',
      capacity: String(ev.capacity || ''),
      description: ev.description || '',
      tagline: ev.tagline || '',
      event_type: (ev.event_type as (typeof EVENT_TYPES)[number]) || 'event',
      format: (ev.format as (typeof FORMATS)[number]) || 'in-person',
      status: (ev.status as (typeof STATUSES)[number]) || 'published',
      cover_image_url: ev.cover_image_url || '',
      registration_required: ev.registration_required !== false,
      is_dedicated: ev.is_dedicated || false,
    });
    setShowMore(true); // pre-expand when editing existing
    setShowForm(true);
  }

  async function handleSave() {
    if (!supabase || !form.title || !form.event_date) return;
    setSaving(true);
    const slug =
      form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const record: any = {
      title: form.title,
      slug,
      event_type: form.event_type,
      format: form.format,
      event_date: form.event_date,
      event_time: form.event_time || null,
      end_date: form.end_date || null,
      venue: form.venue || null,
      venue_address: form.venue_address || null,
      capacity: parseInt(form.capacity) || null,
      description: form.description || null,
      tagline: form.tagline || null,
      status: form.status,
      cover_image_url: form.cover_image_url || null,
      registration_required: form.registration_required,
      is_dedicated: form.is_dedicated,
    };
    if (editing) {
      const { error: updateErr } = await supabase.from('events').update(record).eq('id', editing.id);
      setSaving(false);
      if (updateErr) {
        console.error('[events] update failed', updateErr, record);
        alert(`Could not update event:\n\n${updateErr.message}\n${updateErr.details ?? ''}\n${updateErr.hint ?? ''}`);
        return;
      }
      setShowForm(false);
      setEditing(null);
      load();
    } else {
      const { data: created, error: insertErr } = await supabase
        .from('events')
        .insert(record)
        .select('id')
        .single();
      setSaving(false);
      if (insertErr) {
        console.error('[events] insert failed', insertErr, record);
        alert(`Could not create event:\n\n${insertErr.message}\n${insertErr.details ?? ''}\n${insertErr.hint ?? ''}`);
        return;
      }
      setShowForm(false);
      setEditing(null);
      if (created) {
        router.push(`/admin/events/${created.id}`);
      } else {
        load();
      }
    }
  }

  async function handleDelete(ev: Event) {
    if (!supabase || !confirm(`Delete "${ev.title}"?`)) return;
    await supabase.from('events').delete().eq('id', ev.id);
    load();
  }

  async function togglePublish(ev: Event) {
    if (!supabase) return;
    const next = ev.status === 'published' ? 'draft' : 'published';
    await supabase.from('events').update({ status: next }).eq('id', ev.id);
    load();
  }

  const now = new Date().toISOString().split('T')[0];
  const upcoming = events.filter((e) => e.event_date >= now);

  // Calendar helpers
  const calendarMonth = new Date();
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const monthName = calendarMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const eventDates = new Set(events.map((e) => e.event_date));

  const canSave = form.title.trim().length > 0 && form.event_date.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-black">Events</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create an event in 30 seconds. Title · Date · Venue · Cover — done.
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-gray-800 transition-colors"
        >
          + Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-gray-200/60 rounded p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Total</p>
          <p className="text-2xl font-bold mt-1 text-black">{loading ? '…' : events.length}</p>
        </div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Upcoming</p>
          <p className="text-2xl font-bold mt-1 text-green-700">{upcoming.length}</p>
        </div>
        <div className="border border-blue-500/30 bg-blue-500/5 rounded p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Published</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{events.filter((e) => e.status === 'published').length}</p>
        </div>
        <div className="border border-gray-200/60 rounded p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">Drafts</p>
          <p className="text-2xl font-bold mt-1 text-black">{events.filter((e) => e.status === 'draft').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(['list', 'calendar'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] uppercase tracking-wider px-4 py-2 rounded transition-colors ${
              activeTab === tab ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'
            }`}
          >
            {tab === 'list' ? 'All Events' : 'Calendar'}
          </button>
        ))}
      </div>

      {/* TAB: List */}
      {activeTab === 'list' && (
        <div className="border border-gray-200/60 rounded">
          <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-gray-500 rounded-t">
            <span className="col-span-4">Event</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-2">Venue</span>
            <span className="col-span-1">Type</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-2">Actions</span>
          </div>
          {events.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500/70 text-sm">
              {loading ? 'Loading…' : 'No events yet — click "Create Event" to add your first.'}
            </div>
          ) : (
            events.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-gray-200/30 items-center text-sm hover:bg-gray-100/20 transition-colors"
              >
                <span className="col-span-4 flex items-center gap-2">
                  {e.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.cover_image_url} alt="" className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded" />
                  )}
                  <span
                    className="text-black font-medium cursor-pointer hover:underline"
                    onClick={() => openEdit(e)}
                  >
                    {e.title}
                  </span>
                </span>
                <span className="col-span-2 text-gray-500 text-xs">{e.event_date?.split('T')[0]}</span>
                <span className="col-span-2 text-gray-500 text-xs truncate">{e.venue || 'TBC'}</span>
                <span className="col-span-1 text-[10px] text-gray-500 capitalize">{e.event_type}</span>
                <span className="col-span-1">
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded ${
                      statusColors[e.status] || 'text-gray-500 border-gray-200'
                    }`}
                  >
                    {e.status?.replace('_', ' ')}
                  </span>
                </span>
                <span className="col-span-2 flex gap-1">
                  <button
                    onClick={() => togglePublish(e)}
                    className={`text-[9px] uppercase tracking-wider px-2 py-1 border rounded transition-colors ${
                      e.status === 'published'
                        ? 'border-amber-500/30 text-amber-700 hover:bg-amber-50'
                        : 'border-green-500/30 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {e.status === 'published' ? 'Unpub' : 'Pub'}
                  </button>
                  <Link
                    href={`/admin/events/${e.id}`}
                    className="text-[9px] uppercase tracking-wider px-2 py-1 border border-gray-200 text-gray-500 rounded hover:bg-gray-50 transition-colors"
                  >
                    Adv
                  </Link>
                  <button
                    onClick={() => handleDelete(e)}
                    className="text-[9px] uppercase tracking-wider px-2 py-1 border border-red-500/20 text-red-500 rounded hover:bg-red-50 transition-colors"
                  >
                    Del
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: Calendar */}
      {activeTab === 'calendar' && (
        <div className="border border-gray-200/60 rounded p-6">
          <h3 className="text-sm font-semibold text-black mb-4">{monthName}</h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-[9px] uppercase tracking-wider text-gray-400 py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(
                2,
                '0',
              )}-${String(day).padStart(2, '0')}`;
              const hasEvent = eventDates.has(dateStr);
              const isToday = dateStr === now;
              return (
                <div
                  key={day}
                  className={`py-2 text-sm rounded relative ${
                    isToday ? 'bg-black text-white font-bold' : hasEvent ? 'bg-black/10 font-medium' : 'text-gray-600'
                  }`}
                >
                  {day}
                  {hasEvent && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 space-y-2">
            {upcoming.slice(0, 5).map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-black">{e.title}</p>
                  <p className="text-xs text-gray-500">
                    {e.event_date} &middot; {e.venue || 'TBC'}
                  </p>
                </div>
                <span className="text-[9px] uppercase text-gray-400">{e.event_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ QUICK CREATE / EDIT FORM ═══ */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <h3 className="text-base font-display font-bold text-black">
                  {editing ? 'Edit Event' : 'Create Event'}
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  Fill in the five required fields below. Everything else is optional — open &ldquo;Add more details&rdquo; if you
                  need them.
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* REQUIRED — title */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Book Value Chain Imbizo — KZN"
                    className="w-full border border-gray-200/60 px-3 py-2.5 text-sm rounded focus:outline-none focus:border-black mt-1"
                    autoFocus
                  />
                </div>

                {/* REQUIRED — date + time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                      className="w-full border border-gray-200/60 px-3 py-2.5 text-sm rounded focus:outline-none focus:border-black mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">Time</label>
                    <input
                      type="time"
                      value={form.event_time}
                      onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
                      className="w-full border border-gray-200/60 px-3 py-2.5 text-sm rounded focus:outline-none focus:border-black mt-1"
                    />
                  </div>
                </div>

                {/* REQUIRED (soft) — venue */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">Venue</label>
                  <input
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    placeholder="e.g. Durban ICC, Hall A"
                    className="w-full border border-gray-200/60 px-3 py-2.5 text-sm rounded focus:outline-none focus:border-black mt-1"
                  />
                </div>

                {/* COVER IMAGE — drag-drop */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
                    Cover image
                  </label>
                  <div className="mt-1">
                    <ImageUploader
                      value={form.cover_image_url}
                      onChange={(url) => setForm((f) => ({ ...f, cover_image_url: url }))}
                      folder="events"
                      label="Drop an event cover here"
                      aspectClass="aspect-[16/9]"
                    />
                  </div>
                </div>

                {/* TAGLINE + DESCRIPTION — optional-leaning */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
                    Tagline (short)
                  </label>
                  <input
                    value={form.tagline}
                    onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                    placeholder="One sentence that captures what this event is"
                    className="w-full border border-gray-200/60 px-3 py-2.5 text-sm rounded focus:outline-none focus:border-black mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
                    Description
                  </label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={form.description}
                      onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                      placeholder="Describe the event — who it's for, what it covers, what to expect…"
                      minHeight={200}
                    />
                  </div>
                </div>

                {/* COLLAPSIBLE — Advanced details */}
                <div className="border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMore((s) => !s)}
                    className="w-full text-left text-[11px] uppercase tracking-wider text-gray-500 hover:text-black font-semibold flex items-center justify-between"
                  >
                    <span>Add more details {showMore ? '' : '(optional)'}</span>
                    <span className="text-base">{showMore ? '−' : '+'}</span>
                  </button>

                  {showMore && (
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-gray-500">Type</label>
                          <select
                            value={form.event_type}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                event_type: e.target.value as (typeof EVENT_TYPES)[number],
                              }))
                            }
                            className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded focus:outline-none focus:border-black mt-1"
                          >
                            {EVENT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-gray-500">Format</label>
                          <select
                            value={form.format}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, format: e.target.value as (typeof FORMATS)[number] }))
                            }
                            className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded focus:outline-none focus:border-black mt-1"
                          >
                            {FORMATS.map((fm) => (
                              <option key={fm} value={fm}>
                                {fm}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-gray-500">Status</label>
                          <select
                            value={form.status}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, status: e.target.value as (typeof STATUSES)[number] }))
                            }
                            className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded focus:outline-none focus:border-black mt-1"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-gray-500">End date</label>
                          <input
                            type="date"
                            value={form.end_date}
                            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                            className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded focus:outline-none focus:border-black mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-gray-500">Capacity</label>
                          <input
                            type="number"
                            value={form.capacity}
                            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                            placeholder="e.g. 150"
                            className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded focus:outline-none focus:border-black mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500">Full venue address</label>
                        <input
                          value={form.venue_address}
                          onChange={(e) => setForm((f) => ({ ...f, venue_address: e.target.value }))}
                          placeholder="Street, city, postal code"
                          className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded focus:outline-none focus:border-black mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-gray-500">URL slug</label>
                        <input
                          value={form.slug}
                          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                          placeholder="auto-generated from title"
                          className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded focus:outline-none focus:border-black mt-1 font-mono"
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.registration_required}
                            onChange={(e) => setForm((f) => ({ ...f, registration_required: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-black">Registration required</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.is_dedicated}
                            onChange={(e) => setForm((f) => ({ ...f, is_dedicated: e.target.checked }))}
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-black">
                            Give this event its own page at /events/{form.slug || '[slug]'}
                          </span>
                        </label>
                      </div>

                      {editing && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-[10px] text-gray-500 mb-2">
                            For programme schedule, speakers, sponsors, registrations, campaigns and feedback, use the
                            Advanced manage page:
                          </p>
                          <Link
                            href={`/admin/events/${editing.id}`}
                            className="inline-block text-[10px] uppercase tracking-wider px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                          >
                            Open advanced manage page →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3 border-t border-gray-100 pt-4">
                <div className="flex-1" />
                <button
                  onClick={() => setShowForm(false)}
                  className="border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 px-6 uppercase rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className={`bg-black text-white text-xs font-medium tracking-wider py-2.5 px-6 uppercase rounded transition-colors ${
                    canSave && !saving ? 'hover:bg-gray-800' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
