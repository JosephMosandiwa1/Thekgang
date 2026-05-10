/**
 * Lightweight field validators · zero dependencies.
 *
 * Each validator takes a value and returns an error message (string)
 * or null if the value is valid. Compose with combine().
 *
 * Usage:
 *   const errors = validate(form, {
 *     email: combine(required(), email()),
 *     phone: phone(),
 *     bio:   maxLength(500),
 *   });
 */

export type Validator<T = string> = (value: T) => string | null;

export function required(message = 'This field is required'): Validator<unknown> {
  return (value) => {
    if (value == null) return message;
    if (typeof value === 'string' && value.trim() === '') return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return null;
  };
}

export function email(message = 'Enter a valid email address'): Validator<string> {
  return (value) => {
    if (!value) return null;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    return ok ? null : message;
  };
}

export function phone(message = 'Enter a valid phone number'): Validator<string> {
  return (value) => {
    if (!value) return null;
    const cleaned = value.replace(/[\s\-()+]/g, '');
    const ok = /^\d{8,15}$/.test(cleaned);
    return ok ? null : message;
  };
}

export function maxLength(max: number, message?: string): Validator<string> {
  return (value) => {
    if (!value) return null;
    if (value.length > max) return message ?? `Must be ${max} characters or fewer`;
    return null;
  };
}

export function minLength(min: number, message?: string): Validator<string> {
  return (value) => {
    if (!value) return null;
    if (value.length < min) return message ?? `Must be at least ${min} characters`;
    return null;
  };
}

export function url(message = 'Enter a valid URL (https://…)'): Validator<string> {
  return (value) => {
    if (!value) return null;
    try {
      const u = new URL(value.startsWith('http') ? value : `https://${value}`);
      if (!u.hostname.includes('.')) return message;
      return null;
    } catch {
      return message;
    }
  };
}

export function combine<T>(...validators: Validator<T>[]): Validator<T> {
  return (value) => {
    for (const v of validators) {
      const err = v(value);
      if (err) return err;
    }
    return null;
  };
}

export function validate<T>(
  values: T,
  rules: Partial<Record<keyof T, Validator<unknown> | Validator<string>>>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key in rules) {
    const rule = rules[key] as Validator<unknown> | undefined;
    if (!rule) continue;
    const err = rule(values[key] as unknown);
    if (err) errors[key] = err;
  }
  return errors;
}
