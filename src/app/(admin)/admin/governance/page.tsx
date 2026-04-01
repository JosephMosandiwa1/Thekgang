'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface BoardMember { id: string; name: string; role: string; email: string; active: boolean }
interface Meeting { id: number; meeting_date: string; meeting_type: string; location: string; status: string; quorum_met: boolean }
interface Resolution { id: number; number: string; title: string; passed: boolean; effective_date: string }

export default function GovernancePage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [m, mt, r] = await Promise.all([
      supabase.from('board_members').select('*').eq('active', true).order('name'),
      supabase.from('board_meetings').select('*').order('meeting_date', { ascending: false }).limit(10),
      supabase.from('resolutions').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    setMembers((m.data || []) as BoardMember[]);
    setMeetings((mt.data || []) as Meeting[]);
    setResolutions((r.data || []) as Resolution[]);
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-black">Governance</h1>
        <p className="text-sm text-gray-500 mt-1">Board register, meetings, minutes, resolutions</p>
      </div>

      {/* Board Members */}
      <div className="border border-gray-200/60 rounded p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Board of Directors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-4 bg-gray-100/30 rounded">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-black">
                {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-black">{m.name}</p>
                <p className="text-[10px] text-gray-500">{m.role}</p>
                {m.email && <p className="text-[10px] text-gray-500/70">{m.email}</p>}
              </div>
            </div>
          ))}
          {members.length === 0 && !loading && <p className="text-sm text-gray-500/70 col-span-3 text-center py-4">No board members found — run the migration to seed data</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meetings */}
        <div className="border border-gray-200/60 rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Board Meetings</h2>
            <button className="bg-black text-white text-[10px] font-medium tracking-wider px-4 py-1.5 uppercase rounded hover:bg-black-light transition-colors">+ Schedule</button>
          </div>
          {meetings.length === 0 ? (
            <p className="text-sm text-gray-500/70 text-center py-8">No meetings scheduled yet</p>
          ) : meetings.map(mt => (
            <div key={mt.id} className="flex items-center justify-between py-3 border-b border-gray-200/30 last:border-0">
              <div>
                <p className="text-sm text-black">{mt.meeting_date} &middot; {mt.location || 'TBC'}</p>
                <p className="text-[10px] text-gray-500/70 capitalize">{mt.meeting_type} meeting</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${mt.status === 'completed' ? 'border-green-500/30 text-green-700' : 'border-amber-500/30 text-amber-700'}`}>{mt.status}</span>
            </div>
          ))}
        </div>

        {/* Resolutions */}
        <div className="border border-gray-200/60 rounded p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Resolutions</h2>
          {resolutions.length === 0 ? (
            <p className="text-sm text-gray-500/70 text-center py-8">No resolutions recorded yet</p>
          ) : resolutions.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-200/30 last:border-0">
              <div>
                <p className="text-sm text-black"><span className="font-mono text-black text-xs mr-2">{r.number}</span>{r.title}</p>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${r.passed ? 'border-green-500/30 text-green-700' : 'border-red-500/30 text-red-600'}`}>{r.passed ? 'Passed' : 'Not Passed'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
