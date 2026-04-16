'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

/* ============================================================
   Homepage CMS — one screen, one save button per section
   ------------------------------------------------------------
   Loads every row from `homepage_content` (seeded via migration
   003 with the current live copy) and lets the admin edit:
     hero · stakeholders · social_proof · doorways · audiences
     · pillars · outcomes · cta
   Each section is a collapsible card with its own Save button.
   The public homepage reads the same table — change here,
   refresh the site, see it live.
   ============================================================ */

interface Section {
  id: number;
  section_key: string;
  label: string;
  sort_order: number;
  content: any;
  updated_at: string;
}

type SectionKey = 'hero' | 'stakeholders' | 'social_proof' | 'doorways' | 'audiences' | 'pillars' | 'outcomes' | 'cta';

const SECTION_ORDER: SectionKey[] = [
  'hero',
  'stakeholders',
  'social_proof',
  'doorways',
  'audiences',
  'pillars',
  'outcomes',
  'cta',
];

export default function HomePageCMS() {
  const [sections, setSections] = useState<Record<string, Section>>({});
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ hero: true });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('homepage_content').select('*').order('sort_order');
    const map: Record<string, Section> = {};
    const draftMap: Record<string, any> = {};
    (data || []).forEach((s: any) => {
      map[s.section_key] = s;
      draftMap[s.section_key] = JSON.parse(JSON.stringify(s.content));
    });
    setSections(map);
    setDrafts(draftMap);
    setLoading(false);
  }

  function updateDraft(key: string, updater: (c: any) => any) {
    setDrafts((d) => ({ ...d, [key]: updater(d[key]) }));
  }

  async function save(key: string) {
    if (!supabase) return;
    setSavingKey(key);
    await supabase
      .from('homepage_content')
      .update({ content: drafts[key], updated_at: new Date().toISOString() })
      .eq('section_key', key);
    setSavingKey(null);
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2000);
    load();
  }

  function toggle(key: string) {
    setOpen((o) => ({ ...o, [key]: !o[key] }));
  }

  const Input = ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black"
    />
  );

  const TextArea = ({
    value,
    onChange,
    rows = 3,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    rows?: number;
    placeholder?: string;
  }) => (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border border-gray-200/60 px-3 py-2 text-sm rounded focus:outline-none focus:border-black resize-y"
    />
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold block mb-1">
      {children}
    </label>
  );

  function renderSectionBody(key: string) {
    const draft = drafts[key];
    if (!draft) return null;

    switch (key as SectionKey) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label>Eyebrow</Label>
              <Input value={draft.eyebrow} onChange={(v) => updateDraft(key, (c) => ({ ...c, eyebrow: v }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Headline line 1</Label>
                <Input value={draft.headline_line1} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline_line1: v }))} />
              </div>
              <div>
                <Label>Headline line 2</Label>
                <Input value={draft.headline_line2} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline_line2: v }))} />
              </div>
              <div>
                <Label>Headline line 3</Label>
                <Input value={draft.headline_line3} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline_line3: v }))} />
              </div>
            </div>
            <div>
              <Label>Sub-copy</Label>
              <TextArea value={draft.subcopy} onChange={(v) => updateDraft(key, (c) => ({ ...c, subcopy: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Primary CTA label</Label>
                <Input value={draft.cta_primary_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, cta_primary_label: v }))} />
              </div>
              <div>
                <Label>Primary CTA link</Label>
                <Input value={draft.cta_primary_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, cta_primary_href: v }))} />
              </div>
              <div>
                <Label>Secondary CTA label</Label>
                <Input value={draft.cta_secondary_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, cta_secondary_label: v }))} />
              </div>
              <div>
                <Label>Secondary CTA link</Label>
                <Input value={draft.cta_secondary_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, cta_secondary_href: v }))} />
              </div>
              <div>
                <Label>Cluster link label</Label>
                <Input value={draft.cluster_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, cluster_label: v }))} />
              </div>
              <div>
                <Label>Cluster link href</Label>
                <Input value={draft.cluster_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, cluster_href: v }))} />
              </div>
            </div>
          </div>
        );

      case 'stakeholders':
        return (
          <div className="space-y-4">
            <div>
              <Label>Eyebrow</Label>
              <Input value={draft.eyebrow} onChange={(v) => updateDraft(key, (c) => ({ ...c, eyebrow: v }))} />
            </div>
            <div>
              <Label>Headline</Label>
              <Input value={draft.headline} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline: v }))} />
            </div>
            <div>
              <Label>Sub-copy</Label>
              <TextArea value={draft.subcopy} onChange={(v) => updateDraft(key, (c) => ({ ...c, subcopy: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Read-more label</Label>
                <Input value={draft.read_more_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, read_more_label: v }))} />
              </div>
              <div>
                <Label>Read-more href</Label>
                <Input value={draft.read_more_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, read_more_href: v }))} />
              </div>
            </div>
            <div>
              <Label>Stakeholder categories (one per line)</Label>
              <TextArea
                value={(draft.categories || []).join('\n')}
                onChange={(v) =>
                  updateDraft(key, (c) => ({ ...c, categories: v.split('\n').map((s) => s.trim()).filter(Boolean) }))
                }
                rows={8}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Footer link label</Label>
                <Input value={draft.footer_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, footer_label: v }))} />
              </div>
              <div>
                <Label>Footer link href</Label>
                <Input value={draft.footer_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, footer_href: v }))} />
              </div>
            </div>
          </div>
        );

      case 'social_proof':
        return (
          <div className="space-y-3">
            <Label>Social proof strip items</Label>
            {(draft.items || []).map((item: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <input
                  value={item.eyebrow}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...(c.items || [])];
                      arr[i] = { ...arr[i], eyebrow: e.target.value };
                      return { ...c, items: arr };
                    })
                  }
                  placeholder="Eyebrow"
                  className="col-span-4 border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                <input
                  value={item.value}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...(c.items || [])];
                      arr[i] = { ...arr[i], value: e.target.value };
                      return { ...c, items: arr };
                    })
                  }
                  placeholder="Value"
                  className="col-span-7 border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                <button
                  type="button"
                  onClick={() =>
                    updateDraft(key, (c) => ({ ...c, items: (c.items || []).filter((_: any, j: number) => j !== i) }))
                  }
                  className="col-span-1 text-red-400 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateDraft(key, (c) => ({ ...c, items: [...(c.items || []), { eyebrow: '', value: '' }] }))
              }
              className="text-[10px] uppercase tracking-wider text-gray-500 border border-dashed border-gray-300 w-full py-2 rounded"
            >
              + Add item
            </button>
          </div>
        );

      case 'doorways':
        return (
          <div className="space-y-4">
            <Label>Doorway cards (2 cards)</Label>
            {(draft.cards || []).map((card: any, i: number) => (
              <div key={i} className="border border-gray-200/60 rounded p-3 space-y-2">
                <input
                  value={card.eyebrow}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.cards];
                      arr[i] = { ...arr[i], eyebrow: e.target.value };
                      return { ...c, cards: arr };
                    })
                  }
                  placeholder="Eyebrow"
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                <input
                  value={card.title}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.cards];
                      arr[i] = { ...arr[i], title: e.target.value };
                      return { ...c, cards: arr };
                    })
                  }
                  placeholder="Title"
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                <textarea
                  value={card.body}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.cards];
                      arr[i] = { ...arr[i], body: e.target.value };
                      return { ...c, cards: arr };
                    })
                  }
                  placeholder="Body"
                  rows={3}
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                {card.stats && (
                  <input
                    value={(card.stats || []).join(' · ')}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.cards];
                        arr[i] = {
                          ...arr[i],
                          stats: e.target.value.split('·').map((s: string) => s.trim()).filter(Boolean),
                        };
                        return { ...c, cards: arr };
                      })
                    }
                    placeholder="Stats (separate with · )"
                    className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                )}
                {card.tags && (
                  <input
                    value={(card.tags || []).join(', ')}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.cards];
                        arr[i] = {
                          ...arr[i],
                          tags: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean),
                        };
                        return { ...c, cards: arr };
                      })
                    }
                    placeholder="Tags (comma separated)"
                    className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={card.link_label}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.cards];
                        arr[i] = { ...arr[i], link_label: e.target.value };
                        return { ...c, cards: arr };
                      })
                    }
                    placeholder="Link label"
                    className="border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                  <input
                    value={card.link_href}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.cards];
                        arr[i] = { ...arr[i], link_href: e.target.value };
                        return { ...c, cards: arr };
                      })
                    }
                    placeholder="Link href"
                    className="border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'audiences':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Eyebrow</Label>
                <Input value={draft.eyebrow} onChange={(v) => updateDraft(key, (c) => ({ ...c, eyebrow: v }))} />
              </div>
              <div>
                <Label>Headline line 1</Label>
                <Input value={draft.headline_line1} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline_line1: v }))} />
              </div>
              <div>
                <Label>Headline line 2</Label>
                <Input value={draft.headline_line2} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline_line2: v }))} />
              </div>
            </div>
            <Label>Audience cards</Label>
            {(draft.cards || []).map((card: any, i: number) => (
              <div key={i} className="border border-gray-200/60 rounded p-3 space-y-2">
                <input
                  value={card.title}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.cards];
                      arr[i] = { ...arr[i], title: e.target.value };
                      return { ...c, cards: arr };
                    })
                  }
                  placeholder="Title"
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                <textarea
                  value={card.desc}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.cards];
                      arr[i] = { ...arr[i], desc: e.target.value };
                      return { ...c, cards: arr };
                    })
                  }
                  placeholder="Description"
                  rows={3}
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={card.cta_label}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.cards];
                        arr[i] = { ...arr[i], cta_label: e.target.value };
                        return { ...c, cards: arr };
                      })
                    }
                    placeholder="CTA label"
                    className="border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                  <input
                    value={card.cta_href}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.cards];
                        arr[i] = { ...arr[i], cta_href: e.target.value };
                        return { ...c, cards: arr };
                      })
                    }
                    placeholder="CTA href"
                    className="border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                  <input
                    value={card.deeper_label}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.cards];
                        arr[i] = { ...arr[i], deeper_label: e.target.value };
                        return { ...c, cards: arr };
                      })
                    }
                    placeholder="Deeper link label"
                    className="border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                  <input
                    value={card.deeper_href}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.cards];
                        arr[i] = { ...arr[i], deeper_href: e.target.value };
                        return { ...c, cards: arr };
                      })
                    }
                    placeholder="Deeper link href"
                    className="border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'pillars':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Eyebrow</Label>
                <Input value={draft.eyebrow} onChange={(v) => updateDraft(key, (c) => ({ ...c, eyebrow: v }))} />
              </div>
              <div>
                <Label>Headline</Label>
                <Input value={draft.headline} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline: v }))} />
              </div>
              <div className="col-span-2">
                <Label>Sub-copy</Label>
                <TextArea value={draft.subcopy} onChange={(v) => updateDraft(key, (c) => ({ ...c, subcopy: v }))} />
              </div>
              <div>
                <Label>See-more label</Label>
                <Input value={draft.link_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, link_label: v }))} />
              </div>
              <div>
                <Label>See-more href</Label>
                <Input value={draft.link_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, link_href: v }))} />
              </div>
            </div>
            <Label>6 strategic pillars</Label>
            {(draft.items || []).map((it: any, i: number) => (
              <div key={i} className="border border-gray-200/60 rounded p-3 space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  <input
                    value={it.num}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.items];
                        arr[i] = { ...arr[i], num: e.target.value };
                        return { ...c, items: arr };
                      })
                    }
                    placeholder="01"
                    className="col-span-1 border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                  <input
                    value={it.title}
                    onChange={(e) =>
                      updateDraft(key, (c) => {
                        const arr = [...c.items];
                        arr[i] = { ...arr[i], title: e.target.value };
                        return { ...c, items: arr };
                      })
                    }
                    placeholder="Title"
                    className="col-span-3 border border-gray-200/60 px-2 py-2 text-xs rounded"
                  />
                </div>
                <textarea
                  value={it.desc}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.items];
                      arr[i] = { ...arr[i], desc: e.target.value };
                      return { ...c, items: arr };
                    })
                  }
                  placeholder="Description"
                  rows={2}
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                <input
                  value={it.link}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.items];
                      arr[i] = { ...arr[i], link: e.target.value };
                      return { ...c, items: arr };
                    })
                  }
                  placeholder="Link href"
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
              </div>
            ))}
          </div>
        );

      case 'outcomes':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Eyebrow</Label>
                <Input value={draft.eyebrow} onChange={(v) => updateDraft(key, (c) => ({ ...c, eyebrow: v }))} />
              </div>
              <div>
                <Label>Headline</Label>
                <Input value={draft.headline} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline: v }))} />
              </div>
            </div>
            <Label>6 outcomes</Label>
            {(draft.items || []).map((it: any, i: number) => (
              <div key={i} className="border border-gray-200/60 rounded p-3 space-y-2">
                <input
                  value={it.label}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.items];
                      arr[i] = { ...arr[i], label: e.target.value };
                      return { ...c, items: arr };
                    })
                  }
                  placeholder="Outcome label"
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
                <textarea
                  value={it.desc}
                  onChange={(e) =>
                    updateDraft(key, (c) => {
                      const arr = [...c.items];
                      arr[i] = { ...arr[i], desc: e.target.value };
                      return { ...c, items: arr };
                    })
                  }
                  placeholder="Description"
                  rows={2}
                  className="w-full border border-gray-200/60 px-2 py-2 text-xs rounded"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Link label</Label>
                <Input value={draft.link_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, link_label: v }))} />
              </div>
              <div>
                <Label>Link href</Label>
                <Input value={draft.link_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, link_href: v }))} />
              </div>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input value={draft.headline} onChange={(v) => updateDraft(key, (c) => ({ ...c, headline: v }))} />
            </div>
            <div>
              <Label>Sub-copy</Label>
              <TextArea value={draft.subcopy} onChange={(v) => updateDraft(key, (c) => ({ ...c, subcopy: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Primary CTA label</Label>
                <Input value={draft.cta_primary_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, cta_primary_label: v }))} />
              </div>
              <div>
                <Label>Primary CTA href</Label>
                <Input value={draft.cta_primary_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, cta_primary_href: v }))} />
              </div>
              <div>
                <Label>Link 1 label</Label>
                <Input value={draft.link_1_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, link_1_label: v }))} />
              </div>
              <div>
                <Label>Link 1 href</Label>
                <Input value={draft.link_1_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, link_1_href: v }))} />
              </div>
              <div>
                <Label>Link 2 label</Label>
                <Input value={draft.link_2_label} onChange={(v) => updateDraft(key, (c) => ({ ...c, link_2_label: v }))} />
              </div>
              <div>
                <Label>Link 2 href</Label>
                <Input value={draft.link_2_href} onChange={(v) => updateDraft(key, (c) => ({ ...c, link_2_href: v }))} />
              </div>
            </div>
          </div>
        );
    }
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-black">Homepage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit the live homepage. Every section below is live copy — changes save immediately and the public site
          reflects them on next refresh.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500/70">Loading sections…</p>
      ) : Object.keys(sections).length === 0 ? (
        <div className="border border-dashed border-gray-200/60 rounded p-12 text-center">
          <p className="text-sm text-gray-500">
            Homepage content not seeded yet. Run migration <code>003_bespoke_cms.sql</code> in your Supabase SQL
            editor.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {SECTION_ORDER.map((key) => {
            const section = sections[key];
            if (!section) return null;
            const isOpen = !!open[key];
            return (
              <div key={key} className="border border-gray-200/60 rounded bg-white">
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500">{section.section_key}</p>
                    <p className="text-sm font-semibold text-black mt-0.5">{section.label}</p>
                  </div>
                  <span className="text-lg text-gray-400">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <div className="pt-4">{renderSectionBody(key)}</div>
                    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                      <div className="flex-1 text-[10px] text-gray-400">
                        Last saved {section.updated_at?.split('T')[0] || '—'}
                      </div>
                      {savedKey === key && <span className="text-[10px] text-green-600">Saved ✓</span>}
                      <button
                        onClick={() => save(key)}
                        disabled={savingKey === key}
                        className="bg-black text-white text-[10px] font-medium tracking-wider px-5 py-2 uppercase rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {savingKey === key ? 'Saving…' : 'Save section'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
