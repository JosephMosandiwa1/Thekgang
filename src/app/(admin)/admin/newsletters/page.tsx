'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, slugify } from '@/lib/utils';

interface List { id: number; slug: string; name: string; description: string | null; active: boolean; _count?: number }
interface Campaign {
  id: number; subject: string; status: string; list_id: number | null;
  recipient_count: number; open_count: number; sent_at: string | null; scheduled_at: string | null;
  updated_at: string;
}

export default function AdminNewsletters() {
  const [lists, setLists] = useState<List[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [subscribers, setSubscribers] = useState(0);
  const [verified, setVerified] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    const [l, c, total, ver] = await Promise.all([
      supabase.from('newsletter_lists').select('*').order('name'),
      supabase.from('newsletter_campaigns').select('*').order('updated_at', { ascending: false }),
      supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('unsubscribed', false),
      supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('verified', true).eq('unsubscribed', false),
    ]);
    setLists((l.data || []) as List[]);
    setCampaigns((c.data || []) as Campaign[]);
    setSubscribers(total.count || 0);
    setVerified(ver.count || 0);
    setLoading(false);
  }

  async function newCampaign() {
    if (!supabase) return;
    const { data } = await supabase.from('newsletter_campaigns').insert({
      subject: 'New campaign', html_body: '<p>Your message here</p>', status: 'draft',
    }).select('id').single();
    if (data) window.location.href = `/admin/newsletters/${(data as { id: number }).id}`;
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Newsletters</h1>
          <p className="text-sm text-gray-500 mt-1">Lists, subscribers, campaigns · send via Resend · open tracking · one-click unsubscribe</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/subscribers" className="text-xs uppercase tracking-wider border border-gray-300 px-4 py-2 hover:border-black">Subscribers</Link>
          <button onClick={newCampaign} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2.5">+ New campaign</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Subscribers (active)" value={subscribers} />
        <Stat label="Verified" value={verified} />
        <Stat label="Lists" value={lists.length} />
        <Stat label="Campaigns" value={campaigns.length} />
      </div>

      <section className="mb-10">
        <h2 className="font-display text-lg font-bold mb-4">Lists</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {lists.map((l) => (
            <div key={l.id} className="border border-gray-200 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{l.slug}</p>
              <p className="font-display font-bold">{l.name}</p>
              {l.description && <p className="text-xs text-gray-600 mt-1">{l.description}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold mb-4">Campaigns</h2>
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">List</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Sent</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Opens</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600">Updated</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const listName = lists.find((l) => l.id === c.list_id)?.name || '—';
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3"><Link href={`/admin/newsletters/${c.id}`} className="font-medium hover:underline">{c.subject}</Link></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{listName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                        c.status === 'sent' ? 'bg-green-100 text-green-700'
                          : c.status === 'sending' ? 'bg-amber-100 text-amber-700'
                          : c.status === 'failed' ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{c.recipient_count || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{c.open_count ? `${c.open_count} (${Math.round((c.open_count / c.recipient_count) * 100)}%)` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.updated_at, 'short')}</td>
                  </tr>
                );
              })}
              {campaigns.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No campaigns yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-200 p-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
