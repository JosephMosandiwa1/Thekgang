/**
 * The Press · role registry (Phase A0).
 *
 * Ten roles, named for CDCC's governance — not WordPress-generic
 * subscriber/contributor/author/editor. See the plan's Roles table
 * at C:/Users/Admin/.claude/plans/go-to-the-foundation-sprightly-candle.md.
 *
 * Each role controls which Press surfaces appear in the left rail
 * and which primitives RLS policies permit writing. The migration in
 * supabase/migrations/020_press_roles.sql creates a user_roles table
 * and helper `current_role()` that RLS policies call.
 */

export type PressRole =
  | 'chair'
  | 'treasurer'
  | 'secretary'
  | 'ed'
  | 'programme_lead'
  | 'contributor'
  | 'council_member'
  | 'jury_member'
  | 'volunteer'
  | 'staff';

export interface PressRoleDef {
  key: PressRole;
  label: string;
  can: string;
  cannot: string;
}

export const ROLES: Record<PressRole, PressRoleDef> = {
  chair: {
    key: 'chair',
    label: 'Chair',
    can: 'Approve Voices at pillar-impact level. Sign off AGM, strategic plan, compliance reports. Read everything.',
    cannot: 'Touch finance. Daily editing.',
  },
  treasurer: {
    key: 'treasurer',
    label: 'Treasurer',
    can: 'Approve budgets. Approve expense claims. Sign off financial reports. Approve Campaign budgets. Sign contracts over threshold.',
    cannot: 'Publish Voices. Edit Programme copy.',
  },
  secretary: {
    key: 'secretary',
    label: 'Secretary',
    can: 'Compile AGM pack. Minute Meetings. Sign off policy submissions. Commission Voices (spokesperson).',
    cannot: 'Touch finance approvals.',
  },
  ed: {
    key: 'ed',
    label: 'ED / Comms lead',
    can: 'Daily publishing. Commission Briefs. Schedule Voices. Approve Council and Form applications. Build Forms. Send Messages. Run Events. Publish Campaigns.',
    cannot: 'Approve budgets over threshold. Sign off strategy.',
  },
  programme_lead: {
    key: 'programme_lead',
    label: 'Programme lead',
    can: 'Edit their Programme and its child Voices/Events/Outcomes. Commission Briefs. Review applications to their Programme. Build scoped Forms. Send Messages to Programme audience.',
    cannot: 'Edit other Programmes. Publish at cluster level.',
  },
  contributor: {
    key: 'contributor',
    label: 'Contributor',
    can: 'Write assigned Brief. Upload to Library.',
    cannot: 'Publish. See other contributors drafts.',
  },
  council_member: {
    key: 'council_member',
    label: 'Council member',
    can: 'Edit own profile. Apply to Programmes. Submit to calls. Access member-gated Voices and Assets. Subscribe to newsletters.',
    cannot: 'Any admin surface.',
  },
  jury_member: {
    key: 'jury_member',
    label: 'Jury member',
    can: 'Review Submissions assigned to their Jury. Score and comment.',
    cannot: 'See non-Jury Submissions. Publish.',
  },
  volunteer: {
    key: 'volunteer',
    label: 'Volunteer',
    can: 'View assigned Event tasks. Check in attendees.',
    cannot: 'Edit content. Approve.',
  },
  staff: {
    key: 'staff',
    label: 'Staff',
    can: 'Submit expense claims. Clock timesheets.',
    cannot: 'Publish. Approve.',
  },
};

/** Roles that see any admin surface at all. */
export const ADMIN_ROLES: PressRole[] = [
  'chair',
  'treasurer',
  'secretary',
  'ed',
  'programme_lead',
  'contributor',
  'jury_member',
  'volunteer',
  'staff',
];

/** Roles that should never see the admin even if authenticated. */
export const NON_ADMIN_ROLES: PressRole[] = ['council_member'];
