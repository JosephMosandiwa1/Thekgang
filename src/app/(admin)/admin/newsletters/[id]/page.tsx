'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { formatDate, supabaseErrorMessage } from '@/lib/utils';

interface Campaign {
  id: number; subject: string; preheader: string | null; html_body: string; text_body: string | null;
  from_name: string | null; from_email: string | null;
  list_id: number | null; status: string;
  recipient_count: number; open_count: number;
  scheduled_at: string | null; sent_at: string | null;
}
interface List { id: number; name: string; slug: string }

export default function CampaignEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const campaignId = Number(id);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, [campaignId]);

  async function load() {
    if (!supabase) return;
    const [c, l] = await Promise.all([
      supabase.from('newsletter_campaigns').select('*').eq('id', campaignId).maybeSingle(),
      supabase.from('newsletter_lists').select('id, name, slug').order('name'),
    ]);
    setCampaign((c.data as Campaign) || null);
    setLists((l.data || []) as List[]);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !campaign) return;
    setSaving(true); setMessage(null);
    const { error } = await supabase.from('newsletter_campaigns').update({
      subject: campaign.subject,
      preheader: campaign.preheader,
      html_body: campaign.html_body,
      text_body: campaign.text_body,
      from_name: campaign.from_name,
      from_email: campaign.from_email,
      list_id: campaign.list_id,
      scheduled_at: campaign.scheduled_at,
    }).eq('id', campaignId);
    if (error) setMessage(supabaseErrorMessage(error));
    else setMessage('Saved.');
    setSaving(false);
  }

  async function sendNow() {
    if (!campaign) return;
    if (!window.confirm(`Send "${campaign.subject}" to all verified subscribers on this list?`)) return;
    setSending(true); setMessage(null);
    await save();
    const res = await fetch('/api/newsletter/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: campaignId }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error || 'Send failed');
    else setMessage(`Sent to ${data.sent} recipients${data.failed ? ` (${data.failed} failed)` : ''}.`);
    setSending(false);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!campaign) return (
    <div>
      <p>Campaign not found.</p>
      <Link href="/admin/newsletters" className="text-sm underline">← Back</Link>
    </div>
  );

  const isSent = campaign.status === 'sent' || campaign.status === 'sending';

  return (
    <div>
      <Link href="/admin/newsletters" className="text-xs text-gray-500 hover:text-black">← Newsletters</Link>

      <div className="flex items-start justify-between mt-4 mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500/60 mb-1">Campaign</p>
          <h1 className="font-display text-2xl font-bold">{campaign.subject}</h1>
          <p className="text-xs text-gray-500 mt-1">
            Status: {campaign.status}{campaign.sent_at && ` · sent ${formatDate(campaign.sent_at, 'long')}`}
            {campaign.recipient_count > 0 && ` · ${campaign.open_count}/${campaign.recipient_count} opens`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="text-xs uppercase tracking-wider border border-gray-300 px-4 py-2 hover:border-black disabled:opacity-50">
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          {!isSent && (
            <button onClick={sendNow} disabled={sending} className="bg-black text-white text-xs uppercase tracking-wider px-5 py-2 hover:bg-gray-800 disabled:opacity-50">
              {sending ? 'Sending…' : 'Send now'}
            </button>
          )}
        </div>
      </div>

      {message && <div className="mb-6 p-3 bg-gray-50 border border-gray-200 text-sm">{message}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Subject line *</span>
            <input value={campaign.subject} onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Preheader</span>
            <input value={campaign.preheader || ''} onChange={(e) => setCampaign({ ...campaign, preheader: e.target.value })} placeholder="Short preview text shown after the subject in most inbox UIs" className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">From name</span>
              <input value={campaign.from_name || ''} onChange={(e) => setCampaign({ ...campaign, from_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">From email</span>
              <input value={campaign.from_email || ''} onChange={(e) => setCampaign({ ...campaign, from_email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Send to list</span>
            <select value={campaign.list_id ?? ''} onChange={(e) => setCampaign({ ...campaign, list_id: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 border border-gray-200 text-sm">
              <option value="">All verified subscribers</option>
              {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">HTML body *</span>
            <textarea rows={14} value={campaign.html_body} onChange={(e) => setCampaign({ ...campaign, html_body: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm font-mono focus:outline-none focus:border-black" />
            <span className="text-[10px] text-gray-500">Unsubscribe link + open-tracking pixel injected automatically.</span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Plain-text fallback</span>
            <textarea rows={6} value={campaign.text_body || ''} onChange={(e) => setCampaign({ ...campaign, text_body: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black" />
          </label>
        </div>
        <div className="sticky top-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">Preview</p>
          <div className="border border-gray-200 bg-white p-4 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-gray-500 mb-3"><strong>From:</strong> {campaign.from_name} &lt;{campaign.from_email}&gt;</p>
            <p className="text-sm font-semibold mb-1">{campaign.subject}</p>
            {campaign.preheader && <p className="text-xs text-gray-500 mb-4">{campaign.preheader}</p>}
            <div className="border-t border-gray-200 pt-4" dangerouslySetInnerHTML={{ __html: campaign.html_body }} />
          </div>
        </div>
      </div>
    </div>
  );
}
