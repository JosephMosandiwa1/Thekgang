import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/server';

const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * Open-tracking 1x1 gif. When a recipient views an email, their client
 * fetches this URL and we mark the send as 'opened'.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sendId: string }> }
) {
  const { sendId } = await params;
  const id = Number(sendId);
  if (id) {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from('newsletter_sends')
        .update({ status: 'opened', opened_at: new Date().toISOString() })
        .eq('id', id)
        .in('status', ['sent', 'pending']);

      // Bump campaign's open_count
      const { data: send } = await supabase.from('newsletter_sends').select('campaign_id').eq('id', id).maybeSingle();
      const campaignId = (send as { campaign_id: number } | null)?.campaign_id;
      if (campaignId) {
        const { data: c } = await supabase.from('newsletter_campaigns').select('open_count').eq('id', campaignId).maybeSingle();
        if (c) {
          await supabase.from('newsletter_campaigns').update({ open_count: ((c as { open_count: number }).open_count || 0) + 1 }).eq('id', campaignId);
        }
      }
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_GIF.byteLength),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}
