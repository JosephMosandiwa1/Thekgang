/**
 * Shared utilities for the CDCC app.
 * Import everything from here so admin pages and public pages format the same way.
 */

// ---------------------------------------------------------------------------
// Currency (ZAR)
// ---------------------------------------------------------------------------
export function formatRand(amount: number | string | null | undefined, opts?: { zeroDash?: boolean }): string {
  const n = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (!Number.isFinite(n)) return "R 0";
  if (n === 0 && opts?.zeroDash) return "—";
  const sign = n < 0 ? "-" : "";
  const parts = Math.abs(n).toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}R ${parts.join(".")}`;
}

export function parseRand(input: string): number {
  return parseFloat(input.replace(/[^\d.-]/g, "")) || 0;
}

// ---------------------------------------------------------------------------
// Dates (South African conventions)
// ---------------------------------------------------------------------------
const SA_LOCALE = "en-ZA";

export function formatDate(date: string | Date | null | undefined, style: "short" | "long" | "full" = "long"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { day: "numeric", month: "short", year: "numeric" }
      : style === "long"
      ? { day: "numeric", month: "long", year: "numeric" }
      : { weekday: "long", day: "numeric", month: "long", year: "numeric" };
  return d.toLocaleDateString(SA_LOCALE, options);
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(SA_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 0 && diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 0) return `in ${Math.round(diffDays / 7)} weeks`;
  return `${Math.abs(Math.round(diffDays / 7))} weeks ago`;
}

export function daysBetween(start: string | Date, end: string | Date): number {
  const a = typeof start === "string" ? new Date(start) : start;
  const b = typeof end === "string" ? new Date(end) : end;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Strings + slugs
// ---------------------------------------------------------------------------
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function truncate(text: string, max: number, suffix = "…"): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - suffix.length) + suffix : text;
}

export function titleCase(text: string): string {
  return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

// ---------------------------------------------------------------------------
// Validation (email, phone, SA ID)
// ---------------------------------------------------------------------------
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isEmail(v: string | null | undefined): boolean {
  return !!v && EMAIL_RE.test(v);
}

export function isSAPhone(v: string | null | undefined): boolean {
  if (!v) return false;
  const digits = v.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("27"));
}

export function normaliseSAPhone(v: string): string {
  const digits = v.replace(/\D/g, "");
  if (digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("27")) return `+${digits}`;
  return v;
}

// ---------------------------------------------------------------------------
// Copy-to-clipboard helper (client only)
// ---------------------------------------------------------------------------
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

// ---------------------------------------------------------------------------
// Class-name concatenation (simple cn — avoids adding clsx dependency)
// ---------------------------------------------------------------------------
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Supabase error formatter
// ---------------------------------------------------------------------------
export function supabaseErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err && "message" in err) return String((err as { message: string }).message);
  return "Something went wrong";
}

// ---------------------------------------------------------------------------
// Safe JSON parse
// ---------------------------------------------------------------------------
export function safeParse<T = unknown>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// CDCC disciplines (14 canonical disciplines)
// ---------------------------------------------------------------------------
export const CDCC_DISCIPLINES = [
  "Author",
  "Editor",
  "Translator",
  "Literary critic",
  "Poet",
  "Illustrator",
  "Book designer",
  "Typesetter",
  "Publisher",
  "Printer",
  "Bookseller",
  "Librarian",
  "Distributor",
  "Literary agent",
] as const;

export type CDCCDiscipline = typeof CDCC_DISCIPLINES[number];

// ---------------------------------------------------------------------------
// SA provinces
// ---------------------------------------------------------------------------
export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type SAProvince = typeof SA_PROVINCES[number];
