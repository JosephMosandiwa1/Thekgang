'use client';

/**
 * /admin/press/library — Assets + Packs + Templates + Press kit.
 *
 * Five tabs along the top:
 *  · CI baseline · Campaign packs · Press kit · Templates · All assets
 *
 * Upload goes to the /api/press/assets endpoint (existing supabase
 * storage bucket). Rights filter per Asset; ZIP download per Pack.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Tab = 'ci' | 'campaign_packs' | 'press_kit' | 'templates' | 'all_assets';

type Pack = {
  id: string; slug: string; scope: string; label_en: string;
  description_en: string | null; rights: string; cover_asset_id: string | null;
  campaign_id: string | null;
};
type Asset = {
  id: string; slug: string | null; kind: string; filename: string; url: string;
  mime_type: string | null; alt_en: string | null; rights: string;
  download_count: number; created_at: string;
};
type Template = { id: string; slug: string; name_en: string; category: string; updated_at: string };

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'ci',             label: 'CI baseline' },
  { key: 'campaign_packs', label: 'Campaign packs' },
  { key: 'press_kit',      label: 'Press kit' },
  { key: 'templates',      label: 'Templates' },
  { key: 'all_assets',     label: 'All assets' },
];

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>('ci');
  const [packs, setPacks] = useState<Pack[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [{ data: p }, { data: a }, { data: t }] = await Promise.all([
      supabase.from('press_packs').select('*').order('sort_order', { ascending: true }),
      supabase.from('press_assets').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('press_templates').select('id, slug, name_en, category, updated_at').order('updated_at', { ascending: false }),
    ]);
    setPacks(p as Pack[] ?? []);
    setAssets(a as Asset[] ?? []);
    setTemplates(t as Template[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (file: File) => {
    if (!supabase) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() ?? 'bin';
      const storageKey = `library/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('media').upload(storageKey, file, { upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from('media').getPublicUrl(storageKey);
      const kind: Asset['kind'] =
        file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('audio/') ? 'audio' :
        file.type.startsWith('video/') ? 'video' :
        file.type === 'application/pdf' ? 'document' : 'other';
      const { error: insErr } = await supabase.from('press_assets').insert({
        filename: file.name,
        url: pub.publicUrl,
        storage_key: storageKey,
        size_bytes: file.size,
        mime_type: file.type || null,
        kind,
        rights: 'internal',
      });
      if (insErr) throw insErr;
      await load();
    } catch (e: unknown) {
      alert(`Upload failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setUploading(false); }
  };

  const ciPacks       = useMemo(() => packs.filter((p) => p.scope === 'ci_baseline'), [packs]);
  const campaignPacks = useMemo(() => packs.filter((p) => p.scope === 'campaign'),    [packs]);
  const pressKitPack  = useMemo(() => packs.find((p) => p.scope === 'press_kit') ?? null, [packs]);

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p className="t-label">Desk · Library</p>
        <h1 className="t-h2" style={{ marginTop: 'var(--space-2)' }}>Every asset. One shelf.</h1>
        <p className="t-body" style={{ maxWidth: 560, marginTop: 'var(--space-3)' }}>
          CI baseline · Campaign packs · Press kit · Templates · every asset ever uploaded. Rights-filtered at download. Bilingual alt and caption. Usage graph on every piece.
        </p>
      </div>

      {/* Tabs */}
      <div role="tablist" style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-soft)', marginBottom: 'var(--space-5)' }}>
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className="t-button"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px 14px',
              borderBottom: tab === t.key ? '2px solid var(--cdcc-gold)' : '2px solid transparent',
              color: tab === t.key ? 'var(--cdcc-charcoal)' : 'var(--fg-3)',
              cursor: 'pointer',
            }}
          >{t.label}</button>
        ))}

        <div style={{ marginLeft: 'auto' }}>
          <label className="t-button" style={{ background: 'var(--cdcc-charcoal)', color: 'var(--fg-inverse)', padding: '8px 14px', cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
            {uploading ? 'Uploading' : '+ Upload asset'}
            <input type="file" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} disabled={uploading} />
          </label>
        </div>
      </div>

      {loading ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)' }}>Loading Library…</p>
      ) : (
        <>
          {tab === 'ci' && <PackList packs={ciPacks} emptyHint="CI baseline pack is seeded. Upload logos, brand guide, colour tokens and add them to the pack." />}
          {tab === 'campaign_packs' && <PackList packs={campaignPacks} emptyHint="No Campaign packs yet. Phase C6 binds Campaigns; meanwhile create packs manually." />}
          {tab === 'press_kit' && <PackList packs={pressKitPack ? [pressKitPack] : []} emptyHint="" />}
          {tab === 'templates' && <TemplateList templates={templates} />}
          {tab === 'all_assets' && <AssetGrid assets={assets} />}
        </>
      )}
    </div>
  );
}

