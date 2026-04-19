'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';

interface Registration {
  id: number;
  name: string; email: string;
  qr_code: string | null;
  waitlisted: boolean;
  checked_in_at: string | null;
  organisation: string | null;
}

export default function EventCheckin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventId = Number(id);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { load(); }, [eventId]);

  async function load() {
    if (!supabase) return;
    const [e, r] = await Promise.all([
      supabase.from('events').select('title').eq('id', eventId).maybeSingle(),
      supabase.from('event_registrations').select('*').eq('event_id', eventId).order('name'),
    ]);
    setEventTitle((e.data as { title: string } | null)?.title || `Event ${eventId}`);
    setRegistrations((r.data || []) as Registration[]);
    setLoading(false);
  }

  async function checkIn(r: Registration, method: 'qr' | 'search' | 'manual') {
    if (!supabase) return;
    if (r.checked_in_at) {
      setFeedback({ ok: false, text: `${r.name} was already checked in at ${formatDateTime(r.checked_in_at)}.` });
      return;
    }
    const now = new Date().toISOString();
    await Promise.all([
      supabase.from('event_registrations').update({ checked_in_at: now }).eq('id', r.id),
      supabase.from('event_checkins').insert({
        event_id: eventId,
        registration_id: r.id,
        method,
        checked_in_at: now,
      }),
    ]);
    setFeedback({ ok: true, text: `✓ Checked in: ${r.name}` });
    load();
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const code = scanInput.trim();
    const match = registrations.find((r) => r.qr_code === code);
    if (match) {
      await checkIn(match, 'qr');
      setScanInput('');
    } else {
      setFeedback({ ok: false, text: `No registration with QR ${code}` });
    }
  }

  const filtered = registrations.filter((r) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle);
  });

  const checkedIn = registrations.filter((r) => r.checked_in_at).length;
  const total = registrations.length;

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <Link href={`/admin/events/${eventId}`} className="text-xs text-gray-500 hover:text-black">← Event admin</Link>

      <div className="mt-4 mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-1">Check-in</p>
        <h1 className="font-display text-2xl font-bold">{eventTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">{checkedIn}/{total} attendees checked in{total > 0 && ` (${Math.round((checkedIn / total) * 100)}%)`}</p>
      </div>

      <form onSubmit={handleScan} className="mb-4 flex gap-2">
        <input
          autoFocus
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          placeholder="Scan QR code or type registration QR…"
          className="flex-1 px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:border-black font-mono"
        />
        <button type="submit" className="bg-black text-white text-xs uppercase tracking-wider px-5 py-3">Check in</button>
      </form>

      {feedback && (
        <div className={`mb-4 p-3 border text-sm ${feedback.ok ? 'border-green-300 bg-green-50 text-green-800' : 'border-red-300 bg-red-50 text-red-700'}`}>
          {feedback.text}
        </div>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search attendee name or email…" className="w-full px-3 py-2 border border-gray-200 text-sm mb-4" />

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Email</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">QR</th><th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th><th className="text-right px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={`border-b border-gray-100 ${r.checked_in_at ? 'bg-green-50/30' : ''}`}>
                <td className="px-4 py-3 font-medium">{r.name}{r.organisation && <div className="text-[10px] text-gray-500">{r.organisation}</div>}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.email}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">{r.qr_code || '—'}</td>
                <td className="px-4 py-3">
                  {r.checked_in_at
                    ? <span className="text-[10px] uppercase bg-green-100 text-green-700 px-2 py-0.5">in {formatDateTime(r.checked_in_at)}</span>
                    : r.waitlisted
                      ? <span className="text-[10px] uppercase bg-amber-100 text-amber-700 px-2 py-0.5">waitlist</span>
                      : <span className="text-[10px] uppercase bg-gray-100 text-gray-600 px-2 py-0.5">not in</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {!r.checked_in_at && (
                    <button onClick={() => checkIn(r, 'manual')} className="text-xs bg-black text-white uppercase tracking-wider px-3 py-1.5 hover:bg-gray-800">Check in</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
