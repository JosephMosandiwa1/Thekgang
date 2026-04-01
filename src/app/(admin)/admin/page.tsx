'use client';

/* ============================================================
   Thekgang Corporate Dashboard
   Overview of organisational health, DSAC compliance,
   programme delivery, and financial position
   ============================================================ */

const kpis = [
  { label: 'DSAC Budget', value: 'R2 000 000', sublabel: 'FY 2026 allocation', color: 'border-green-500/30 bg-green-500/5', valueColor: 'text-green-700' },
  { label: 'Spent', value: 'R0', sublabel: 'Awaiting first disbursement', color: 'border-amber-500/30 bg-amber-500/5', valueColor: 'text-amber-700' },
  { label: 'Active Programmes', value: '5', sublabel: 'In planning or delivery', color: 'border-blue-500/30 bg-blue-500/5', valueColor: 'text-blue-600' },
  { label: 'Stakeholders', value: '0', sublabel: 'Registry building', color: 'border-gray-300 bg-gray-50', valueColor: 'text-black' },
];

const upcomingDeadlines = [
  { date: '2026-04-30', item: 'DSAC Q4 Narrative Report', type: 'DSAC' },
  { date: '2026-04-30', item: 'DSAC Q4 Financial Report', type: 'DSAC' },
  { date: '2026-06-30', item: 'CIPC Annual Return', type: 'Compliance' },
  { date: '2026-04-15', item: 'Book Value Chain Imbizo — Kwa-Dukuza', type: 'Programme' },
];

const programmes = [
  { name: 'Book Value Chain Imbizo', location: 'Kwa-Dukuza, Stanger', status: 'Planning' },
  { name: 'Jacana Work Skills Programme', location: 'National', status: 'Active' },
  { name: 'Thekgang Talking Podcast', location: 'National', status: 'Active' },
  { name: 'Author Branding Workshop', location: 'North West', status: 'Planning' },
  { name: 'Indigenous Language Distribution', location: 'Limpopo, Mpumalanga', status: 'Planning' },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-black">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Thekgang NPC — Book Publishing, Manufacturing &amp; Distribution Cluster</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {kpis.map(card => (
          <div key={card.label} className={`border p-5 rounded ${card.color}`}>
            <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-2 ${card.valueColor}`}>{card.value}</p>
            <p className="text-[10px] text-gray-500/60 mt-1">{card.sublabel}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-1 border border-gray-200/60 rounded p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-0">
            {upcomingDeadlines.map(d => (
              <div key={d.item} className="flex items-start gap-3 py-3 border-b border-gray-200/30 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${d.type === 'DSAC' ? 'bg-red-500' : d.type === 'Compliance' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-sm text-black">{d.item}</p>
                  <p className="text-[10px] text-gray-500/50">{d.date} &middot; {d.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Programmes */}
        <div className="lg:col-span-2 border border-gray-200/60 rounded p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Programmes</h2>
          <div className="space-y-0">
            {programmes.map(p => (
              <div key={p.name} className="flex items-center justify-between py-3 border-b border-gray-200/30 last:border-0">
                <div>
                  <p className="text-sm text-black font-medium">{p.name}</p>
                  <p className="text-[10px] text-gray-500/50">{p.location}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded ${
                  p.status === 'Active' ? 'border-green-500/30 text-green-700' : 'border-amber-500/30 text-amber-700'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="mt-8 border border-gray-200/60 rounded p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 mb-4">Board of Directors</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: 'Terry-Ann Adams', role: 'Chairperson & Founder', initials: 'TA' },
            { name: 'Lorraine Sithole', role: 'Treasurer', initials: 'LS' },
            { name: 'Melvin Kaabwe', role: 'Secretary & Spokesperson', initials: 'MK' },
          ].map(m => (
            <div key={m.name} className="flex items-center gap-3 p-3 bg-gray-100/30 rounded">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-black">{m.initials}</div>
              <div>
                <p className="text-sm font-medium text-black">{m.name}</p>
                <p className="text-[10px] text-gray-500">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
