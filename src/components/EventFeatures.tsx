'use client';

/**
 * EventFeatures — shared utilities + components used across admin + public
 * event pages. QR codes, CSV export, WhatsApp share, certificate, etc.
 */

import { QRCodeSVG } from 'qrcode.react';

// ── QR Code Display ─────────────────────────────────────────────
export function TicketQR({ code, eventTitle, size = 180 }: { code: string; eventTitle: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-lg border border-gray-200">
      <QRCodeSVG value={code} size={size} level="M" includeMargin />
      <p className="font-mono text-xs text-black/60 tracking-wider">{code}</p>
      <p className="text-[10px] text-black/40 text-center max-w-[200px]">{eventTitle}</p>
    </div>
  );
}

// ── CSV Export ───────────────────────────────────────────────────
export function exportToCSV(rows: Record<string, any>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const val = String(row[h] ?? '').replace(/"/g, '""');
      return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val;
    }).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── WhatsApp Share ──────────────────────────────────────────────
export function WhatsAppShareButton({ eventTitle, eventDate, eventUrl, venue }: { eventTitle: string; eventDate: string; eventUrl: string; venue?: string }) {
  const text = `📚 ${eventTitle}\n📅 ${new Date(eventDate).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${venue ? `\n📍 ${venue}` : ''}\n\nRegister here: ${eventUrl}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-[#25D366] text-white text-xs tracking-[0.1em] uppercase px-5 py-2.5 rounded hover:bg-[#20BD5A] transition-colors font-semibold">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
      Share on WhatsApp
    </a>
  );
}

// ── Printable Attendance Register ────────────────────────────────
export function AttendanceRegisterPrint({ eventTitle, eventDate, venue, registrations }: {
  eventTitle: string; eventDate: string; venue?: string;
  registrations: Array<{ name: string; organisation?: string; province?: string }>;
}) {
  return (
    <div className="print-only" style={{ fontFamily: 'serif', padding: '20px', color: '#000', background: '#fff' }}>
      <style>{`@media screen { .print-only { display: none; } } @media print { .no-print { display: none !important; } body { background: #fff; } }`}</style>
      <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid #C9A661', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>CDCC — Attendance Register</h1>
        <p style={{ fontSize: '14px', margin: '4px 0 0' }}>{eventTitle}</p>
        <p style={{ fontSize: '12px', color: '#666' }}>{eventDate}{venue ? ` · ${venue}` : ''}</p>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            <th style={{ textAlign: 'left', padding: '6px 4px', width: '30px' }}>#</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Full Name</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Organisation</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Province</th>
            <th style={{ textAlign: 'left', padding: '6px 4px', width: '120px' }}>Signature</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 4px' }}>{i + 1}</td>
              <td style={{ padding: '8px 4px' }}>{r.name}</td>
              <td style={{ padding: '8px 4px' }}>{r.organisation || ''}</td>
              <td style={{ padding: '8px 4px' }}>{r.province || ''}</td>
              <td style={{ padding: '8px 4px', borderBottom: '1px dotted #999' }}></td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, 30 - registrations.length) }).map((_, i) => (
            <tr key={`blank-${i}`} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 4px' }}>{registrations.length + i + 1}</td>
              <td style={{ padding: '8px 4px' }}></td>
              <td style={{ padding: '8px 4px' }}></td>
              <td style={{ padding: '8px 4px' }}></td>
              <td style={{ padding: '8px 4px', borderBottom: '1px dotted #999' }}></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '24px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
        Total registered: {registrations.length} · Page 1 of 1 · CDCC Thekgang NPC
      </div>
    </div>
  );
}

