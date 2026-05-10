'use client';

/**
 * Page-level scaffold for any public form.
 *
 * Provides: eyebrow + headline + intro paragraph at the top, slotted
 * children for the form body, and an optional right-rail for "what
 * happens next" / progress / context. Mobile collapses to a single
 * column.
 *
 * Pairs with `FormStep` for multi-step flows (FormStep goes inside
 * the children body) and `useFormDraft` for localStorage persistence.
 */

import type { ReactNode } from 'react';

interface FormShellProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  /** Optional context column · "what happens next" / FAQ / progress copy. */
  rail?: ReactNode;
  /** When the rail is rendered, the body shrinks to make room. */
  showRail?: boolean;
}

export function FormShell({
  eyebrow,
  title,
  intro,
  children,
  rail,
  showRail = false,
}: FormShellProps) {
  const hasRail = showRail && rail != null;
  return (
    <div className="pt-28 pb-20 px-6">
      <div className={hasRail ? 'max-w-5xl mx-auto' : 'max-w-3xl mx-auto'}>
        {/* Header block */}
        <header className="mb-10">
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-4">
              {eyebrow}
            </p>
          )}
          <h1
            className="font-display font-bold text-black tracking-tight leading-[1.05]"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}
          >
            {title}
          </h1>
          {intro && (
            <p className="text-gray-600 mt-6 max-w-xl text-sm leading-relaxed">
              {intro}
            </p>
          )}
        </header>

        {/* Body · with optional right rail */}
        {hasRail ? (
          <div className="grid gap-12 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div>{children}</div>
            <aside className="order-first md:order-last">
              <div className="sticky top-28 border-l border-gray-200/60 pl-6 text-sm text-gray-600">
                {rail}
              </div>
            </aside>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>
    </div>
  );
}
