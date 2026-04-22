'use client';

/**
 * /admin/press/council — 14-discipline Council Member CRM.
 *
 * List view with discipline + province filter + status. Click into
 * a member for their profile, applications thread, interaction log.
 */

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  province_id: string | null;
  discipline_ids: string[];
  language_prefs: string[];
  status: string;
  public_profile: boolean;
  updated_at: string;
};

type Discipline = { id: string; slug: string; label_en: string };
type Province = { id: string; slug: string; label_en: string };

export default function CouncilListPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [m, d, p] = await Promise.all([
      supabase.from('press_council_members').select('*').order('full_name').limit(500),
      supabase.from('press_disciplines').select('id, slug, label_en').order('sort_order'),
      supabase.from('press_provinces').select('id, slug, label_en').order('sort_order'),
    ]);
    setMembers((m.data as Member[]) ?? []);
    setDisciplines((d.data as Discipline[]) ?? []);
    setProvinces((p.data as Province[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = members.filter((m) => {
    if (filterDiscipline && !m.discipline_ids?.includes(filterDiscipline)) return false;
    if (filterProvince && m.province_id !== filterProvince) return false;
    if (filterStatus && m.status !== filterStatus) return false;
    return true;
  });

  const newMember = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('press_council_members').insert({
      full_name: 'New Council Member',
      status: 'active',
    }).select('id').single();
    if (data) window.location.href = `/admin/press/council/${data.id}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-5)' }}>
        <div>
          <p className="t-label">Desk · Council</p>
          <h1 className="t-h2" style={{ marginTop: 'var(--space-2)' }}>{filtered.length} members across 14 disciplines.</h1>
        </div>
        <button onClick={newMember} className="t-button" style={{ background: 'var(--cdcc-charcoal)', color: 'var(--fg-inverse)', border: 'none', padding: '10px 16px', cursor: 'pointer' }}>
          + Add member
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <Filter label="Discipline" value={filterDiscipline} onChange={setFilterDiscipline}
          options={[{ value: '', label: '— all —' }, ...disciplines.map((d) => ({ value: d.id, label: d.label_en }))]} />
        <Filter label="Province" value={filterProvince} onChange={setFilterProvince}
          options={[{ value: '', label: '— all —' }, ...provinces.map((p) => ({ value: p.id, label: p.label_en }))]} />
        <Filter label="Status" value={filterStatus} onChange={setFilterStatus}
          options={[{ value: '', label: '— any —' }, { value: 'active', label: 'active' }, { value: 'inactive', label: 'inactive' }, { value: 'suspended', label: 'suspended' }]} />
      </div>

      {loading ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)' }}>Loading Council…</p>
      ) : filtered.length === 0 ? (
        <p className="t-caption" style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>No members match.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--border-soft)' }}>
          {filtered.map((m) => {
            const disciplineLabels = (m.discipline_ids ?? [])
              .map((id) => disciplines.find((d) => d.id === id)?.label_en)
              .filter(Boolean)
              .slice(0, 3)
              .join(', ');
            return (
              <li key={m.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <Link href={`/admin/press/council/${m.id}`} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4) 0', textDecoration: 'none', color: 'var(--fg-1)' }}>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{m.full_name}</span>
                  <span className="t-caption" style={{ color: 'var(--fg-3)', minWidth: 260 }}>{disciplineLabels || '— no discipline —'}</span>
                  <span className="t-label" style={{ color: m.status === 'active' ? 'var(--cdcc-emerald)' : 'var(--fg-4)' }}>{m.status}</span>
                  {m.public_profile && <span className="t-label" style={{ color: 'var(--fg-accent)' }}>public</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Filter({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column' }}>
      <span className="t-label" style={{ marginBottom: 4 }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: 8, border: '1px solid var(--border-soft)', fontSize: 13, minWidth: 170 }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
