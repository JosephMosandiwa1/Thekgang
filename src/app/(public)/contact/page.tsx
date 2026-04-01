'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Write to Supabase contact table
    setSubmitted(true);
  }

  return (
    <div className="pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-black font-semibold mb-3">Contact</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-black tracking-tight mb-4">Get in touch.</h1>
        <p className="text-sm text-gray-500 max-w-xl mb-12">Have a question, partnership proposal, or just want to connect? We&apos;d love to hear from you.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                    className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Message</label>
                  <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={5} required
                    className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black bg-white rounded resize-none" />
                </div>
                <button type="submit" className="w-full bg-black text-white text-xs font-medium tracking-[0.15em] uppercase py-4 hover:bg-black-light transition-colors rounded">
                  Send Message
                </button>
              </form>
            ) : (
              <div className="border border-green-600/30 bg-green-600/5 rounded p-8 text-center">
                <p className="font-display text-lg font-bold text-black mb-2">Message sent.</p>
                <p className="text-sm text-gray-500">Thank you, {form.name.split(' ')[0]}. We&apos;ll get back to you soon.</p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Email</p>
              <p className="text-sm text-black">info@thekgang.org.za</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Board Contact</p>
              <p className="text-sm text-black">Melvin Kaabwe, Secretary &amp; Spokesperson</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-2">Mandate</p>
              <p className="text-sm text-gray-500">Book Publishing, Manufacturing &amp; Distribution Cluster</p>
              <p className="text-xs text-gray-500/50 mt-1">DSAC Cultural &amp; Creative Industries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
