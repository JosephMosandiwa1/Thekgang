'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin client not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Mark a submission as reviewed (or set any status), optionally with notes.
 * Routes via the inbox_set_review() Postgres function so each source-table
 * write happens atomically and consistently.
 */
export async function setReview(
  source: string,
  sourcePk: string,
  status: string,
  reviewedBy: string,
  notes?: string,
) {
  const sb = adminClient();
  const { error } = await sb.rpc('inbox_set_review', {
    p_source: source,
    p_source_pk: sourcePk,
    p_status: status,
    p_reviewed_by: reviewedBy,
    p_notes: notes ?? null,
  });
  if (error) throw error;
  revalidatePath('/admin/inbox');
  revalidatePath(`/admin/inbox/${source}/${sourcePk}`);
}

/**
 * Approve a constituency_submissions application as a member:
 * - Insert a row into `members` with status='active'
 * - Invite the applicant via Supabase Auth (sets up password + email verify)
 * - Mark the source submission as status='approved'
 * - Notify the applicant
 */
export async function approveAsMember(submissionId: string, reviewedBy: string) {
  const sb = adminClient();
  const { data: sub, error: subErr } = await sb
    .from('constituency_submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();
  if (subErr || !sub) throw new Error('Application not found');
  if (!sub.email) throw new Error('Application has no email; cannot approve');

  // Generate member_number on the fly (M-YYYY-XXXX format)
  const year = new Date().getFullYear();
  const seq = Date.now().toString().slice(-5);
  const memberNumber = `M-${year}-${seq}`;

  // Insert member · constituency_type lives on the submission, not the
  // member row, so we link via constituency_submission_id and let the
  // join give us the type if needed downstream.
  const { error: memErr } = await sb.from('members').upsert(
    {
      auth_user_id: null, // populated when the user first signs in
      constituency_submission_id: sub.id,
      full_name: sub.name,
      email: sub.email,
      phone: sub.phone,
      province: sub.province,
      organisation: sub.organisation,
      bio: sub.bio,
      member_number: memberNumber,
      status: 'active',
    },
    { onConflict: 'email' },
  );
  if (memErr) throw memErr;

  // Send Supabase invite (creates auth user with password-setup link)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cdcc.org.za';
  const { error: inviteErr } = await sb.auth.admin.inviteUserByEmail(sub.email, {
    redirectTo: `${siteUrl}/portal/profile`,
    data: { full_name: sub.name, member_number: memberNumber },
  });
  // It's fine if the user already exists in Auth — log and continue
  if (inviteErr && !/already.*registered|already.*exists/i.test(inviteErr.message)) {
    console.warn('inviteUserByEmail warning:', inviteErr.message);
  }

  // Personal welcome (in addition to the Supabase invite email)
  await sendEmail({
    to: sub.email,
    subject: "You're approved · welcome to the CDCC",
    text: `Hi ${(sub.name || '').split(/\s+/)[0] || 'there'},\n\nYour CDCC membership application has been approved. Member number: ${memberNumber}.\n\nWe're sending a separate "set up your password" email — open that one and set a password to access your member portal at ${siteUrl}/portal.\n\nIf you don't see the password email within a few minutes, check your spam folder.\n\n— The CDCC team\n${siteUrl}`,
    html: `<p>Hi ${(sub.name || '').split(/\s+/)[0] || 'there'},</p>
      <p>Your CDCC membership application has been approved. Your member number is <strong>${memberNumber}</strong>.</p>
      <p>We're sending a separate "set up your password" email — open that one and set a password to access your <a href="${siteUrl}/portal">member portal</a>.</p>
      <p>If you don't see the password email within a few minutes, check your spam folder.</p>
      <p>— The CDCC team<br/><a href="${siteUrl}">${siteUrl.replace(/^https?:\/\//, '')}</a></p>`,
  });

  // Update the submission status
  const { error: updErr } = await sb.rpc('inbox_set_review', {
    p_source: 'join',
    p_source_pk: submissionId,
    p_status: 'approved',
    p_reviewed_by: reviewedBy,
    p_notes: null,
  });
  if (updErr) throw updErr;

  revalidatePath('/admin/inbox');
  revalidatePath(`/admin/inbox/join/${submissionId}`);
  return { memberNumber };
}
