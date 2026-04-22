/**
 * The Press · Form field types.
 *
 * Each Form has an ordered array of fields. Every field has a common
 * core (key, type, label bilingual, required flag, help text) plus
 * type-specific extras (options for selects, validation regex, etc.).
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'file_upload'
  | 'discipline_picker'
  | 'pillar_picker'
  | 'province_picker'
  | 'language_picker'
  | 'council_member_picker'
  | 'signature'
  | 'consent';

export interface FormField {
  key: string;
  type: FieldType;
  label_en: string;
  label_xh?: string;
  help_en?: string;
  help_xh?: string;
  placeholder_en?: string;
  placeholder_xh?: string;
  required: boolean;
  options?: Array<{ value: string; label_en: string; label_xh?: string }>;
  validation?: { pattern?: string; min?: number; max?: number };
  default_value?: string | number | boolean | null;
}

export interface FormDef {
  id: string;
  slug: string;
  title_en: string;
  title_xh?: string | null;
  description_en?: string | null;
  description_xh?: string | null;
  fields: FormField[];
  access: 'public' | 'member' | 'programme_scoped' | 'token_gated';
  programme_id?: string | null;
  campaign_id?: string | null;
  opens_at?: string | null;
  closes_at?: string | null;
  submit_label_en?: string | null;
  submit_label_xh?: string | null;
  thankyou_en?: string | null;
  thankyou_xh?: string | null;
  redirect_url?: string | null;
  status: 'draft' | 'published' | 'archived';
}

export const FIELD_TYPES: Array<{ type: FieldType; label: string; hint: string }> = [
  { type: 'text',                 label: 'Short text',            hint: 'Single-line text' },
  { type: 'textarea',             label: 'Long text',             hint: 'Multi-line text' },
  { type: 'email',                label: 'Email',                 hint: 'Validated email' },
  { type: 'phone',                label: 'Phone',                 hint: 'Phone number' },
  { type: 'number',               label: 'Number',                hint: 'Numeric input' },
  { type: 'date',                 label: 'Date',                  hint: 'Calendar date' },
  { type: 'datetime',             label: 'Date + time',           hint: 'Full timestamp' },
  { type: 'select',               label: 'Dropdown',              hint: 'Single choice from list' },
  { type: 'multi_select',         label: 'Multi-select',          hint: 'Multiple choice from list' },
  { type: 'radio',                label: 'Radio group',           hint: 'Single pick, visible' },
  { type: 'checkbox',             label: 'Checkbox group',        hint: 'Multi pick, visible' },
  { type: 'file_upload',          label: 'File upload',           hint: 'PDF, image, or document' },
  { type: 'discipline_picker',    label: 'Discipline',            hint: 'The 14 disciplines' },
  { type: 'pillar_picker',        label: 'Pillar',                hint: 'The 4 pillars' },
  { type: 'province_picker',      label: 'Province',              hint: 'The 9 provinces' },
  { type: 'language_picker',      label: 'Language',              hint: 'The 11 official languages' },
  { type: 'council_member_picker',label: 'Council member',        hint: 'Pick from current Council' },
  { type: 'signature',            label: 'Signature',             hint: 'Drawn signature pad' },
  { type: 'consent',              label: 'Consent tickbox',       hint: 'Agreement to a statement' },
];

export function newField(type: FieldType): FormField {
  return {
    key: `field_${Math.random().toString(36).slice(2, 8)}`,
    type,
    label_en: 'Untitled field',
    required: false,
  };
}
