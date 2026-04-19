'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime, formatRelative } from '@/lib/utils';

interface Thread { id: number; member_a_id: number; member_b_id: number; subject: string | null; last_message_at: string }
interface Msg { id: number; thread_id: number; from_member_id: number; to_member_id: number; body: string; read_at: string | null; created_at: string }
interface Recipient { id: number; full_name: string; member_number: string | null; disciplines: string[] }

export default function PortalMessages() {
  const [memberId, setMemberId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [members, setMembers] = useState<Record<number, Recipient>>({});
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from('members').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (!m) { setLoading(false); return; }
    const id = (m as { id: number }).id;
    setMemberId(id);

    const { data: ts } = await supabase.from('member_message_threads').select('*')
      .or(`member_a_id.eq.${id},member_b_id.eq.${id}`)
      .order('last_message_at', { ascending: false });
    const threadRows = ((ts || []) as unknown) as Thread[];
    setThreads(threadRows);

    // Fetch all other members in any thread for name display
    const otherIds = Array.from(new Set(threadRows.flatMap((t) => [t.member_a_id, t.member_b_id]).filter((x) => x !== id)));
    if (otherIds.length > 0) {
      const { data: mems } = await supabase.from('members').select('id, full_name, member_number, disciplines').in('id', otherIds);
      const map: Record<number, Recipient> = {};
      (mems || []).forEach((mm) => { map[(mm as Recipient).id] = mm as Recipient; });
      setMembers(map);
    }

    setLoading(false);
  }

  async function selectThread(t: Thread) {
    setActiveThread(t);
    if (!supabase) return;
    const { data } = await supabase.from('member_messages').select('*').eq('thread_id', t.id).order('created_at');
    setMessages(((data || []) as unknown) as Msg[]);
    // Mark all incoming as read
    await supabase.from('member_messages').update({ read_at: new Date().toISOString() })
      .eq('thread_id', t.id).eq('to_member_id', memberId).is('read_at', null);
    setTimeout(() => bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight), 50);
  }

  async function sendMessage() {
    if (!supabase || !activeThread || !memberId || !draft.trim()) return;
    const toId = activeThread.member_a_id === memberId ? activeThread.member_b_id : activeThread.member_a_id;
    const { error } = await supabase.from('member_messages').insert({
      thread_id: activeThread.id,
      from_member_id: memberId,
      to_member_id: toId,
      body: draft,
    });
    if (!error) {
      await supabase.from('member_message_threads').update({ last_message_at: new Date().toISOString() }).eq('id', activeThread.id);
      setDraft('');
      selectThread(activeThread);
      load();
    }
  }

  async function searchRecipients(q: string) {
    setSearchQ(q);
    if (!supabase || q.trim().length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from('members').select('id, full_name, member_number, disciplines')
      .ilike('full_name', `%${q}%`).eq('status', 'active').eq('consent_directory', true).neq('id', memberId).limit(10);
    setSearchResults(((data || []) as unknown) as Recipient[]);
  }

  async function startThread(other: Recipient) {
    if (!supabase || !memberId) return;
    const a = Math.min(memberId, other.id);
    const b = Math.max(memberId, other.id);
    const { data: existing } = await supabase.from('member_message_threads').select('*')
      .eq('member_a_id', a).eq('member_b_id', b).maybeSingle();
    if (existing) {
      setComposeOpen(false);
      selectThread(existing as Thread);
      return;
    }
    const { data: inserted } = await supabase.from('member_message_threads').insert({
      member_a_id: a, member_b_id: b,
    }).select('*').single();
    if (inserted) {
      setComposeOpen(false);
      setThreads([inserted as Thread, ...threads]);
      selectThread(inserted as Thread);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Messages</p>
          <h1 className="font-display text-3xl font-bold">Direct messages</h1>
        </div>
        <button onClick={() => setComposeOpen(true)} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ New message</button>
      </div>

      <div className="grid md:grid-cols-3 gap-0 border border-gray-200 min-h-[500px]">
        {/* Thread list */}
        <div className="border-r border-gray-200 md:col-span-1 overflow-y-auto">
          {threads.length === 0 ? <p className="p-4 text-sm text-gray-500">No messages yet. Start a new conversation.</p> : (
            threads.map((t) => {
              const otherId = t.member_a_id === memberId ? t.member_b_id : t.member_a_id;
              const other = members[otherId];
              return (
                <button key={t.id} onClick={() => selectThread(t)} className={`w-full text-left p-3 border-b border-gray-100 ${activeThread?.id === t.id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <p className="font-medium text-sm">{other?.full_name || `member #${otherId}`}</p>
                  {other?.member_number && <p className="text-[10px] text-gray-500 font-mono">{other.member_number}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{formatRelative(t.last_message_at)}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Conversation */}
        <div className="md:col-span-2 flex flex-col">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Select a thread or start a new conversation.</div>
          ) : (
            <>
              <div ref={bodyRef} className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[500px]">
                {messages.map((m) => {
                  const isMe = m.from_member_id === memberId;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 text-sm ${isMe ? 'bg-black text-white' : 'bg-gray-100'}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-500'}`}>{formatDateTime(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-200 p-3 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 border border-gray-200 text-sm"
                />
                <button onClick={sendMessage} disabled={!draft.trim()} className="bg-black text-white text-xs uppercase tracking-wider px-4 py-2 disabled:opacity-50">Send</button>
              </div>
            </>
          )}
        </div>
      </div>

      {composeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setComposeOpen(false)}>
          <div className="bg-white max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">New message</h3>
            <input
              value={searchQ}
              onChange={(e) => searchRecipients(e.target.value)}
              placeholder="Search a member by name…"
              className="w-full px-3 py-2 border border-gray-200 text-sm mb-3"
              autoFocus
            />
            <div className="max-h-[260px] overflow-y-auto">
              {searchResults.map((r) => (
                <button key={r.id} onClick={() => startThread(r)} className="w-full text-left p-3 border border-gray-100 hover:bg-gray-50 mb-1">
                  <p className="font-medium text-sm">{r.full_name}</p>
                  {r.member_number && <p className="text-[10px] text-gray-500 font-mono">{r.member_number}</p>}
                  {r.disciplines.length > 0 && <p className="text-[10px] text-gray-500 mt-1">{r.disciplines.slice(0, 3).join(' · ')}</p>}
                </button>
              ))}
              {searchQ.length >= 2 && searchResults.length === 0 && <p className="text-sm text-gray-500 p-3">No members match. Only directory-opted-in members are searchable.</p>}
            </div>
            <button onClick={() => setComposeOpen(false)} className="text-xs text-gray-500 mt-4">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