function PackList({ packs, emptyHint }: { packs: Pack[]; emptyHint: string }) {
  if (packs.length === 0) return <p className="t-caption" style={{ color: 'var(--fg-3)' }}>{emptyHint}</p>;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
      {packs.map((p) => (
        <li key={p.id} style={{ border: '1px solid var(--border-soft)', padding: 'var(--space-4)', background: 'var(--bg-2)' }}>
          <p className="t-label" style={{ color: 'var(--fg-accent)' }}>{p.scope.replace('_', ' ')} · {p.rights}</p>
          <h3 className="t-card-title" style={{ marginTop: 4 }}>{p.label_en}</h3>
          {p.description_en && <p className="t-body-sm" style={{ marginTop: 'var(--space-2)' }}>{p.description_en}</p>}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <a href={`/api/press/pack/${p.id}/download`} className="t-button" style={{ background: 'var(--cdcc-charcoal)', color: 'var(--fg-inverse)', padding: '6px 10px', textDecoration: 'none' }}>
              Download ZIP
            </a>
            <Link href={`/admin/press/library/pack/${p.id}`} className="t-button" style={{ border: '1px solid var(--cdcc-charcoal)', color: 'var(--fg-1)', padding: '6px 10px', textDecoration: 'none' }}>
              Edit pack
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AssetGrid({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) return <p className="t-caption" style={{ color: 'var(--fg-3)' }}>No assets uploaded yet.</p>;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
      {assets.map((a) => (
        <li key={a.id} style={{ border: '1px solid var(--border-soft)', background: 'var(--bg-1)' }}>
          <div style={{ aspectRatio: '4/3', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {a.kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt={a.alt_en ?? a.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
            ) : (
              <span className="t-mono" style={{ color: 'var(--fg-3)', fontSize: 10 }}>{a.kind}</span>
            )}
          </div>
          <div style={{ padding: 'var(--space-3)' }}>
            <p className="t-caption" style={{ color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename}</p>
            <p className="t-label" style={{ marginTop: 4, color: rightsColor(a.rights) }}>{a.rights}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TemplateList({ templates }: { templates: Template[] }) {
  if (templates.length === 0) return <p className="t-caption" style={{ color: 'var(--fg-3)' }}>No templates yet. Save any Voice as a template to seed this surface.</p>;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--border-soft)' }}>
      {templates.map((t) => (
        <li key={t.id} style={{ borderBottom: '1px solid var(--border-soft)', padding: 'var(--space-4) 0', display: 'flex', gap: 'var(--space-4)', alignItems: 'baseline' }}>
          <span className="t-label" style={{ minWidth: 140 }}>{t.category.replace('_', ' ')}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{t.name_en}</span>
          <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{new Date(t.updated_at).toISOString().slice(0,10)}</span>
        </li>
      ))}
    </ul>
  );
}

function rightsColor(r: string): string {
  switch (r) {
    case 'public':   return 'var(--cdcc-emerald)';
    case 'member':   return 'var(--cdcc-blue)';
    case 'press':    return 'var(--cdcc-gold)';
    case 'internal': return 'var(--fg-3)';
    default:         return 'var(--fg-4)';
  }
}
