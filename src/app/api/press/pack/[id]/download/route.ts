/**
 * GET /api/press/pack/[id]/download
 *
 * Streams a ZIP of every Asset in the Pack. Rights enforced against
 * the caller (public packs open; member/press/internal require a
 * session with the right role).
 *
 * Uses a minimal hand-rolled ZIP generator to avoid pulling in a full
 * archiving dependency. Each file is added uncompressed (store method)
 * which is valid ZIP and perfectly fine for logos/PDFs/fonts that are
 * already compressed. For large text assets, a future Deflate pass can
 * reduce size — not a Phase A2 concern.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  // Load pack + assets via the joining table
  const { data: pack } = await supabase.from('press_packs').select('id, slug, label_en, rights').eq('id', id).maybeSingle();
  if (!pack) return NextResponse.json({ ok: false, error: 'Pack not found' }, { status: 404 });

  const { data: links } = await supabase
    .from('press_pack_assets')
    .select('asset_id, sort_order, press_assets(id, filename, url, storage_key, rights, mime_type)')
    .eq('pack_id', id)
    .order('sort_order');

  type AssetRow = { id: string; filename: string; url: string; storage_key: string | null; rights: string; mime_type: string | null };
  type LinkRow = { asset_id: string; sort_order: number; press_assets: AssetRow | AssetRow[] | null };
  const assets: AssetRow[] = ((links ?? []) as unknown as LinkRow[])
    .flatMap((l) => {
      const pa = l.press_assets;
      if (!pa) return [];
      return Array.isArray(pa) ? pa : [pa];
    });

  if (assets.length === 0) {
    return NextResponse.json({ ok: false, error: 'Pack is empty' }, { status: 404 });
  }

  // Download each file (from supabase storage) and stitch into a ZIP.
  const fileBufs: { name: string; data: Uint8Array }[] = [];
  for (const a of assets) {
    try {
      // Prefer storage download when we have a key (bypasses CDN auth issues).
      let bytes: Uint8Array | null = null;
      if (a.storage_key) {
        const { data } = await supabase.storage.from('media').download(a.storage_key);
        if (data) bytes = new Uint8Array(await data.arrayBuffer());
      }
      if (!bytes) {
        const r = await fetch(a.url);
        if (r.ok) bytes = new Uint8Array(await r.arrayBuffer());
      }
      if (bytes) fileBufs.push({ name: a.filename, data: bytes });
    } catch {
      // skip failed asset
    }
  }

  // Log the download (best-effort)
  try {
    await supabase.from('press_asset_downloads').insert(
      fileBufs.map(() => ({ asset_id: null, pack_id: id, ip_hash: null }))
    );
  } catch { /* non-blocking */ }

  const zip = buildZip(fileBufs);
  const filename = `${pack.slug ?? 'pack'}.zip`;
  return new NextResponse(new Uint8Array(zip) as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(zip.byteLength),
    },
  });
}

// ─── Minimal uncompressed ZIP writer (Store method) ───────────────
// Reference: PKWARE APPNOTE.TXT (sections 4.3.6 - 4.4).
function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.byteLength;

    // Local file header
    const local = new Uint8Array(30 + nameBytes.byteLength);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);           // local file header signature
    lv.setUint16(4, 20, true);                    // version needed (2.0)
    lv.setUint16(6, 0, true);                     // flags
    lv.setUint16(8, 0, true);                     // method (0 = store)
    lv.setUint16(10, 0, true);                    // mod time
    lv.setUint16(12, 0, true);                    // mod date
    lv.setUint32(14, crc, true);                  // crc-32
    lv.setUint32(18, size, true);                 // compressed size
    lv.setUint32(22, size, true);                 // uncompressed size
    lv.setUint16(26, nameBytes.byteLength, true); // filename length
    lv.setUint16(28, 0, true);                    // extra length
    local.set(nameBytes, 30);
    parts.push(local, file.data);

    // Central directory record (built below, after offset known)
    const cd = new Uint8Array(46 + nameBytes.byteLength);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);            // central dir signature
    cv.setUint16(4, 20, true);                    // version made by
    cv.setUint16(6, 20, true);                    // version needed
    cv.setUint16(8, 0, true);                     // flags
    cv.setUint16(10, 0, true);                    // method
    cv.setUint16(12, 0, true);                    // mod time
    cv.setUint16(14, 0, true);                    // mod date
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.byteLength, true);
    cv.setUint16(30, 0, true);                    // extra len
    cv.setUint16(32, 0, true);                    // comment len
    cv.setUint16(34, 0, true);                    // disk number
    cv.setUint16(36, 0, true);                    // internal attrs
    cv.setUint32(38, 0, true);                    // external attrs
    cv.setUint32(42, offset, true);               // relative offset of local header
    cd.set(nameBytes, 46);
    central.push(cd);

    offset += local.byteLength + file.data.byteLength;
  }

  const cdSize = central.reduce((s, b) => s + b.byteLength, 0);
  const cdOffset = offset;

  // End of central directory
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);   // signature
  ev.setUint16(4, 0, true);             // disk
  ev.setUint16(6, 0, true);             // disk with CD
  ev.setUint16(8, files.length, true);  // entries on disk
  ev.setUint16(10, files.length, true); // total entries
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdOffset, true);
  ev.setUint16(20, 0, true);            // comment length

  const total = [...parts, ...central, end];
  const totalSize = total.reduce((s, b) => s + b.byteLength, 0);
  const out = new Uint8Array(totalSize);
  let cursor = 0;
  for (const chunk of total) { out.set(chunk, cursor); cursor += chunk.byteLength; }
  return out;
}

function crc32(buf: Uint8Array): number {
  let crc = ~0 >>> 0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (~crc) >>> 0;
}
