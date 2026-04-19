'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Resource {
  id: number;
  title: string;
  description: string | null;
  resource_type: string | null;
  category: string | null;
  discipline_tags: string[];
  tier_required: string;
  file_url: string | null;
  external_url: string | null;
  download_count: number;
}

const TIER_ORDER: Record<string, number> = { affiliate: 0, active: 1, patron: 2 };

export default function PortalResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [memberTier, setMemberTier] = useState<string>('affiliate');
  const [memberId, setMemberId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: m } = await supabase.from('members').select('id, tier_id').eq('auth_user_id', user.id).maybeSingle();
      if (m) {
        setMemberId((m as { id: number }).id);
        if ((m as { tier_id: number | null }).tier_id) {
          const { data: t } = await supabase.from('member_tiers').select('slug').eq('id', (m as { tier_id: number }).tier_id).maybeSingle();
          setMemberTier((t as { slug: string } | null)?.slug || 'affiliate');
        }
      }

      const { data } = await supabase.from('member_resources').select('*').eq('published', true).order('created_at', { ascending: false });
      setResources(((data || []) as unknown) as Resource[]);
      setLoading(false);
    })();
  }, []);

  const currentRank = TIER_ORDER[memberTier] ?? 0;

  async function logDownload(r: Resource) {
    if (!supabase || !memberId) return;
    await supabase.from('member_resource_downloads').insert({ member_id: memberId, resource_id: r.id });
  }

  const filtered = resources.filter((r) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      r.title.toLowerCase().includes(needle) ||
      (r.description?.toLowerCase().includes(needle) ?? false) ||
      (r.category?.toLowerCase().includes(needle) ?? false) ||
      r.discipline_tags.some((t) => t.toLowerCase().includes(needle))
    );
  });

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Resource library</p>
      <h1 className="font-display text-3xl font-bold mb-2">Resources</h1>
      <p className="text-gray-600 mb-6 max-w-2xl text-sm">
        Templates, guides, research, and sector intelligence. All resources are free to download.
      </p>

      <input
        type="search"
        placeholder="Search resources…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full md:max-w-md px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black mb-6"
      />

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">{q ? 'No resources match your search.' : 'No resources available yet.'}</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((r) => {
            const locked = (TIER_ORDER[r.tier_required] ?? 0) > currentRank;
            const primaryLink = r.external_url || r.file_url;
            return (
              <div key={r.id} className={`border p-5 ${locked ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {r.resource_type && <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{r.resource_type}</span>}
                  {r.category && <span className="text-[10px] text-gray-500/60">· {r.category}</span>}
                  {locked && <span className="ml-auto text-[10px] uppercase bg-gray-100 text-gray-500 px-2 py-0.5">{r.tier_required}</span>}
                </div>
                <h3 className="font-medium mb-1">{r.title}</h3>
                {r.description && <p className="text-sm text-gray-600 mb-3">{r.description}</p>}
                {r.discipline_tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mb-3">
                    {r.discipline_tags.map((t) => (
                      <span key={t} className="text-[10px] text-gray-500 border border-gray-200 px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
                {primaryLink && !locked && (
                  <a
                    href={primaryLink}
                    target="_blank"
                    rel="noopener"
                    download={r.file_url ? true : undefined}
                    onClick={() => logDownload(r)}
                    className="text-xs uppercase tracking-wider underline hover:no-underline"
                  >
                    {r.file_url ? 'Download' : 'Open'} →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
