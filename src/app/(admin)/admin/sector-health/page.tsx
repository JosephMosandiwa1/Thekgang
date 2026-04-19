'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatRand } from '@/lib/utils';

interface Snapshot {
  active_members: number;
  verified_members: number;
  public_organisations: number;
  books_in_catalogue: number;
  published_events: number;
  grants_awarded: number;
  total_grants_awarded_rands: number;
  policy_submissions_filed: number;
  copyright_register_public: number;
  open_jobs: number;
  active_working_groups: number;
  wg_membership_count: number;
  snapshot_at: string;
}

export default function AdminSectorHealth() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('sector_health_snapshot').select('*').maybeSingle();
      setSnap(data as Snapshot | null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-1">Sector health</h1>
      <p className="text-sm text-gray-500 mb-8">Live aggregate · every Rand granted, every member active, every submission filed</p>

      {!snap ? (
        <p className="text-sm text-gray-500">No data yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Stat label="Active members" value={snap.active_members.toLocaleString()} />
            <Stat label="Verified" value={snap.verified_members.toLocaleString()} />
            <Stat label="Organisations" value={snap.public_organisations.toLocaleString()} />
            <Stat label="Books in catalogue" value={snap.books_in_catalogue.toLocaleString()} />
            <Stat label="Published events" value={snap.published_events.toLocaleString()} />
            <Stat label="Grants awarded" value={snap.grants_awarded.toLocaleString()} sub={formatRand(snap.total_grants_awarded_rands)} />
            <Stat label="Policy submissions" value={snap.policy_submissions_filed.toLocaleString()} />
            <Stat label="Copyright entries" value={snap.copyright_register_public.toLocaleString()} />
            <Stat label="Open jobs" value={snap.open_jobs.toLocaleString()} />
            <Stat label="Working groups" value={`${snap.active_working_groups} / 14`} sub={`${snap.wg_membership_count} members`} />
          </div>
          <p className="text-xs text-gray-400">Snapshot taken {new Date(snap.snapshot_at).toLocaleString()} · refresh page to regenerate</p>

          <section className="mt-10">
            <h2 className="font-display text-lg font-bold mb-4">What this view is</h2>
            <p className="text-sm text-gray-600 max-w-2xl">
              Live aggregate drawn from every module — members, organisations, books, events, grants, policy, copyright, jobs, working groups. This view is what goes into the DSAC quarterly return and the State of the Publishing Sector report appendix. No separate dashboarding tool needed.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-gray-200 p-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{label}</p>
      <p className="font-display text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-1 font-mono">{sub}</p>}
    </div>
  );
}
