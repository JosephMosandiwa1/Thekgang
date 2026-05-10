'use client';

import { useEffect, useRef, useState } from 'react';

interface UseFormDraftOptions {
  /** Time in ms to wait between autosaves. Default 800ms. */
  debounceMs?: number;
  /** Skip restoring drafts older than this (ms). Default 14 days. */
  maxAgeMs?: number;
}

interface DraftEnvelope<T> {
  savedAt: number;
  values: T;
}

/**
 * Persists a form's values to localStorage so users can resume long forms.
 *
 * Returns initial `values` on the first render (matches the server-render),
 * then hydrates from storage in a useEffect to avoid SSR mismatch.
 *
 * Usage:
 *   const { values, setValues, hasDraft, hydrated, clearDraft } =
 *     useFormDraft('cdcc-join-v1', initialValues);
 */
export function useFormDraft<T extends object>(
  key: string,
  initial: T,
  options: UseFormDraftOptions = {},
) {
  const { debounceMs = 800, maxAgeMs = 14 * 24 * 60 * 60 * 1000 } = options;
  const storageKey = `cdcc-draft:${key}`;
  const [values, setValuesState] = useState<T>(initial);
  const [hasDraft, setHasDraft] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from storage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const env = JSON.parse(raw) as DraftEnvelope<T>;
        const fresh = Date.now() - env.savedAt < maxAgeMs;
        if (fresh && env.values && typeof env.values === 'object') {
          setValuesState({ ...initial, ...env.values });
          setHasDraft(true);
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch {
      /* ignore quota errors / private mode */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save on every change after hydration
  useEffect(() => {
    if (!hydrated) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const env: DraftEnvelope<T> = { savedAt: Date.now(), values };
        window.localStorage.setItem(storageKey, JSON.stringify(env));
      } catch {
        /* swallow */
      }
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [values, hydrated, storageKey, debounceMs]);

  function setValues(updater: T | ((prev: T) => T)) {
    setValuesState((prev) =>
      typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater,
    );
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setHasDraft(false);
  }

  function discardDraftAndReset() {
    clearDraft();
    setValuesState(initial);
  }

  return { values, setValues, hasDraft, hydrated, clearDraft, discardDraftAndReset };
}
