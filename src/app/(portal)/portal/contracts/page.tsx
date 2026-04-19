'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface Template {
  id: number;
  slug: string;
  title: string;
  contract_type: string;
  description: string | null;
  body_markdown: string;
  variables: { name: string; label: string; required?: boolean }[];
  jurisdiction: string;
  last_reviewed: string | null;
  tier_required: string;
}

export default function PortalContracts() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('contract_templates').select('*').eq('active', true).order('title');
      setTemplates(((data || []) as unknown) as Template[]);
      setLoading(false);
    })();
  }, []);

  function generate(t: Template): string {
    let body = t.body_markdown;
    for (const v of t.variables || []) {
      const re = new RegExp(`\\{\\{${v.name}\\}\\}`, 'g');
      body = body.replace(re, values[v.name] || `[${v.label}]`);
    }
    return body;
  }

  function download() {
    if (!selected) return;
    const body = generate(selected);
    const blob = new Blob([body], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${selected.slug}.txt`;
    a.click();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Legal</p>
      <h1 className="font-display text-3xl font-bold mb-2">Contract templates</h1>
      <p className="text-gray-600 mb-8 max-w-2xl text-sm">
        Standard publishing contracts, translation agreements, ghostwriter NDAs, and more. Council-reviewed, SA-jurisdictional. Fill in the variables, download, and take to your lawyer.
      </p>

      {templates.length === 0 ? <p className="text-sm text-gray-500">Templates library is being populated.</p> : (
        <div className="grid md:grid-cols-3 gap-4">
          {templates.map((t) => (
            <button key={t.id} onClick={() => { setSelected(t); setValues({}); }} className="text-left border border-gray-200 p-5 hover:border-black transition-colors">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500/60">{t.contract_type.replace(/_/g, ' ')}</p>
              <p className="font-display text-lg font-bold mt-1">{t.title}</p>
              {t.description && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{t.description}</p>}
              <p className="text-[10px] text-gray-500 mt-3">Jurisdiction: {t.jurisdiction}{t.last_reviewed && ` · reviewed ${formatDate(t.last_reviewed, 'short')}`}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-white max-w-4xl w-full p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold mb-4">{selected.title}</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Fill in the details</p>
                <div className="space-y-3">
                  {(selected.variables || []).map((v) => (
                    <label key={v.name} className="block">
                      <span className="text-xs font-medium text-gray-700 mb-1 block">{v.label}{v.required && <span className="text-red-600 ml-1">*</span>}</span>
                      <input value={values[v.name] || ''} onChange={(e) => setValues({ ...values, [v.name]: e.target.value })} className="w-full px-3 py-2 border border-gray-200 text-sm" />
                    </label>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  This template is a starting point — not legal advice. Take the signed-ready version to your lawyer or the Council&apos;s referred legal panel for review.
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Preview</p>
                  <button onClick={download} className="text-xs uppercase tracking-wider border border-black px-3 py-1 hover:bg-black hover:text-white">Download</button>
                </div>
                <div className="border border-gray-200 p-4 max-h-[500px] overflow-y-auto bg-gray-50">
                  <pre className="whitespace-pre-wrap text-xs font-mono">{generate(selected)}</pre>
                </div>
              </div>
            </div>
            <div className="mt-5"><button onClick={() => setSelected(null)} className="text-xs text-gray-500">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
