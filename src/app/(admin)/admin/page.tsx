'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ============================================================
   CDCC Corporate Dashboard
   All data from Supabase — no hardcoded values.
   ============================================================ */

interface DashboardData {
  postCount: number;
  publishedPosts: number;
  eventCount: number;
  upcomingEvents: number;
  programmeCount: number;
  activeProgrammes: number;
  registryCount: number;
  pendingRegistry: number;
  staffCount: number;
  episodeCount: number;
  stakeholderCount: number;
  recentPosts: { id: number; title: string; status: string; created_at: string }[];
  upcomingEventsList: { id: number; title: string; event_date: string; venue: string; status: string }[];
  recentSubmissions: { id: number; name: string; constituency_type: string; province: string; created_at: string }[];
  complianceItems: { id: number; title: string; due_date: string; status: string }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    if (!supabase) { setLoading(false); return; }

    const [posts, events, programmes, registry, staff, episodes, stakeholders, compliance] = await Promise.all([
      supabase.from('posts').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('events').select('id, title, event_date, venue, status').order('event_date', { ascending: true }),
      supabase.from('programmes').select('id, status'),
      supabase.from('constituency_submissions').select('id, name, constituency_type, province, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('staff').select('id, active'),
      supabase.from('podcast_episodes').select('id, published'),
      supabase.from('stakeholders').select('id'),
      supabase.from('compliance_items').select('id, title, due_date, status').order('due_date', { ascending: true }).limit(5),
    ]);

    const allPosts = posts.data || [];
    const allEvents = events.data || [];
    const allProgrammes = programmes.data || [];
    const allRegistry = registry.data || [];
    const allStaff = staff.data || [];
    const allEpisodes = episodes.data || [];
    const now = new Date().toISOString().split('T')[0];

    setData({
      postCount: allPosts.length,
      publishedPosts: allPosts.filter((p: any) => p.status === 'published').length,
      eventCount: allEvents.length,
      upcomingEvents: allEvents.filter((e: any) => e.event_date >= now).length,
      programmeCount: allProgrammes.length,
      activeProgrammes: allProgrammes.filter((p: any) => p.status === 'active').length,
      registryCount: (registry.data || []).length,
      pendingRegistry: allRegistry.filter((r: any) => r.status === 'pending' || !r.status).length,
      staffCount: allStaff.filter((s: any) => s.active).length,
      episodeCount: allEpisodes.filter((e: any) => e.published).length,
      stakeholderCount: (stakeholders.data || []).length,
      recentPosts: allPosts.slice(0, 5) as any[],
      upcomingEventsList: allEvents.filter((e: any) => e.event_date >= now).slice(0, 5) as any[],
      recentSubmissions: allRegistry.slice(0, 5) as any[],
      complianceItems: (compliance.data || []).slice(0, 5) as any[],
    });
    setLoading(false);
  }

  const d = data;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-black">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">CDCC — Books &amp; Publishing, Content Developers &amp; Creators Council</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Loading dashboard...</div>
      ) : !d ? (
        <div className="text-sm text-gray-400 py-12 text-center">Connect Supabase to see live data</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Registry', value: d.registryCount, sub: `${d.pendingRegistry} pending review`, color: 'border-blue-500/30 bg-blue-500/5', vc: 'text-blue-600' },
              { label: 'Programmes', value: d.programmeCount, sub: `${d.activeProgrammes} active`, color: 'border-green-500/30 bg-green-500/5', vc: 'text-green-700' },
              { label: 'Published Posts', value: d.publishedPosts, sub: `${d.postCount} total`, color: 'border-amber-500/30 bg-amber-500/5', vc: 'text-amber-700' },
              { label: 'Stakeholders', value: d.stakeholderCount, sub: `${d.staffCount} staff`, color: 'border-gray-300 bg-gray-50', vc: 'text-black' },
            ].map(k => (
              <div key={k.label} className={`border ${k.color} rounded p-4`}>
                <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">{k.label}</p>
                <p className={`text-2xl font-bold mt-1 ${k.vc}`}>{k.value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Two column: Events + Posts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Upcoming Events */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-4">Upcoming Events</h3>
              <div className="border border-gray-200/60 rounded divide-y divide-gray-200/30">
                {d.upcomingEventsList.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs">No upcoming events</div>
                ) : d.upcomingEventsList.map(e => (
                  <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-black">{e.title}</p>
                      <p className="text-xs text-gray-500">{e.event_date} &middot; {e.venue || 'TBC'}</p>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded ${e.status === 'published' || e.status === 'registration_open' ? 'border-green-500/30 text-green-700' : 'border-gray-200 text-gray-500'}`}>{e.status?.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Posts */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-4">Recent Posts</h3>
              <div className="border border-gray-200/60 rounded divide-y divide-gray-200/30">
                {d.recentPosts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs">No posts yet</div>
                ) : d.recentPosts.map(p => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-black">{p.title}</p>
                      <p className="text-xs text-gray-500">{p.created_at?.split('T')[0]}</p>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded ${p.status === 'published' ? 'border-green-500/30 text-green-700' : 'border-gray-200 text-gray-500'}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two column: Registry + Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Submissions */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-4">Recent Registry Submissions</h3>
              <div className="border border-gray-200/60 rounded divide-y divide-gray-200/30">
                {d.recentSubmissions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs">No submissions yet</div>
                ) : d.recentSubmissions.map(r => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-black">{r.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{r.constituency_type?.replace(/_/g, ' ')} &middot; {r.province || '—'}</p>
                    </div>
                    <span className="text-xs text-gray-400">{r.created_at?.split('T')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance */}
            <div>
              <h3 className="text-sm font-semibold text-black mb-4">Compliance Deadlines</h3>
              <div className="border border-gray-200/60 rounded divide-y divide-gray-200/30">
                {d.complianceItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs">No compliance items</div>
                ) : d.complianceItems.map(c => {
                  const overdue = c.status !== 'completed' && c.due_date < new Date().toISOString().split('T')[0];
                  return (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-black'}`}>{c.title}</p>
                        <p className="text-xs text-gray-500">{c.due_date}</p>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded ${c.status === 'completed' ? 'border-green-500/30 text-green-700' : overdue ? 'border-red-500/30 text-red-600' : 'border-amber-500/30 text-amber-700'}`}>{overdue ? 'Overdue' : c.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick stats footer */}
          <div className="mt-10 pt-6 border-t border-gray-200/40 flex flex-wrap gap-6 text-xs text-gray-400">
            <span>{d.episodeCount} published episodes</span>
            <span>{d.upcomingEvents} upcoming events</span>
            <span>{d.publishedPosts} published articles</span>
          </div>
        </>
      )}
    </div>
  );
}