// ── Certificate of Attendance (printable) ───────────────────────
export function CertificateView({ attendeeName, eventTitle, eventDate, certificateCode }: {
  attendeeName: string; eventTitle: string; eventDate: string; certificateCode: string;
}) {
  return (
    <div style={{ width: '800px', height: '560px', margin: '0 auto', padding: '48px', border: '3px solid #C9A661', background: '#FDFBF5', fontFamily: 'serif', position: 'relative', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', bottom: '8px', border: '1px solid #C9A661', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A661', marginBottom: '8px' }}>Books & Publishing Content Developers and Creators Council</p>
        <h1 style={{ fontSize: '32px', fontWeight: 'normal', color: '#2D2A26', margin: '0 0 8px', fontStyle: 'italic' }}>Certificate of Attendance</h1>
        <div style={{ width: '60px', height: '2px', background: '#C9A661', margin: '16px auto' }} />
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>This certifies that</p>
        <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2D2A26', margin: '0 0 24px', fontStyle: 'italic' }}>{attendeeName}</p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>attended the</p>
        <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2D2A26', margin: '0 0 8px' }}>{eventTitle}</p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
          held on {new Date(eventDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '32px' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ width: '150px', borderTop: '1px solid #2D2A26', paddingTop: '4px' }}>
              <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>Secretary · CDCC</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '9px', color: '#999', fontFamily: 'monospace' }}>Cert: {certificateCode}</p>
            <p style={{ fontSize: '9px', color: '#999' }}>Verify at thekgang.org.za/verify</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Post-Event DSAC Report Template ─────────────────────────────
export function DSACReportTemplate({ event, registrations, feedback, provinces }: {
  event: { title: string; event_date: string; venue?: string; event_type?: string; budget_allocated?: number; budget_spent?: number };
  registrations: Array<{ checked_in: boolean; province?: string }>;
  feedback: Array<{ rating: number }>;
  provinces: string[];
}) {
  const attended = registrations.filter(r => r.checked_in).length;
  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : 'N/A';
  const attendanceRate = registrations.length > 0 ? Math.round((attended / registrations.length) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-3xl mx-auto" id="dsac-report">
      <div className="text-center mb-8 pb-6 border-b border-black/20">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">DSAC Quarterly Report · Event Summary</p>
        <h2 className="font-display text-2xl font-bold text-black">{event.title}</h2>
        <p className="text-sm text-black/50 mt-1">{event.event_date} · {event.venue || 'Virtual'}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="text-center p-3 bg-black/5 rounded">
          <p className="text-2xl font-bold text-black">{registrations.length}</p>
          <p className="text-[9px] uppercase text-black/50">Registered</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded">
          <p className="text-2xl font-bold text-green-700">{attended}</p>
          <p className="text-[9px] uppercase text-black/50">Attended</p>
        </div>
        <div className="text-center p-3 bg-black/5 rounded">
          <p className="text-2xl font-bold text-black">{attendanceRate}%</p>
          <p className="text-[9px] uppercase text-black/50">Attendance Rate</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded">
          <p className="text-2xl font-bold text-amber-700">{avgRating}/5</p>
          <p className="text-[9px] uppercase text-black/50">Avg Rating</p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Provincial Representation ({provinces.length} provinces)</p>
        <p className="text-sm text-black/70">{provinces.length > 0 ? provinces.join(', ') : 'No province data collected'}</p>
      </div>

      {(event.budget_allocated || event.budget_spent) && (
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Budget</p>
          <div className="flex gap-8">
            <div><p className="text-sm text-black/50">Allocated</p><p className="text-lg font-bold text-black">R{(event.budget_allocated || 0).toLocaleString('en-ZA')}</p></div>
            <div><p className="text-sm text-black/50">Spent</p><p className="text-lg font-bold text-black">R{(event.budget_spent || 0).toLocaleString('en-ZA')}</p></div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-wider text-black/40 mb-2">Feedback Summary</p>
        <p className="text-sm text-black/70">{feedback.length} feedback responses received. Average rating: {avgRating}/5.</p>
      </div>

      <div className="text-center pt-6 border-t border-black/10">
        <p className="text-[10px] text-black/30">Report generated by CDCC Corporate OS · Thekgang NPC</p>
        <button onClick={() => window.print()} className="mt-3 text-xs text-gray-500 hover:text-gray-500/80 uppercase tracking-wider transition-colors no-print">Print Report</button>
      </div>
    </div>
  );
}

// ── CDCC Email Template ─────────────────────────────────────────
export function generateEmailHTML({ subject, body, eventTitle, eventDate, venue, ctaLabel, ctaUrl }: {
  subject: string; body: string; eventTitle?: string; eventDate?: string; venue?: string; ctaLabel?: string; ctaUrl?: string;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ef;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e8e5df;border-radius:4px;">
  <tr><td style="background:#2D2A26;padding:24px 32px;text-align:center;">
    <p style="color:#C9A661;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0;">Books & Publishing</p>
    <p style="color:#fff;font-size:18px;font-weight:bold;margin:8px 0 0;">CDCC</p>
  </td></tr>
  <tr><td style="padding:32px;">
    ${eventTitle ? `<p style="color:#C9A661;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 4px;">${eventTitle}</p>` : ''}
    ${eventDate ? `<p style="color:#999;font-size:13px;margin:0 0 16px;">${eventDate}${venue ? ` · ${venue}` : ''}</p>` : ''}
    <div style="color:#2D2A26;font-size:15px;line-height:1.7;">${body.replace(/\n/g, '<br>')}</div>
    ${ctaLabel && ctaUrl ? `<p style="text-align:center;margin:24px 0 0;"><a href="${ctaUrl}" style="display:inline-block;background:#C9A661;color:#2D2A26;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;padding:12px 32px;border-radius:4px;">${ctaLabel}</a></p>` : ''}
  </td></tr>
  <tr><td style="background:#2D2A26;padding:16px 32px;text-align:center;">
    <p style="color:#C9A661;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;margin:0;">Thekgang NPC · Content Developers & Creators Council</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}
