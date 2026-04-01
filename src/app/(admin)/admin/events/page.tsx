'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

const statusColors: Record<string, string> = { draft: 'text-muted', published: 'text-blue-600', registration_open: 'text-green-700', full: 'text-amber-700', completed: 'text-ink/60', cancelled: 'text-red-600' };

interface Event { id: number; title: string; event_date: string; venue: string; capacity: number; status: string; registration_required: boolean; _count?: number }

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', venue: '', capacity: '', description: '' });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    setEvents((data || []) as Event[]);
    setLoading(false);
  }
  async function handleAdd() {
    if (!supabase || !form.title || !form.date) return;
    await supabase.from('events').insert({ title: form.title, event_date: form.date, venue: form.venue || null, capacity: parseInt(form.capacity) || null, status: 'draft' });
    setShowAdd(false); setForm({ title: '', date: '', venue: '', capacity: '', description: '' }); load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Events</h1>
          <p className="text-sm text-muted mt-1">Imbizos, workshops, launches — create, publish, manage registrations</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-accent text-white text-[10px] font-medium tracking-wider px-5 py-2.5 uppercase rounded hover:bg-accent-light transition-colors">+ Create Event</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-sand/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-muted">Total Events</p><p className="text-2xl font-bold mt-1 text-ink">{loading ? '...' : events.length}</p></div>
        <div className="border border-green-500/30 bg-green-500/5 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-muted">Upcoming</p><p className="text-2xl font-bold mt-1 text-green-700">{events.filter(e => new Date(e.event_date) >= new Date()).length}</p></div>
        <div className="border border-sand/60 rounded p-4"><p className="text-[10px] uppercase tracking-[0.15em] text-muted">Completed</p><p className="text-2xl font-bold mt-1 text-ink/60">{events.filter(e => e.status === 'completed').length}</p></div>
      </div>

      <div className="border border-sand/60 rounded">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white text-[10px] uppercase tracking-[0.12em] text-muted rounded-t">
          <span className="col-span-4">Event</span><span className="col-span-2">Date</span><span className="col-span-3">Venue</span><span className="col-span-1">Cap.</span><span className="col-span-2">Status</span>
        </div>
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted/50 text-sm">{loading ? 'Loading...' : 'No events yet'}</div>
        ) : events.map(e => (
          <div key={e.id} className="grid grid-cols-12 gap-2 px-6 py-3 border-t border-sand/30 items-center text-sm hover:bg-warm-gray/20 transition-colors">
            <span className="col-span-4 text-ink font-medium">{e.title}</span>
            <span className="col-span-2 text-muted text-xs">{e.event_date}</span>
            <span className="col-span-3 text-muted text-xs">{e.venue || 'TBC'}</span>
            <span className="col-span-1 text-muted text-xs">{e.capacity || '—'}</span>
            <span className={`col-span-2 text-[10px] capitalize ${statusColors[e.status] || 'text-muted'}`}>{e.status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {showAdd && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowAdd(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-sand/60 rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-base font-display font-bold text-ink mb-4">Create Event</h3>
              <div className="space-y-3">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" className="w-full border border-sand/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-accent" />
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-sand/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-accent" />
                <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Venue" className="w-full border border-sand/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-accent" />
                <input value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="Capacity" type="number" className="w-full border border-sand/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-accent" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="flex-1 border border-sand/60 text-muted text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={handleAdd} className="flex-1 bg-accent text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-accent-light">Create</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
