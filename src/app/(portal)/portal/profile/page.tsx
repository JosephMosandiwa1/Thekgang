'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CDCC_DISCIPLINES, SA_PROVINCES, supabaseErrorMessage } from '@/lib/utils';

interface Member {
  id?: number;
  full_name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  province: string | null;
  city: string | null;
  disciplines: string[];
  bio: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  consent_directory: boolean;
  consent_marketing: boolean;
}

const EMPTY: Member = {
  full_name: '',
  email: '',
  phone: '',
  organisation: '',
  province: '',
  city: '',
  disciplines: [],
  bio: '',
  website_url: '',
  linkedin_url: '',
  twitter_handle: '',
  consent_directory: true,
  consent_marketing: false,
};

export default function PortalProfile() {
  const [member, setMember] = useState<Member>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('members').select('*').eq('auth_user_id', user.id).maybeSingle();
      if (data) {
        setMember({ ...EMPTY, ...(data as Partial<Member>), email: user.email || '' });
      } else {
        setMember({ ...EMPTY, email: user.email || '' });
      }
      setLoading(false);
    })();
  }, []);

  function toggleDiscipline(d: string) {
    setMember((m) => ({
      ...m,
      disciplines: m.disciplines.includes(d)
        ? m.disciplines.filter((x) => x !== d)
        : [...m.disciplines, d],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    setMessage(null);
    const record = {
      auth_user_id: user.id,
      full_name: member.full_name,
      email: member.email,
      phone: member.phone || null,
      organisation: member.organisation || null,
      province: member.province || null,
      city: member.city || null,
      disciplines: member.disciplines,
      bio: member.bio || null,
      website_url: member.website_url || null,
      linkedin_url: member.linkedin_url || null,
      twitter_handle: member.twitter_handle || null,
      consent_directory: member.consent_directory,
      consent_marketing: member.consent_marketing,
      popia_consent_at: new Date().toISOString(),
    };

    const { error } = member.id
      ? await supabase.from('members').update(record).eq('id', member.id)
      : await supabase.from('members').insert(record);

    if (error) {
      setMessage({ kind: 'err', text: supabaseErrorMessage(error) });
    } else {
      setMessage({ kind: 'ok', text: 'Profile saved.' });
    }
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500/60 mb-2">Your profile</p>
      <h1 className="font-display text-3xl font-bold mb-8">Profile</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Full name *</span>
            <input
              required
              value={member.full_name}
              onChange={(e) => setMember({ ...member, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Email</span>
            <input
              disabled
              value={member.email}
              className="w-full px-3 py-2 border border-gray-200 text-sm bg-gray-100 text-gray-500"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Phone</span>
            <input
              value={member.phone || ''}
              onChange={(e) => setMember({ ...member, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Organisation</span>
            <input
              value={member.organisation || ''}
              onChange={(e) => setMember({ ...member, organisation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Province</span>
            <select
              value={member.province || ''}
              onChange={(e) => setMember({ ...member, province: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
            >
              <option value="">—</option>
              {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">City</span>
            <input
              value={member.city || ''}
              onChange={(e) => setMember({ ...member, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
            />
          </label>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2 block">Your disciplines</span>
          <p className="text-xs text-gray-500 mb-3">Select every discipline you practise in. This shapes your voting eligibility in discipline working groups.</p>
          <div className="flex flex-wrap gap-2">
            {CDCC_DISCIPLINES.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => toggleDiscipline(d)}
                className={`px-3 py-1.5 text-xs border transition-colors ${
                  member.disciplines.includes(d)
                    ? 'bg-black text-white border-black'
                    : 'border-gray-300 text-gray-600 hover:border-black hover:text-black'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Bio</span>
          <textarea
            rows={4}
            value={member.bio || ''}
            onChange={(e) => setMember({ ...member, bio: e.target.value })}
            placeholder="A short professional bio — shown in the member directory if you opt in."
            className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
          />
        </label>

        <div className="grid md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Website</span>
            <input
              value={member.website_url || ''}
              onChange={(e) => setMember({ ...member, website_url: e.target.value })}
              placeholder="https://"
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">LinkedIn</span>
            <input
              value={member.linkedin_url || ''}
              onChange={(e) => setMember({ ...member, linkedin_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1 block">Twitter handle</span>
            <input
              value={member.twitter_handle || ''}
              onChange={(e) => setMember({ ...member, twitter_handle: e.target.value })}
              placeholder="@"
              className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-black"
            />
          </label>
        </div>

        <div className="border-t border-gray-200 pt-5 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={member.consent_directory}
              onChange={(e) => setMember({ ...member, consent_directory: e.target.checked })}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-medium">List me in the public member directory.</span>
              <span className="block text-gray-500 text-xs">Your name, organisation, and disciplines will be visible.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={member.consent_marketing}
              onChange={(e) => setMember({ ...member, consent_marketing: e.target.checked })}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-medium">Send me Council newsletters and event announcements.</span>
              <span className="block text-gray-500 text-xs">You can unsubscribe at any time.</span>
            </span>
          </label>
        </div>

        {message && (
          <div className={`p-3 text-sm border ${message.kind === 'ok' ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white text-xs uppercase tracking-[0.15em] px-6 py-3 font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
