/**
 * The Press · 14-surface registry.
 *
 * Each surface is one row in the left-rail of the Press shell.
 * Surfaces map onto the primitive groups from the plan. Every surface
 * has a set of roles that can see it (visibility is RLS-backed too,
 * but the nav filter lives here so we don't render unreachable links).
 *
 * During Phase A0 the surface `href` points at the existing legacy
 * admin routes. As phases A1 → F12 land, each surface's children
 * move to `/admin/press/<surface>/...` and the legacy routes retire.
 */

import type { PressRole } from './roles';

export interface Surface {
  key: string;
  label: string;
  href: string;
  /** Role subset; undefined means all admin roles. */
  roles?: PressRole[];
  /** Short caption for the mobile overlay. */
  caption?: string;
  /** Tiny glyph character — swapped for proper SVG when we need icons.  Keep emoji-free; use a single mono glyph. */
  glyph: string;
}

export interface SurfaceGroup {
  title: string;
  surfaces: Surface[];
}

export const SURFACES: SurfaceGroup[] = [
  {
    title: 'Desk',
    surfaces: [
      { key: 'home',      label: 'Home',      href: '/admin',           glyph: '·',  caption: 'Dashboard + cluster rhythm' },
      { key: 'voices',    label: 'Voices',    href: '/admin/posts',     glyph: '§',  caption: 'Publishing — every format',
        roles: ['chair', 'ed', 'secretary', 'programme_lead', 'contributor'] },
      { key: 'campaigns', label: 'Campaigns', href: '/admin/programmes', glyph: '¶', caption: 'Strategic pushes + collateral',
        roles: ['chair', 'ed', 'programme_lead'] },
      { key: 'messaging', label: 'Messaging', href: '/admin/newsletters', glyph: '@', caption: 'Email · WhatsApp · sequences',
        roles: ['chair', 'ed', 'programme_lead', 'secretary'] },
    ],
  },
  {
    title: 'Library',
    surfaces: [
      { key: 'library', label: 'Library', href: '/admin/media', glyph: '□', caption: 'Assets · Packs · Templates · Press kit',
        roles: ['chair', 'ed', 'secretary', 'programme_lead', 'contributor'] },
      { key: 'forms',   label: 'Forms',   href: '/admin/contact', glyph: '☷', caption: 'Form builder + submissions inbox',
        roles: ['chair', 'ed', 'programme_lead'] },
    ],
  },
  {
    title: 'People',
    surfaces: [
      { key: 'council', label: 'Council', href: '/admin/stakeholders', glyph: '◈', caption: '14-discipline members',
        roles: ['chair', 'ed', 'programme_lead', 'secretary'] },
      { key: 'network', label: 'Network', href: '/admin/organisations', glyph: '◊', caption: 'Partners · Funders · Sponsors · Press',
        roles: ['chair', 'ed', 'treasurer', 'secretary'] },
    ],
  },
  {
    title: 'Work',
    surfaces: [
      { key: 'programmes', label: 'Programmes', href: '/admin/programmes', glyph: '▫', caption: 'Standard · Awards · Mentorship · Grants',
        roles: ['chair', 'ed', 'programme_lead', 'treasurer'] },
      { key: 'events',     label: 'Events',     href: '/admin/events',     glyph: '◆', caption: 'Register · Ticket · Check-in · Certify',
        roles: ['chair', 'ed', 'programme_lead', 'volunteer'] },
    ],
  },
  {
    title: 'Govern',
    surfaces: [
      { key: 'documents', label: 'Documents', href: '/admin/documents', glyph: '❯', caption: 'Contracts · Invoices · Expenses',
        roles: ['chair', 'treasurer', 'secretary', 'ed', 'staff'] },
      { key: 'strategy',  label: 'Strategy',  href: '/admin/sector-data', glyph: '△', caption: '3-year plan + Sector indicators',
        roles: ['chair', 'ed', 'secretary', 'treasurer'] },
      { key: 'reports',   label: 'Reports',   href: '/admin/reports',   glyph: '✓', caption: 'DSAC reports · AGM pack',
        roles: ['chair', 'ed', 'treasurer', 'secretary'] },
    ],
  },
  {
    title: 'Setup',
    surfaces: [
      { key: 'site', label: 'Site', href: '/admin/home', glyph: '◎', caption: 'Nav · Footer · Homepage · Integrations · Audit',
        roles: ['chair', 'ed'] },
    ],
  },
];

/** Flatten for role-filtering.  */
export function visibleSurfaces(role: PressRole | null): SurfaceGroup[] {
  if (!role) return [];
  return SURFACES
    .map((group) => ({
      ...group,
      surfaces: group.surfaces.filter((s) => !s.roles || s.roles.includes(role)),
    }))
    .filter((group) => group.surfaces.length > 0);
}

export function isAdminRole(role: PressRole | null): boolean {
  return role !== null && role !== 'council_member';
}
