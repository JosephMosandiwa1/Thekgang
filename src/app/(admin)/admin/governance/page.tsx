'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface BoardMember { id: string; name: string; role: string; email: string; phone: string; bio: string; term_start: string; term_end: string; active: boolean }
interface Meeting { id: number; meeting_date: string; meeting_time: string; meeting_type: string; location: string; status: string; quorum_met: boolean; agenda: string }
interface Resolution { id: number; number: string; title: string; description: string; passed: boolean; effective_date: string; meeting_id: number }

const MEETING_TYPES = ['ordinary', 'special', 'agm'];
const MEETING_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

export default function GovernancePage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showResForm, setShowResForm] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [memberForm, setMemberForm] = useState({ name: '', role: '', email: '', phone: '', bio: '', term_start: '', term_end: '' });
  const [meetingForm, setMeetingForm] = useState({ meeting_date: '', meeting_time: '', meeting_type: 'ordinary', location: '', agenda: '', status: 'scheduled' });
  const [resForm, setResForm] = useState({ title: '', description: '', meeting_id: '', passed: true });

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [m, mt, r] = await Promise.all([
      supabase.from('board_members').select('*').order('name'),
      supabase.from('board_meetings').select('*').order('meeting_date', { ascending: false }).limit(20),
      supabase.from('resolutions').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    setMembers((m.data || []) as BoardMember[]);
    setMeetings((mt.data || []) as Meeting[]);
    setResolutions((r.data || []) as Resolution[]);
    setLoading(false);
  }

  // Board Members CRUD
  function openNewMember() { setEditingMember(null); setMemberForm({ name: '', role: '', email: '', phone: '', bio: '', term_start: '', term_end: '' }); setShowMemberForm(true); }
  function openEditMember(m: BoardMember) { setEditingMember(m); setMemberForm({ name: m.name, role: m.role || '', email: m.email || '', phone: m.phone || '', bio: m.bio || '', term_start: m.term_start?.split('T')[0] || '', term_end: m.term_end?.split('T')[0] || '' }); setShowMemberForm(true); }
  async function saveMember() {
    if (!supabase || !memberForm.name) return;
    const record = { name: memberForm.name, role: memberForm.role || null, email: memberForm.email || null, phone: memberForm.phone || null, bio: memberForm.bio || null, term_start: memberForm.term_start || null, term_end: memberForm.term_end || null, active: true };
    if (editingMember) { await supabase.from('board_members').update(record).eq('id', editingMember.id); }
    else { await supabase.from('board_members').insert(record); }
    setShowMemberForm(false); load();
  }
  async function toggleMemberActive(m: BoardMember) { if (!supabase) return; await supabase.from('board_members').update({ active: !m.active }).eq('id', m.id); load(); }

  // Meetings CRUD
  function openNewMeeting() { setEditingMeeting(null); setMeetingForm({ meeting_date: '', meeting_time: '', meeting_type: 'ordinary', location: '', agenda: '', status: 'scheduled' }); setShowMeetingForm(true); }
  function openEditMeeting(mt: Meeting) { setEditingMeeting(mt); setMeetingForm({ meeting_date: mt.meeting_date?.split('T')[0] || '', meeting_time: mt.meeting_time?.slice(0, 5) || '', meeting_type: mt.meeting_type, location: mt.location || '', agenda: mt.agenda || '', status: mt.status }); setShowMeetingForm(true); }
  async function saveMeeting() {
    if (!supabase || !meetingForm.meeting_date) return;
    const record = { meeting_date: meetingForm.meeting_date, meeting_time: meetingForm.meeting_time || null, meeting_type: meetingForm.meeting_type, location: meetingForm.location || null, agenda: meetingForm.agenda || null, status: meetingForm.status };
    if (editingMeeting) { await supabase.from('board_meetings').update(record).eq('id', editingMeeting.id); }
    else { await supabase.from('board_meetings').insert(record); }
    setShowMeetingForm(false); load();
  }
  async function deleteMeeting(mt: Meeting) { if (!supabase || !confirm('Delete this meeting?')) return; await supabase.from('board_meetings').delete().eq('id', mt.id); load(); }

  // Resolutions CRUD
  async function saveResolution() {
    if (!supabase || !resForm.title) return;
    await supabase.from('resolutions').insert({ title: resForm.title, description: resForm.description || null, meeting_id: parseInt(resForm.meeting_id) || null, passed: resForm.passed });
    setShowResForm(false); setResForm({ title: '', description: '', meeting_id: '', passed: true }); load();
  }

  const activeMembers = members.filter(m => m.active);
  const inactiveMembers = members.filter(m => !m.active);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-black">Governance</h1>
        <p className="text-sm text-gray-500 mt-1">Board register, meetings, minutes, resolutions</p>
      </div>

      {/* Board Members */}
      <div className="border border-gray-200/60 rounded p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Board of Directors ({activeMembers.length} active)</h2>
          <button onClick={openNewMember} className="bg-black text-white text-[10px] font-medium tracking-wider px-4 py-1.5 uppercase rounded hover:bg-gray-800">+ Add Member</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activeMembers.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-4 bg-gray-100/30 rounded cursor-pointer hover:bg-gray-100/60 transition-colors" onClick={() => openEditMember(m)}>
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-semibold text-charcoal">
                {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-black">{m.name}</p>
                <p className="text-[10px] text-gray-500">{m.role}</p>
              </div>
            </div>
          ))}
          {activeMembers.length === 0 && !loading && <p className="text-sm text-gray-400 col-span-3 text-center py-4">No board members — add your first</p>}
        </div>
        {inactiveMembers.length > 0 && <p className="text-[10px] text-gray-400 mt-4">{inactiveMembers.length} inactive member(s)</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meetings */}
        <div className="border border-gray-200/60 rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Board Meetings</h2>
            <button onClick={openNewMeeting} className="bg-black text-white text-[10px] font-medium tracking-wider px-4 py-1.5 uppercase rounded hover:bg-gray-800">+ Schedule</button>
          </div>
          {meetings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No meetings scheduled yet</p>
          ) : meetings.map(mt => (
            <div key={mt.id} className="flex items-center justify-between py-3 border-b border-gray-200/30 last:border-0 cursor-pointer hover:bg-gray-50/50 -mx-2 px-2 rounded transition-colors" onClick={() => openEditMeeting(mt)}>
              <div>
                <p className="text-sm text-black">{mt.meeting_date} {mt.meeting_time ? `at ${mt.meeting_time.slice(0, 5)}` : ''} &middot; {mt.location || 'TBC'}</p>
                <p className="text-[10px] text-gray-500 capitalize">{mt.meeting_type} meeting</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${mt.status === 'completed' ? 'border-green-500/30 text-green-700' : mt.status === 'cancelled' ? 'border-red-500/30 text-red-600' : 'border-amber-500/30 text-amber-700'}`}>{mt.status}</span>
                <button onClick={e => { e.stopPropagation(); deleteMeeting(mt); }} className="text-[9px] text-red-400 hover:text-red-600">×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Resolutions */}
        <div className="border border-gray-200/60 rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Resolutions</h2>
            <button onClick={() => setShowResForm(true)} className="bg-black text-white text-[10px] font-medium tracking-wider px-4 py-1.5 uppercase rounded hover:bg-gray-800">+ Record</button>
          </div>
          {resolutions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No resolutions recorded yet</p>
          ) : resolutions.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-200/30 last:border-0">
              <div>
                <p className="text-sm text-black"><span className="font-mono text-xs mr-2">{r.number}</span>{r.title}</p>
                {r.description && <p className="text-[10px] text-gray-500 mt-0.5">{r.description}</p>}
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${r.passed ? 'border-green-500/30 text-green-700' : 'border-red-500/30 text-red-600'}`}>{r.passed ? 'Passed' : 'Not Passed'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Board Member Form */}
      {showMemberForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowMemberForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">{editingMember ? 'Edit Board Member' : 'Add Board Member'}</h3>
              <div className="space-y-3">
                <input value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <input value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))} placeholder="Role (e.g., Chairperson, Treasurer)" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={memberForm.email} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input value={memberForm.phone} onChange={e => setMemberForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={memberForm.term_start} onChange={e => setMemberForm(f => ({ ...f, term_start: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input type="date" value={memberForm.term_end} onChange={e => setMemberForm(f => ({ ...f, term_end: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <textarea value={memberForm.bio} onChange={e => setMemberForm(f => ({ ...f, bio: e.target.value }))} placeholder="Bio" rows={3} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
              </div>
              <div className="flex gap-3 mt-6">
                {editingMember && <button onClick={() => { toggleMemberActive(editingMember); setShowMemberForm(false); }} className="border border-amber-500/30 text-amber-700 text-xs font-medium tracking-wider py-2.5 px-4 uppercase rounded">{editingMember.active ? 'Deactivate' : 'Reactivate'}</button>}
                <div className="flex-1" />
                <button onClick={() => setShowMemberForm(false)} className="border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 px-6 uppercase rounded">Cancel</button>
                <button onClick={saveMember} className="bg-black text-white text-xs font-medium tracking-wider py-2.5 px-6 uppercase rounded hover:bg-gray-800">Save</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Meeting Form */}
      {showMeetingForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowMeetingForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">{editingMeeting ? 'Edit Meeting' : 'Schedule Meeting'}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={meetingForm.meeting_date} onChange={e => setMeetingForm(f => ({ ...f, meeting_date: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                  <input type="time" value={meetingForm.meeting_time} onChange={e => setMeetingForm(f => ({ ...f, meeting_time: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={meetingForm.meeting_type} onChange={e => setMeetingForm(f => ({ ...f, meeting_type: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    {MEETING_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                  <select value={meetingForm.status} onChange={e => setMeetingForm(f => ({ ...f, status: e.target.value }))} className="border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                    {MEETING_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <input value={meetingForm.location} onChange={e => setMeetingForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <textarea value={meetingForm.agenda} onChange={e => setMeetingForm(f => ({ ...f, agenda: e.target.value }))} placeholder="Agenda items" rows={4} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowMeetingForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={saveMeeting} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Save</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Resolution Form */}
      {showResForm && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowResForm(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6">
            <div className="bg-white border border-gray-200/60 rounded-lg shadow-xl w-full max-w-lg p-6">
              <h3 className="text-base font-display font-bold text-black mb-4">Record Resolution</h3>
              <div className="space-y-3">
                <input value={resForm.title} onChange={e => setResForm(f => ({ ...f, title: e.target.value }))} placeholder="Resolution title *" className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black" />
                <textarea value={resForm.description} onChange={e => setResForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y" />
                <select value={resForm.meeting_id} onChange={e => setResForm(f => ({ ...f, meeting_id: e.target.value }))} className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black">
                  <option value="">Link to meeting (optional)</option>
                  {meetings.map(mt => <option key={mt.id} value={mt.id}>{mt.meeting_date} — {mt.meeting_type}</option>)}
                </select>
                <label className="flex items-center gap-3"><input type="checkbox" checked={resForm.passed} onChange={e => setResForm(f => ({ ...f, passed: e.target.checked }))} className="w-4 h-4" /><span className="text-sm text-black">Resolution passed</span></label>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowResForm(false)} className="flex-1 border border-gray-200/60 text-gray-500 text-xs font-medium tracking-wider py-2.5 uppercase rounded">Cancel</button>
                <button onClick={saveResolution} className="flex-1 bg-black text-white text-xs font-medium tracking-wider py-2.5 uppercase rounded hover:bg-gray-800">Record</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
