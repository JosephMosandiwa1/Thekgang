'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, supabaseErrorMessage } from '@/lib/utils';

interface Group { id: number; slug: string; discipline: string; name: string; description: string | null; meeting_cadence: string | null }
interface Post {
  id: number;
  kind: string;
  title: string | null;
  body: string | null;
  pinned: boolean;
  created_at: string;
  author_member_id: number | null;
  members?: { full_name: string } | null;
}
interface Vote {
  id: number;
  title: string;
  motion: string;
  options: string[];
  opens_at: string;
  closes_at: string | null;
  status: string;
  result_summary: Record<string, number> | null;
}

export default function WorkingGroupDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', body: '', kind: 'discussion' });
  const [ballots, setBallots] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, [slug]);

  async function load() {
    if (!supabase) return;
    const { data: g } = await supabase.from('working_groups').select('*').eq('slug', slug).maybeSingle();
    if (!g) { setLoading(false); return; }
    setGroup(g as Group);

    const { count } = await supabase
      .from('working_group_members').select('*', { count: 'exact', head: true })
      .eq('working_group_id', (g as Group).id).is('left_at', null);
    setMemberCount(count || 0);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: m } = await supabase.from('members').select('id').eq('auth_user_id', user.id).maybeSingle();
      if (m) {
        const mem = m as { id: number };
        setMemberId(mem.id);
        const { data: mship } = await supabase
          .from('working_group_members').select('id')
          .eq('working_group_id', (g as Group).id).eq('member_id', mem.id).is('left_at', null).maybeSingle();
        setIsMember(Boolean(mship));

        const { data: myBallots } = await supabase.from('working_group_ballots').select('vote_id, choice').eq('member_id', mem.id);
        const map: Record<number, string> = {};
        (myBallots || []).forEach((b: { vote_id: number; choice: string }) => { map[b.vote_id] = b.choice; });
        setBallots(map);
      }
    }

    const { data: p } = await supabase
      .from('working_group_posts')
      .select('id, kind, title, body, pinned, created_at, author_member_id, members(full_name)')
      .eq('working_group_id', (g as Group).id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);
    setPosts(((p || []) as unknown) as Post[]);

    const { data: v } = await supabase
      .from('working_group_votes').select('*')
      .eq('working_group_id', (g as Group).id).eq('status', 'open')
      .order('opens_at', { ascending: false });
    setVotes(((v || []) as unknown) as Vote[]);

    setLoading(false);
  }

  async function addPost() {
    if (!supabase || !group || !memberId) return;
    setMessage(null);
    const { error } = await supabase.from('working_group_posts').insert({
      working_group_id: group.id,
      author_member_id: memberId,
      kind: newPost.kind,
      title: newPost.title || null,
      body: newPost.body,
    });
    if (error) setMessage(supabaseErrorMessage(error));
    else { setShowNewPost(false); setNewPost({ title: '', body: '', kind: 'discussion' }); load(); }
  }

  async function castBallot(voteId: number, choice: string) {
    if (!supabase || !memberId) return;
    await supabase.from('working_group_ballots').upsert({
      vote_id: voteId, member_id: memberId, choice,
    }, { onConflict: 'vote_id,member_id' });
    setBallots({ ...ballots, [voteId]: choice });
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!group) return (
    <div>
      <p>Working group not found.</p>
      <Link href="/portal/working-groups" className="text-sm underline">← All working groups</Link>
    </div>
  );

  return (
    <div>
      <Link href="/portal/working-groups" className="text-xs text-gray-500 hover:text-black">← All working groups</Link>
      <div className="flex items-start justify-between flex-wrap gap-4 mt-4 mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">{group.discipline}</p>
          <h1 className="font-display text-3xl font-bold">{group.name}</h1>
          {group.description && <p className="text-gray-600 mt-2 max-w-2xl text-sm">{group.description}</p>}
          <p className="text-xs text-gray-500 mt-3">
            {memberCount} active {memberCount === 1 ? 'member' : 'members'} · Meets {group.meeting_cadence}
            {isMember && <span className="ml-3 uppercase tracking-wider text-[10px] bg-green-100 text-green-700 px-2 py-0.5">You&apos;re in</span>}
          </p>
        </div>
        {isMember && (
          <button onClick={() => setShowNewPost(!showNewPost)} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5 hover:bg-gray-800">
            {showNewPost ? 'Cancel' : '+ New post'}
          </button>
        )}
      </div>

      {showNewPost && (
        <div className="border border-gray-200 p-5 mb-8 bg-gray-50">
          <div className="grid md:grid-cols-2 gap-4 mb-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Kind</span>
              <select value={newPost.kind} onChange={(e) => setNewPost({ ...newPost, kind: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm">
                <option value="discussion">Discussion</option>
                <option value="announcement">Announcement</option>
                <option value="decision">Decision</option>
                <option value="meeting_minutes">Meeting minutes</option>
                <option value="resource">Resource</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Title (optional)</span>
              <input value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Message *</span>
            <textarea rows={5} value={newPost.body} onChange={(e) => setNewPost({ ...newPost, body: e.target.value })} className="w-full px-3 py-2 border border-gray-200 bg-white text-sm" />
          </label>
          {message && <div className="mt-3 p-3 bg-red-50 border border-red-200 text-sm text-red-700">{message}</div>}
          <button onClick={addPost} disabled={!newPost.body} className="mt-3 bg-black text-white text-xs uppercase tracking-wider px-5 py-2 hover:bg-gray-800 disabled:opacity-50">
            Post
          </button>
        </div>
      )}

      {votes.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold mb-4">Open votes</h2>
          <div className="space-y-4">
            {votes.map((v) => (
              <div key={v.id} className="border border-gray-200 p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">Vote · closes {v.closes_at ? formatDate(v.closes_at, 'short') : 'open'}</p>
                <h3 className="font-display text-lg font-bold mb-2">{v.title}</h3>
                <p className="text-sm text-gray-700 mb-4">{v.motion}</p>
                <div className="flex gap-2 flex-wrap">
                  {v.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => isMember && castBallot(v.id, opt)}
                      disabled={!isMember}
                      className={`text-xs uppercase tracking-wider px-4 py-2 border transition-colors ${
                        ballots[v.id] === opt
                          ? 'bg-black text-white border-black'
                          : 'border-gray-300 hover:border-black disabled:opacity-50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {!isMember && <p className="text-xs text-gray-500 mt-3">Join this working group to vote.</p>}
                {ballots[v.id] && <p className="text-xs text-green-700 mt-3">Your vote: {ballots[v.id]}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-xl font-bold mb-4">Recent posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">No posts yet. {isMember ? 'Start the conversation.' : 'Join the group to contribute.'}</p>
        ) : (
          <div className="space-y-4">
            {posts.map((p) => (
              <div key={p.id} className={`border ${p.pinned ? 'border-gold' : 'border-gray-200'} p-5`}>
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60 mb-1">
                  {p.kind}{p.pinned && ' · pinned'} · {p.members?.full_name || 'Council'} · {formatDate(p.created_at, 'short')}
                </p>
                {p.title && <h3 className="font-display text-lg font-bold mb-2">{p.title}</h3>}
                {p.body && <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.body}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
